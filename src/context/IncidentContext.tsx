import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { initialIncidents } from '../data/demoData';
import type { AuditEntry, Incident, IncidentStatus } from '../types';

interface IncidentContextValue { incidents: Incident[]; audits: AuditEntry[]; updateStatus: (id: string, status: IncidentStatus, note?: string) => void; assign: (id: string, assignee: string) => void; }
const Context = createContext<IncidentContextValue | undefined>(undefined);
const hash = () => crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase();

export function IncidentProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState(initialIncidents);
  const [audits, setAudits] = useState<AuditEntry[]>([
    { id: 'AUD-90031', timestamp: '14:38:35', action: 'INCIDENT_CREATED', actor: 'CMS Orchestrator', detail: 'U.17 threat incident created from correlated signals.', incidentId: 'SBI-INC-00421', hash: 'A91C8D773EF44B02' },
    { id: 'AUD-90030', timestamp: '14:38:34', action: 'SIGNALS_CORRELATED', actor: 'Rules Engine', detail: 'Video observation correlated with panic-zone activity.', incidentId: 'SBI-INC-00421', hash: '01B48FE2C6D81A9F' },
    { id: 'AUD-90029', timestamp: '14:38:31', action: 'AI_ANALYSIS_CACHED', actor: 'Gemini 3.1 Flash-Lite', detail: 'Structured video analysis stored under immutable media hash.', incidentId: 'SBI-INC-00421', hash: 'EAB94CF18B24D5C1' },
  ]);
  const appendAudit = useCallback((action: string, detail: string, incidentId?: string) => setAudits(current => [{ id: `AUD-${90032 + current.length}`, timestamp: new Date().toLocaleTimeString('en-GB'), action, actor: 'OPR-792', detail, incidentId, hash: hash() }, ...current]), []);
  const updateStatus = useCallback((id: string, status: IncidentStatus, note?: string) => {
    setIncidents(current => current.map(item => item.id === id ? { ...item, status, assignee: item.assignee === 'Unassigned' ? 'OPR-792' : item.assignee, timeline: [...item.timeline, { time: new Date().toLocaleTimeString('en-GB'), label: status.replace('_', ' '), detail: note || `Operator moved incident to ${status}.`, actor: 'OPR-792' }] } : item));
    appendAudit(`INCIDENT_${status.toUpperCase()}`, note || `Lifecycle advanced to ${status}.`, id);
  }, [appendAudit]);
  const assign = useCallback((id: string, assignee: string) => { setIncidents(current => current.map(item => item.id === id ? { ...item, assignee } : item)); appendAudit('INCIDENT_ASSIGNED', `Assigned to ${assignee}.`, id); }, [appendAudit]);
  const value = useMemo(() => ({ incidents, audits, updateStatus, assign }), [incidents, audits, updateStatus, assign]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useIncidents() { const value = useContext(Context); if (!value) throw new Error('useIncidents must be used inside IncidentProvider'); return value; }
