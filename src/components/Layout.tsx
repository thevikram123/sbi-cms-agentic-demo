import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Activity, BellRing, Bot, Building2, ChevronLeft, ChevronRight, FileCheck2, LayoutDashboard, Radio, ShieldCheck } from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';

const nav = [
  { to: '/', label: 'Command Dashboard', icon: LayoutDashboard, end: true },
  { to: '/alerts', label: 'Live Alerts', icon: BellRing },
  { to: '/incidents', label: 'Incident Workspace', icon: ShieldCheck },
  { to: '/digital-twin', label: 'Cameras & Digital Twin', icon: Building2 },
  { to: '/operator-agent', label: 'Agentic Operator', icon: Bot },
  { to: '/audit', label: 'Audit & Compliance', icon: FileCheck2 },
];

export default function Layout() {
  const [compact, setCompact] = useState(false);
  const { incidents } = useIncidents();
  const live = incidents.filter(i => !['resolved', 'closed'].includes(i.status)).length;
  const critical = incidents.filter(i => i.severity === 'critical' && !['resolved', 'closed'].includes(i.status)).length;
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup"><div className="sbi-mark" aria-label="SBI"><span /></div><div><strong>SBI</strong><small>Centralised Monitoring System</small></div></div>
        <div className="top-signals" aria-label="System status">
          <span><Radio size={14} /> 1,198 / 1,200 cameras online</span><span className="alert-signal"><BellRing size={14} /> {critical} critical</span><span><Activity size={14} /> 99.84% availability</span>
        </div>
        <div className="demo-chip">DEMO / ON-PREM SIMULATION</div>
      </header>
      <aside className={`sidebar ${compact ? 'compact' : ''}`}>
        <button className="collapse" onClick={() => setCompact(v => !v)} aria-label="Toggle navigation">{compact ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
        <div className="operator"><div className="operator-avatar">AK</div>{!compact && <div><strong>Arun Kumar</strong><small>LHO Supervisor • Mumbai</small></div>}</div>
        <nav>{nav.map(item => <NavLink key={item.to} to={item.to} end={item.end} title={item.label} className={({ isActive }) => isActive ? 'active' : ''}><item.icon size={19} />{!compact && <span>{item.label}</span>}</NavLink>)}</nav>
        {!compact && <div className="shift-card"><span>SHIFT 02</span><strong>{live} active incidents</strong><small>14:00–22:00 IST</small></div>}
      </aside>
      <main className={compact ? 'compact-main' : ''}><Outlet /></main>
      <footer className="statusbar"><span><i /> All integrations nominal</span><span>Gemini vision • Mistral operator • Supabase realtime</span><span>03 SEP 2026 • 14:39 IST</span></footer>
    </div>
  );
}
