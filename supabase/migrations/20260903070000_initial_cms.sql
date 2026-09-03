create extension if not exists vector with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create type public.incident_severity as enum ('critical','high','medium','low');
create type public.incident_status as enum ('triggered','acknowledged','under_action','resolved','closed');

create table public.circles (
  id uuid primary key default gen_random_uuid(), code text unique not null, name text not null,
  created_at timestamptz not null default now()
);
create table public.branches (
  id uuid primary key default gen_random_uuid(), circle_id uuid not null references public.circles(id),
  code text unique not null, name text not null, city text not null, risk_tier smallint not null check(risk_tier between 1 and 5),
  latitude numeric(9,6), longitude numeric(9,6), created_at timestamptz not null default now()
);
create table public.cameras (
  id uuid primary key default gen_random_uuid(), branch_id uuid not null references public.branches(id), code text unique not null,
  zone text not null, status text not null check(status in ('online','offline','maintenance')), last_heartbeat timestamptz not null
);
create table public.devices (
  id uuid primary key default gen_random_uuid(), branch_id uuid not null references public.branches(id), code text unique not null,
  device_type text not null check(device_type in ('ACS','SAS','PANIC','FIRE','NVR')), zone text not null,
  status text not null check(status in ('online','offline','maintenance')), last_heartbeat timestamptz not null
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade, display_name text not null, operator_code text unique not null,
  role text not null check(role in ('lho_operator','lho_supervisor','cc_readonly','demo_admin')), circle_id uuid references public.circles(id)
);
create table public.incidents (
  id bigint generated always as identity primary key, incident_no text unique not null, branch_id uuid not null references public.branches(id),
  camera_id uuid references public.cameras(id), use_case text not null, title text not null, summary text not null,
  severity public.incident_severity not null, status public.incident_status not null default 'triggered', confidence numeric(5,2),
  triggered_at timestamptz not null, acknowledged_at timestamptz, resolved_at timestamptz, closed_at timestamptz,
  acknowledgement_sla_minutes smallint not null, assignee_code text, disposition text, is_synthetic boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.alerts (
  id bigint generated always as identity primary key, alert_no text unique not null, incident_id bigint references public.incidents(id),
  branch_id uuid not null references public.branches(id), source text not null, event_type text not null,
  severity public.incident_severity not null, occurred_at timestamptz not null, payload jsonb not null default '{}'::jsonb
);
create table public.incident_events (
  id bigint generated always as identity primary key, incident_id bigint not null references public.incidents(id) on delete cascade,
  event_type text not null, actor text not null, detail text not null, occurred_at timestamptz not null, metadata jsonb not null default '{}'::jsonb
);
create table public.evidence (
  id uuid primary key default gen_random_uuid(), incident_id bigint not null references public.incidents(id) on delete cascade,
  asset_id text unique not null, storage_path text not null, mime_type text not null, sha256 text not null,
  captured_at timestamptz not null, pre_event_seconds smallint not null default 10, post_event_seconds smallint not null default 10,
  is_private boolean not null default true
);
create table public.ai_findings (
  id bigint generated always as identity primary key, incident_id bigint not null references public.incidents(id) on delete cascade,
  model text not null, model_version text not null, prompt_version text not null, confidence numeric(5,2),
  finding jsonb not null, created_at timestamptz not null default now(), human_validated_by uuid references auth.users(id), human_validated_at timestamptz
);
create table public.incident_actions (
  id bigint generated always as identity primary key, incident_id bigint not null references public.incidents(id) on delete cascade,
  action text not null, from_status public.incident_status, to_status public.incident_status, actor_id uuid references auth.users(id),
  actor_code text not null, confirmation_token_hash text, note text, created_at timestamptz not null default now()
);
create table public.escalations (
  id bigint generated always as identity primary key, incident_id bigint not null references public.incidents(id) on delete cascade,
  level smallint not null, recipient_role text not null, reason text not null, escalated_at timestamptz not null default now(), acknowledged_at timestamptz
);
create table public.sops (
  id uuid primary key default gen_random_uuid(), code text unique not null, title text not null, use_case text not null,
  severity public.incident_severity not null, version text not null, source_reference text not null, approved boolean not null default true
);
create table public.sop_steps (
  id bigint generated always as identity primary key, sop_id uuid not null references public.sops(id) on delete cascade,
  step_no smallint not null, instruction text not null, requires_approval boolean not null default false, unique(sop_id,step_no)
);
create table public.knowledge_chunks (
  id bigint generated always as identity primary key, source_type text not null, source_code text not null,
  title text not null, content text not null, fts tsvector generated always as(to_tsvector('english',title||' '||content)) stored,
  embedding extensions.vector(1024), metadata jsonb not null default '{}'::jsonb
);
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), created_at timestamptz not null default now()
);
create table public.chat_messages (
  id bigint generated always as identity primary key, session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check(role in ('user','assistant','tool')), content text not null, citations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create table public.tool_executions (
  id bigint generated always as identity primary key, session_id uuid references public.chat_sessions(id), tool_name text not null,
  arguments jsonb not null, result_summary text, mutation boolean not null default false, confirmation_token_hash text,
  created_at timestamptz not null default now()
);
create table public.video_analysis_cache (
  cache_key text primary key, asset_id text not null, model text not null, prompt_version text not null, schema_version text not null,
  sampling_fps numeric(4,2) not null, result jsonb not null, input_tokens integer, created_at timestamptz not null default now()
);
create table public.audit_log (
  id bigint generated always as identity primary key, event_id uuid unique not null default gen_random_uuid(), actor text not null,
  action text not null, entity_type text not null, entity_id text not null, detail jsonb not null default '{}'::jsonb,
  previous_hash text, event_hash text not null, created_at timestamptz not null default now()
);

create index incidents_branch_time_idx on public.incidents(branch_id,triggered_at desc);
create index incidents_status_severity_idx on public.incidents(status,severity,triggered_at desc);
create index alerts_branch_time_idx on public.alerts(branch_id,occurred_at desc);
create index events_incident_time_idx on public.incident_events(incident_id,occurred_at);
create index knowledge_fts_idx on public.knowledge_chunks using gin(fts);
create index knowledge_embedding_idx on public.knowledge_chunks using hnsw(embedding vector_cosine_ops);

create view public.dashboard_summary with(security_invoker=true) as
select count(*) filter(where status not in('resolved','closed')) active_incidents,
       count(*) filter(where severity='critical' and status not in('resolved','closed')) critical_incidents,
       round(100.0*count(*) filter(where acknowledged_at is not null and acknowledged_at<=triggered_at+make_interval(mins=>acknowledgement_sla_minutes))/nullif(count(*) filter(where acknowledged_at is not null),0),2) sla_compliance,
       'Representative pilot data'::text dataset
from public.incidents;
create view public.circle_sla_summary with(security_invoker=true) as
select c.name circle, count(*) incidents,
       round(100.0*count(*) filter(where i.acknowledged_at<=i.triggered_at+make_interval(mins=>i.acknowledgement_sla_minutes))/nullif(count(*) filter(where i.acknowledged_at is not null),0),2) sla_compliance
from public.incidents i join public.branches b on b.id=i.branch_id join public.circles c on c.id=b.circle_id group by c.name;

create function private.reject_audit_mutation() returns trigger language plpgsql as $$ begin raise exception 'audit_log is append-only'; end $$;
revoke all on function private.reject_audit_mutation() from public;
create trigger audit_log_immutable before update or delete on public.audit_log for each row execute function private.reject_audit_mutation();

do $$ declare t text; begin foreach t in array array['circles','branches','cameras','devices','profiles','incidents','alerts','incident_events','evidence','ai_findings','incident_actions','escalations','sops','sop_steps','knowledge_chunks','chat_sessions','chat_messages','tool_executions','video_analysis_cache','audit_log'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
create policy profiles_self_read on public.profiles for select to authenticated using((select auth.uid())=id);
create policy profiles_self_update on public.profiles for update to authenticated using((select auth.uid())=id) with check((select auth.uid())=id);

insert into public.circles(code,name) values
('AHM','Ahmedabad LHO'),('AMR','Amaravati LHO'),('BGL','Bengaluru LHO'),('BHP','Bhopal LHO'),('BHU','Bhubaneswar LHO'),('CHD','Chandigarh LHO'),('CHE','Chennai LHO'),('DEL','New Delhi LHO'),('GUW','Guwahati LHO'),('HYD','Hyderabad LHO'),('JAI','Jaipur LHO'),('KOL','Kolkata LHO'),('LUC','Lucknow LHO'),('MAH','Maharashtra LHO'),('MUM','Mumbai LHO'),('PAT','Patna LHO'),('THI','Thiruvananthapuram LHO');
insert into public.branches(circle_id,code,name,city,risk_tier,latitude,longitude)
select c.id,'BR-'||lpad(g::text,4,'0'),'SBI Representative Branch '||g,
       (array['Mumbai','Delhi','Chennai','Kolkata','Lucknow','Bengaluru','Hyderabad'])[1+((g-1)%7)],1+((g*7)%5),
       8.0+((g*37)%2100)/100.0,68.0+((g*53)%2800)/100.0
from generate_series(1,250) g join lateral(select id from public.circles order by code limit 1 offset ((g-1)%17)) c on true;
insert into public.cameras(branch_id,code,zone,status,last_heartbeat)
select b.id,'CAM-'||lpad(g::text,5,'0'),(array['Entrance','Teller Hall','Strong Room','ATM Lobby','Server Room'])[1+((g-1)%5)],case when g%503=0 then 'offline' when g%389=0 then 'maintenance' else 'online' end,now()-make_interval(secs=>(g%90))
from generate_series(1,1200) g join lateral(select id from public.branches order by code limit 1 offset ((g-1)%250)) b on true;
insert into public.devices(branch_id,code,device_type,zone,status,last_heartbeat)
select b.id,'DEV-'||lpad(g::text,5,'0'),(array['ACS','SAS','PANIC','FIRE','NVR'])[1+((g-1)%5)],(array['Entrance','Strong Room','Teller Hall','Electrical Room'])[1+((g-1)%4)],case when g%337=0 then 'offline' else 'online' end,now()-make_interval(secs=>(g%120))
from generate_series(1,800) g join lateral(select id from public.branches order by code limit 1 offset ((g-1)%250)) b on true;
insert into public.sops(code,title,use_case,severity,version,source_reference) values
('SOP-U12-FRISK-02','Missed or incomplete employee frisking','U.12','high','2.0','RFP U.12'),('SOP-U17-PANIC-01','Panic and threat response','U.17','critical','3.1','RFP U.17'),('SOP-ACS-TAILGATE-03','Denied credential and tailgating','ACS+CCTV','high','1.4','RFP PoC ACS+CCTV'),('SOP-SAS-VAULT-01','Strong-room intrusion response','SAS+CCTV','critical','2.2','RFP PoC SAS+CCTV'),('SOP-FIRE-01','Smoke and fire response','FIRE','critical','2.0','Life safety'),('SOP-DEVICE-04','Camera and NVR tampering','VIDEO HEALTH','medium','1.6','Device health'),('SOP-OBJECT-01','Abandoned object','OBJECT','high','1.1','Video analytics'),('SOP-INTRUSION-01','Perimeter intrusion','INTRUSION','high','1.3','Video analytics'),('SOP-CROWD-01','Crowd density escalation','CROWD','medium','1.1','Video analytics'),('SOP-FACE-01','Concealed face review','U.17','high','1.0','RFP U.17'),('SOP-PANIC-02','Panic button verification','U.17','critical','2.1','RFP U.17'),('SOP-DOWN-01','Person down emergency','U.17','critical','1.2','RFP U.17');
insert into public.sop_steps(sop_id,step_no,instruction,requires_approval)
select s.id,g,(array['Acknowledge the incident within the prescribed SLA.','Launch the associated live camera and verify the scene.','Notify branch authority and the LHO supervisor.','Preserve pre/post-event evidence and record disposition.'])[g],g in(3,4) from public.sops s cross join generate_series(1,4) g;
insert into public.knowledge_chunks(source_type,source_code,title,content,metadata)
select 'SOP',s.code,s.title,s.title||'. '||string_agg(st.instruction,' ' order by st.step_no),jsonb_build_object('use_case',s.use_case,'version',s.version,'source',s.source_reference) from public.sops s join public.sop_steps st on st.sop_id=s.id group by s.id;
insert into public.incidents(incident_no,branch_id,camera_id,use_case,title,summary,severity,status,confidence,triggered_at,acknowledged_at,resolved_at,acknowledgement_sla_minutes,assignee_code,disposition)
select 'SBI-INC-'||lpad(g::text,6,'0'),b.id,cam.id,(array['U.12','U.17','ACS+CCTV','SAS+CCTV','FIRE','VIDEO HEALTH','OBJECT','INTRUSION'])[1+((g-1)%8)],
       (array['Incomplete employee frisking','Threat posture near teller counter','Denied badge followed by tailgating','Strong-room access anomaly','Smoke detected in electrical room','NVR cabinet tampering','Abandoned object detected','Perimeter intrusion'])[1+((g-1)%8)],
       'Synthetic RFP-aligned incident generated for representative pilot analytics.',
       (array['high','critical','high','critical','critical','medium','high','high'])[1+((g-1)%8)]::public.incident_severity,
       (array['triggered','acknowledged','under_action','resolved','closed'])[1+((g-1)%5)]::public.incident_status,
       78+(g%21),now()-make_interval(hours=>(g%12960)),case when g%5=0 then null else now()-make_interval(hours=>(g%12960))+make_interval(mins=>(1+(g%9))) end,
       case when g%5 in(3,4) then now()-make_interval(hours=>(g%12960))+make_interval(mins=>(15+(g%180))) end,
       case when g%8 in(1,3,4) then 2 when g%8 in(0,2,6,7) then 5 else 15 end,'OPR-'||lpad((100+(g%700))::text,3,'0'),case when g%11=0 then 'false_positive' else 'confirmed' end
from generate_series(1,7500) g
join lateral(select id from public.branches order by code limit 1 offset ((g-1)%250)) b on true
join lateral(select id from public.cameras order by code limit 1 offset ((g-1)%1200)) cam on true;
insert into public.alerts(alert_no,incident_id,branch_id,source,event_type,severity,occurred_at,payload)
select 'SBI-ALT-'||lpad(g::text,7,'0'),i.id,i.branch_id,(array['VIDEO','ACS','SAS','PANIC','FIRE'])[1+((g-1)%5)],i.use_case,i.severity,i.triggered_at+make_interval(secs=>(g%8)),jsonb_build_object('synthetic',true,'correlation_group',i.incident_no)
from generate_series(1,30000) g join lateral(select * from public.incidents order by id limit 1 offset ((g-1)%7500)) i on true;
insert into public.incident_events(incident_id,event_type,actor,detail,occurred_at)
select i.id,(array['signal_detected','correlated','incident_created','acknowledged','operator_action'])[1+((g-1)%5)],(array['Gemini vision','Rules engine','CMS orchestrator','LHO operator'])[1+((g-1)%4)],'Synthetic immutable lifecycle event for RFP demonstration.',i.triggered_at+make_interval(secs=>(g%300))
from generate_series(1,25000) g join lateral(select * from public.incidents order by id limit 1 offset ((g-1)%7500)) i on true;
insert into public.audit_log(actor,action,entity_type,entity_id,detail,previous_hash,event_hash)
select e.actor,upper(e.event_type),'incident',i.incident_no,jsonb_build_object('event_id',e.id,'synthetic',true),null,encode(extensions.digest(i.incident_no||':'||e.id::text,'sha256'),'hex')
from public.incident_events e join public.incidents i on i.id=e.incident_id;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('evidence','evidence',false,12582912,array['video/mp4']) on conflict(id) do nothing;
