import { Braces, CheckCircle2, Play, Send, ShieldAlert, UserRoundCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIncidents } from '../context/IncidentContext';
import type { IncidentStatus } from '../types';

type TimelineEvent = { second: number; event: string };
type Keyframe = { second: number; caption: string };
type VideoAnalysis = {
  summary: string;
  what_happened?: string;
  people_count?: number;
  timeline?: TimelineEvent[];
  keyframes?: Keyframe[];
  people?: string[];
  objects?: string[];
  weapon_indication?: boolean;
  frisking_status?: string;
  threat_indicators?: string[];
  not_observed?: string[];
  confidence: number;
};
type AnalysisEnvelope = { cached: boolean; analyzedAt: string; result: VideoAnalysis };

const next: Record<IncidentStatus, IncidentStatus | undefined> = {
  triggered: 'acknowledged', acknowledged: 'under_action', under_action: 'resolved', resolved: 'closed', closed: undefined,
};

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 32768) binary += String.fromCharCode(...bytes.subarray(index, index + 32768));
  return btoa(binary);
}

export default function IncidentWorkspace() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const { incidents, updateStatus, assign } = useIncidents();
  const selected = useMemo(() => incidents.find(item => item.id === incidentId) || incidents[0], [incidents, incidentId]);
  const [confirmed, setConfirmed] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisEnvelope | null>(null);
  const [analysisState, setAnalysisState] = useState<'ready' | 'analyzing' | 'cached' | 'live' | 'degraded'>('ready');
  const [videoUrl, setVideoUrl] = useState(import.meta.env.DEV ? '/__evidence/primary.mp4' : '');
  const [videoState, setVideoState] = useState<'loading' | 'ready' | 'error'>(import.meta.env.DEV ? 'ready' : 'loading');

  const advance = () => {
    const state = next[selected.status];
    if (state && confirmed) {
      updateStatus(selected.id, state, `Operator confirmed ${state.replace('_', ' ')} after reviewing linked evidence and ${selected.sop}.`);
      setConfirmed(false);
    }
  };

  useEffect(() => {
    setAnalysis(null);
    setAnalysisState('ready');
    if (import.meta.env.DEV || selected.id !== 'SBI-INC-00421') return;
    const worker = import.meta.env.VITE_WORKER_URL as string | undefined;
    if (!worker) { setVideoState('error'); return; }
    let active = true;
    setVideoState('loading');
    fetch(`${worker}/api/evidence/PRIMARY_CCTV_001/url`)
      .then(async response => { if (!response.ok) throw new Error('Signed evidence unavailable'); return response.json() as Promise<{ url: string }>; })
      .then(payload => { if (active) { setVideoUrl(payload.url); setVideoState('ready'); } })
      .catch(() => { if (active) setVideoState('error'); });
    return () => { active = false; };
  }, [selected.id]);

  const analyze = async () => {
    if (!videoUrl || analysisState === 'analyzing') return;
    setAnalysisState('analyzing');
    try {
      const mediaResponse = await fetch(videoUrl);
      if (!mediaResponse.ok) throw new Error('Evidence fetch failed');
      const buffer = await (await mediaResponse.blob()).arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      const sha = [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
      const worker = import.meta.env.VITE_WORKER_URL as string | undefined;
      if (!worker) throw new Error('Worker URL missing');
      const requestBody: { assetId: string; mimeType: string; sha256: string; durationSeconds: number; videoBase64?: string } = { assetId: 'PRIMARY_CCTV_001', mimeType: 'video/mp4', sha256: sha, durationSeconds: 11 };
      let response = await fetch(`${worker}/api/video/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
      if (response.status === 409) {
        requestBody.videoBase64 = toBase64(buffer);
        response = await fetch(`${worker}/api/video/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
      }
      if (!response.ok) throw new Error(`Analysis failed (${response.status})`);
      const payload = await response.json() as AnalysisEnvelope;
      payload.result.confidence = payload.result.confidence <= 1 ? Math.round(payload.result.confidence * 100) : Math.round(payload.result.confidence);
      payload.result.people_count ??= payload.result.people?.length ?? 0;
      payload.result.what_happened ??= payload.result.summary;
      setAnalysis(payload);
      setAnalysisState(payload.cached ? 'cached' : 'live');
    } catch (error) {
      console.error(error);
      setAnalysisState('degraded');
    }
  };

  const result = analysis?.result;
  const structuredOutput = result ? {
    asset_id: 'PRIMARY_CCTV_001',
    people_count: result.people_count ?? result.people?.length ?? 0,
    what_happened: result.what_happened ?? result.summary,
    people: result.people ?? [], objects: result.objects ?? [], timeline: result.timeline ?? [], keyframes: result.keyframes ?? [],
    weapon_indication: result.weapon_indication ?? false,
    frisking_status: result.frisking_status ?? 'not determined',
    threat_indicators: result.threat_indicators ?? [], not_observed: result.not_observed ?? [],
    confidence_percent: result.confidence,
    cache_status: analysis?.cached ? 'cache_hit' : 'fresh_analysis', analyzed_at: analysis?.analyzedAt,
  } : null;

  return <div className="page">
    <div className="page-heading"><div><p className="eyebrow">INCIDENT MANAGEMENT SYSTEM</p><h1>Incident workspace</h1><p>Evidence, decisions and SLA clocks in one auditable workflow.</p></div><div className="toolbar"><button className="button" onClick={() => assign(selected.id, 'OPR-792')}><UserRoundCheck size={14}/>Assign to me</button><button className="button dark" disabled={!confirmed || !next[selected.status]} onClick={advance}><CheckCircle2 size={14}/>{next[selected.status] ? `Move to ${next[selected.status]?.replace('_', ' ')}` : 'Lifecycle complete'}</button></div></div>
    <div className="incident-layout">
      <aside className="panel incident-menu"><div className="panel-head"><h2>Priority queue</h2><span>{incidents.length}</span></div>{incidents.map(item => <div key={item.id} className={`incident-mini ${item.id === selected.id ? 'active' : ''}`} onClick={() => navigate(`/incidents/${item.id}`)}><span className={`badge ${item.severity}`}>{item.severity}</span><strong style={{ marginTop: 7 }}>{item.title}</strong><small>{item.id} • {item.ageMinutes} min</small></div>)}</aside>
      <section className="stack">
        <div className="panel"><div className="panel-head"><h2>{selected.id} • {selected.camera}</h2><button className="button primary" style={{ padding: '6px 9px' }} disabled={videoState !== 'ready' || analysisState === 'analyzing'} onClick={() => void analyze()}>{analysisState === 'analyzing' ? 'ANALYZING VIDEO…' : 'ANALYZE WITH VIDEO MODEL'}</button></div><div className="video-shell">{videoUrl && selected.id === 'SBI-INC-00421' ? <video controls preload="metadata" src={videoUrl} onError={() => setVideoState('error')}/> : <div className="video-empty"><div><Play size={28} style={{ margin: '0 auto 8px' }}/>{videoState === 'loading' ? 'Requesting signed evidence…' : videoState === 'error' ? 'Evidence playback unavailable' : 'Select the primary incident to review video'}<br/><small>{videoState === 'error' ? 'The signed URL could not be loaded' : 'Private Supabase object • 5-minute URL'}</small></div></div>}<div className="camera-label">{selected.camera} • {selected.evidenceTime} IST</div><div className="ai-stamp">{analysisState === 'live' ? 'FRESH ANALYSIS' : analysisState === 'cached' ? 'CACHE HIT' : analysisState === 'degraded' ? 'DEGRADED • RETRY' : 'VIDEO MODEL READY'} • {result?.confidence || selected.confidence}% CONFIDENCE</div></div><div className="detail-grid"><div><label>Location</label><strong>{selected.branch}</strong></div><div><label>Classification</label><strong>{selected.useCase} • {selected.severity}</strong></div><div><label>Assignee</label><strong>{selected.assignee}</strong></div></div></div>
        <div className="panel"><div className="panel-head"><h2>AI pre-classification</h2><span>HUMAN VALIDATION REQUIRED</span></div><div className="panel-body"><div className="callout"><strong>{selected.title}</strong><p>{result?.what_happened || result?.summary || selected.summary}</p></div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>{selected.signals.map(signal => <span className="badge" key={signal}>{signal}</span>)}</div></div></div>
        <div className="panel structured-panel"><div className="panel-head"><h2><Braces size={14}/> Video model structured output</h2><span>{analysis ? `${analysis.cached ? 'CACHE HIT' : 'FRESH'} • ${new Date(analysis.analyzedAt).toLocaleString('en-IN')}` : 'JSON SCHEMA • AWAITING ANALYSIS'}</span></div>{structuredOutput ? <><div className="analysis-kpis"><div><label>People</label><strong>{structuredOutput.people_count}</strong></div><div><label>Timeline events</label><strong>{structuredOutput.timeline.length}</strong></div><div><label>Weapon indicated</label><strong>{structuredOutput.weapon_indication ? 'Yes' : 'No'}</strong></div><div><label>Confidence</label><strong>{structuredOutput.confidence_percent}%</strong></div></div><pre className="analysis-json">{JSON.stringify(structuredOutput, null, 2)}</pre></> : <div className="analysis-empty"><Braces size={24}/><strong>Structured evidence is ready to generate</strong><span>Run the video model to return people count, visible events, objects, keyframes, threats, negative observations and confidence.</span></div>}</div>
      </section>
      <aside className="stack"><section className="panel"><div className="panel-head"><h2>Operator decision</h2><ShieldAlert size={14}/></div><div className="panel-body"><span className={`badge ${selected.status}`}>{selected.status.replace('_', ' ')}</span><p style={{ fontSize: 11, lineHeight: 1.6 }}>Review evidence and the recommended SOP before changing incident state.</p><label style={{ display: 'flex', gap: 8, fontSize: 10, lineHeight: 1.4 }}><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/> I confirm the evidence has been reviewed and approve this audited action.</label></div></section><section className="panel"><div className="panel-head"><h2>{selected.sop}</h2><Send size={14}/></div><div className="panel-body"><ol style={{ fontSize: 10, lineHeight: 1.8, paddingLeft: 17 }}><li>Acknowledge within {selected.slaMinutes} minutes.</li><li>Launch associated live camera and verify scene.</li><li>Notify branch authority and LHO supervisor.</li><li>Preserve evidence and record operator disposition.</li></ol></div></section><section className="panel"><div className="panel-head"><h2>Immutable timeline</h2><span>{selected.timeline.length} EVENTS</span></div><div className="panel-body timeline">{selected.timeline.map((event, index) => <div className="timeline-item" key={index}><time>{event.time}</time><strong>{event.label}</strong><p>{event.detail}</p><small>{event.actor}</small></div>)}</div></section></aside>
    </div>
  </div>;
}
