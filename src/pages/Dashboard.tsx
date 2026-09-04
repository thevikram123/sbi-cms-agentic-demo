import { ArrowRight, Bot, Clock3, Radio, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { branchRisk, scenarios, trendData } from '../data/demoData';
import { useIncidents } from '../context/IncidentContext';
import SecureCameraVideo from '../components/SecureCameraVideo';

export default function Dashboard() {
  const { incidents } = useIncidents();
  const active = incidents.filter(i => !['resolved', 'closed'].includes(i.status));
  const breached = active.filter(i => i.ageMinutes > i.slaMinutes).length;
  return <div className="page">
    <div className="page-heading"><div><p className="eyebrow">LHO OPERATIONS • MUMBAI</p><h1>Command overview</h1><p>One operational picture across video, ACS, SAS and life-safety systems.</p></div><div className="toolbar"><Link className="button primary" to="/incidents/SBI-INC-00421"><ShieldAlert size={14}/> Run golden path</Link><Link className="button dark" to="/operator-agent"><Bot size={14}/> Ask operator agent</Link></div></div>
    <section className="metrics">
      <div className="metric"><label>Active incidents</label><strong>{active.length}</strong><small>Across 17 SBI circles</small></div>
      <div className="metric red"><label>Critical now</label><strong>{active.filter(i=>i.severity==='critical').length}</strong><small>2-minute acknowledgement SLA</small></div>
      <div className="metric red"><label>SLA at risk / breached</label><strong>{breached}</strong><small>Supervisor attention required</small></div>
      <div className="metric green"><label>Integrated devices</label><strong>1,998</strong><small>99.84% reporting normally</small></div>
    </section>
    <section className="panel camera-wall-panel">
      <div className="panel-head"><h2>SBI branch camera wall</h2><span>9 LIVE FEEDS • SYNTHETIC DEMO FOOTAGE</span></div>
      <div className="camera-wall">
        {scenarios.map((camera, index) => <article className="camera-tile" key={camera.id}>
          <SecureCameraVideo assetId={camera.id} priority={index < 3} autoPlay muted loop playsInline preload="metadata" />
          <div className="camera-tile-top"><span className={`camera-state ${camera.state}`}>{camera.state === 'alert' ? 'Alert' : camera.state === 'watch' ? 'Watch' : 'Live'}</span><span>{camera.id}</span></div>
          <div className="camera-tile-copy"><strong>{camera.name}</strong><small>{camera.source} • Mumbai LHO</small></div>
          <Link className="camera-analyze" to={`/incidents/${camera.incidentId}`}>Open analysis →</Link>
        </article>)}
      </div>
    </section>
    <div className="grid-main">
      <div className="stack">
        <section className="panel"><div className="panel-head"><h2>Priority incident queue</h2><span>REALTIME • REPRESENTATIVE PILOT DATA</span></div><div className="incident-list">
          {incidents.slice(0,5).map(i=><Link className="incident-row" to={`/incidents/${i.id}`} key={i.id}><span className="badge">unreviewed</span><div><strong>Video evidence awaiting review</strong><small>{i.id} • classification pending</small></div><div><strong>{i.branch}</strong><small>{i.camera}</small></div><div><strong>{i.ageMinutes} min</strong><small>Evidence age</small></div><span className={`badge ${i.status}`}>{i.status.replace('_',' ')}</span></Link>)}
        </div></section>
        <section className="panel"><div className="panel-head"><h2>Seven-day monitoring volume</h2><span>ALERT-TO-INCIDENT CONVERSION 25.8%</span></div><div className="panel-body" style={{height:230}}><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><defs><linearGradient id="sbiFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0CB1F2" stopOpacity={.3}/><stop offset="1" stopColor="#0CB1F2" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#e8eef0" vertical={false}/><XAxis dataKey="day" tick={{fontSize:9}} axisLine={false}/><YAxis tick={{fontSize:9}} axisLine={false}/><Tooltip/><Area type="monotone" dataKey="alerts" stroke="#0CB1F2" fill="url(#sbiFill)" strokeWidth={2}/><Area type="monotone" dataKey="incidents" stroke="#111" fill="transparent" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></section>
      </div>
      <aside className="stack">
        <section className="panel"><div className="panel-head"><h2>Risk by circle</h2><span>LAST 30 DAYS</span></div><div className="panel-body">{branchRisk.map(r=><div className="risk-row" key={r.name}><strong>{r.name}</strong><div className="risk-bar"><i style={{width:`${r.score}%`}}/></div><span>{r.score}</span></div>)}</div></section>
        <section className="panel"><div className="panel-head"><h2>Agentic response chain</h2><Radio size={14}/></div><div className="panel-body"><div className="flow"><span>Detect</span><b>→</b><span>Correlate</span><b>→</b><span>Pre-classify</span><b>→</b><span>SOP</span><b>→</b><span>Human approval</span></div><div className="callout" style={{marginTop:14}}><strong>Why this wins technical points</strong><p>The system does not merely display alarms. It assembles evidence, reasons over SBI procedures and preserves operator authority with a complete audit trail.</p></div></div></section>
        <section className="panel"><div className="panel-head"><h2>Shift pulse</h2><Clock3 size={14}/></div><div className="panel-body"><div className="risk-row"><strong>Acknowledged</strong><div className="risk-bar"><i style={{width:'94%'}}/></div><span>94%</span></div><div className="risk-row"><strong>Resolved</strong><div className="risk-bar"><i style={{width:'81%'}}/></div><span>81%</span></div><Link to="/audit" className="button" style={{marginTop:10}}>Open compliance view <ArrowRight size={13}/></Link></div></section>
      </aside>
    </div>
  </div>;
}
