import type { Incident } from '../types';

const baseTimeline = (id: string, evidence: string) => [
  { time: evidence, label: 'Signal detected', detail: 'Video analytics generated a policy-relevant observation.', actor: 'Gemini vision' },
  { time: evidence, label: 'Correlation complete', detail: 'CMS correlated camera, access and safety signals.', actor: 'Rules engine' },
  { time: evidence, label: 'Incident created', detail: `${id} created with linked evidence and SLA clock.`, actor: 'CMS orchestrator' },
];

export const initialIncidents: Incident[] = [
  { id: 'SBI-INC-00421', useCase: 'U.17', title: 'Threat posture near teller counter', branch: 'Fort Branch • Mumbai', circle: 'Mumbai LHO', camera: 'CAM-FORT-03', severity: 'critical', status: 'triggered', confidence: 96, ageMinutes: 1, slaMinutes: 2, evidenceTime: '14:38:31', assignee: 'Unassigned', sop: 'SOP-U17-PANIC-01', summary: 'A person approached the teller area while staff movement indicated possible duress. Panic-zone activity was correlated within four seconds.', signals: ['Person approaching teller', 'Staff huddle', 'Panic zone active'], timeline: baseTimeline('SBI-INC-00421', '14:38:31') },
  { id: 'SBI-INC-00418', useCase: 'U.12', title: 'Incomplete employee frisking', branch: 'Bandra Kurla Complex • Mumbai', circle: 'Mumbai LHO', camera: 'CAM-BKC-11', severity: 'high', status: 'acknowledged', confidence: 93, ageMinutes: 7, slaMinutes: 5, evidenceTime: '14:31:08', assignee: 'OPR-792', sop: 'SOP-U12-FRISK-02', summary: 'The employee entered the restricted zone before all prescribed frisking checkpoints were completed.', signals: ['Lower-leg scan missing', 'Access granted', 'Guard present'], timeline: baseTimeline('SBI-INC-00418', '14:31:08') },
  { id: 'SBI-INC-00412', useCase: 'ACS+CCTV', title: 'Denied badge followed by tailgating', branch: 'Anna Salai • Chennai', circle: 'Chennai LHO', camera: 'CAM-AS-08', severity: 'high', status: 'under_action', confidence: 91, ageMinutes: 18, slaMinutes: 5, evidenceTime: '14:20:44', assignee: 'SUP-014', sop: 'SOP-ACS-TAILGATE-03', summary: 'A denied credential was followed by close-proximity entry behind an authorised employee.', signals: ['Badge denied', 'Door opened', 'Two persons crossed'], timeline: baseTimeline('SBI-INC-00412', '14:20:44') },
  { id: 'SBI-INC-00398', useCase: 'SAS+CCTV', title: 'Strong-room access anomaly', branch: 'Parliament Street • Delhi', circle: 'New Delhi LHO', camera: 'CAM-PS-21', severity: 'critical', status: 'resolved', confidence: 89, ageMinutes: 42, slaMinutes: 2, evidenceTime: '13:56:17', assignee: 'SUP-008', sop: 'SOP-SAS-VAULT-01', summary: 'Strong-room vibration and door-handle interaction occurred outside the approved access window.', signals: ['SAS zone alarm', 'Handle interaction', 'After-hours policy'], timeline: baseTimeline('SBI-INC-00398', '13:56:17') },
  { id: 'SBI-INC-00391', useCase: 'FIRE', title: 'Smoke detected in electrical room', branch: 'Salt Lake • Kolkata', circle: 'Kolkata LHO', camera: 'CAM-SL-04', severity: 'critical', status: 'under_action', confidence: 98, ageMinutes: 51, slaMinutes: 2, evidenceTime: '13:47:29', assignee: 'OPR-316', sop: 'SOP-FIRE-01', summary: 'Persistent smoke was observed near the substation panel and correlated with a detector pre-alarm.', signals: ['Visible smoke', 'Detector pre-alarm', 'Electrical room'], timeline: baseTimeline('SBI-INC-00391', '13:47:29') },
  { id: 'SBI-INC-00376', useCase: 'VIDEO HEALTH', title: 'NVR cabinet tampering', branch: 'Hazratganj • Lucknow', circle: 'Lucknow LHO', camera: 'CAM-HZ-12', severity: 'medium', status: 'closed', confidence: 87, ageMinutes: 95, slaMinutes: 15, evidenceTime: '13:03:02', assignee: 'OPR-447', sop: 'SOP-DEVICE-04', summary: 'A person opened the NVR enclosure and manipulated cabling during an unapproved maintenance window.', signals: ['Cabinet open', 'Cable interaction', 'No work order'], timeline: baseTimeline('SBI-INC-00376', '13:03:02') },
];

export const branchRisk = [
  { name: 'Mumbai', score: 82, incidents: 114, trend: '+8%' }, { name: 'New Delhi', score: 74, incidents: 96, trend: '-3%' },
  { name: 'Chennai', score: 68, incidents: 83, trend: '+4%' }, { name: 'Kolkata', score: 62, incidents: 71, trend: '-1%' },
  { name: 'Lucknow', score: 55, incidents: 64, trend: '+2%' },
];

export const trendData = [
  { day: '28 Aug', alerts: 128, incidents: 31 }, { day: '29 Aug', alerts: 154, incidents: 39 }, { day: '30 Aug', alerts: 139, incidents: 33 },
  { day: '31 Aug', alerts: 172, incidents: 46 }, { day: '01 Sep', alerts: 161, incidents: 42 }, { day: '02 Sep', alerts: 184, incidents: 51 }, { day: '03 Sep', alerts: 146, incidents: 38 },
];

export const scenarios = [
  ['UC-01', 'Strong-room threat', 'U.17', 'animate_no_drama_no_sensationalism_202609031411.mp4', 'Priority'],
  ['UC-02', 'Abandoned object', 'Video analytics', 'Bounding_box_and_alert_appear_202609031412.mp4', 'Ready'],
  ['UC-03', 'Camera tampering', 'Device health', 'Camera_zooms_in_label_appears_202609031425.mp4', 'Ready'],
  ['UC-04', 'RFID access', 'ACS + CCTV', 'Door_opens_after_RFID_scan_202609031418.mp4', 'Ready'],
  ['UC-05', 'Crowd density', 'Video analytics', 'Heatmap_appears_202609031417.mp4', 'Ready'],
  ['UC-06', 'Perimeter intrusion', 'SAS + CCTV', 'Intruder_detected_by_camera_202609031417.mp4', 'Ready'],
  ['UC-07', 'NVR tampering', 'Device health', 'Man_tampering_with_equipment_det…_202609031427.mp4', 'Ready'],
  ['UC-08', 'Face concealment', 'U.17', 'Person_walking_toward_bank_teller_202609031432.mp4', 'Priority'],
  ['UC-09', 'Frisking compliance', 'U.12', 'Security_officer_scanning_vault_…_202609031410.mp4', 'Priority'],
  ['UC-10', 'Panic activation', 'U.17', 'She_hits_panic_button_202609031417.mp4', 'Priority'],
  ['UC-11', 'Smoke / fire', 'Fire safety', 'Smoke_appears_alert_202609031425.mp4', 'Ready'],
].map(([id, name, source, video, status]) => ({ id, name, source, video, status }));
