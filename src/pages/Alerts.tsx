import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useIncidents } from '../context/IncidentContext';

export default function Alerts(){
  const {incidents}=useIncidents(); const [severity,setSeverity]=useState('all'); const [query,setQuery]=useState('');
  const filtered=useMemo(()=>incidents.filter(i=>(severity==='all'||i.severity===severity)&&`${i.id} ${i.title} ${i.branch} ${i.useCase}`.toLowerCase().includes(query.toLowerCase())),[incidents,severity,query]);
  return <div className="page"><div className="page-heading"><div><p className="eyebrow">UNIFIED EVENT MANAGEMENT</p><h1>Live alerts</h1><p>AI and rules-based signals correlated into operator-ready incidents.</p></div><div style={{position:'relative'}}><Search size={14} style={{position:'absolute',left:10,top:11}}/><input className="search" style={{paddingLeft:32}} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search ID, branch or use case"/></div></div>
  <div className="filter-row"><SlidersHorizontal size={15}/>{['all','critical','high','medium','low'].map(s=><button key={s} className={severity===s?'active':''} onClick={()=>setSeverity(s)}>{s}</button>)}</div>
  <section className="panel"><div className="panel-head"><h2>{filtered.length} correlated alerts</h2><span>Updated 14:39:04 IST</span></div><div className="incident-list">{filtered.map(i=><Link className="incident-row" to={`/incidents/${i.id}`} key={i.id}><span className={`badge ${i.severity}`}>{i.severity}</span><div><strong>{i.title}</strong><small>{i.id} • {i.signals.length} correlated signals</small></div><div><strong>{i.branch}</strong><small>{i.circle} • {i.camera}</small></div><div><strong>{i.confidence}%</strong><small>AI confidence</small></div><span className={`badge ${i.status}`}>{i.status.replace('_',' ')}</span></Link>)}</div></section></div>
}
