export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'triggered' | 'acknowledged' | 'under_action' | 'resolved' | 'closed';

export interface TimelineEvent {
  time: string;
  label: string;
  detail: string;
  actor: string;
}

export interface Incident {
  id: string;
  useCase: string;
  title: string;
  branch: string;
  circle: string;
  camera: string;
  severity: Severity;
  status: IncidentStatus;
  confidence: number;
  ageMinutes: number;
  slaMinutes: number;
  summary: string;
  signals: string[];
  evidenceTime: string;
  sop: string;
  assignee: string;
  timeline: TimelineEvent[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  detail: string;
  incidentId?: string;
  hash: string;
}
