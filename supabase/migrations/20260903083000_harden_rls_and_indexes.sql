alter function private.reject_audit_mutation() set search_path = '';

create index branches_circle_id_idx on public.branches(circle_id);
create index cameras_branch_id_idx on public.cameras(branch_id);
create index devices_branch_id_idx on public.devices(branch_id);
create index incidents_camera_id_idx on public.incidents(camera_id);
create index alerts_incident_id_idx on public.alerts(incident_id);
create index ai_findings_incident_id_idx on public.ai_findings(incident_id);
create index ai_findings_validator_idx on public.ai_findings(human_validated_by);
create index evidence_incident_id_idx on public.evidence(incident_id);
create index actions_incident_id_idx on public.incident_actions(incident_id);
create index actions_actor_id_idx on public.incident_actions(actor_id);
create index escalations_incident_id_idx on public.escalations(incident_id);
create index chat_sessions_user_id_idx on public.chat_sessions(user_id);
create index chat_messages_session_id_idx on public.chat_messages(session_id);
create index tool_executions_session_id_idx on public.tool_executions(session_id);
create index profiles_circle_id_idx on public.profiles(circle_id);

do $$
declare t text;
begin
  foreach t in array array['circles','branches','cameras','devices','incidents','alerts','incident_events','evidence','ai_findings','incident_actions','escalations','sops','sop_steps','knowledge_chunks','chat_sessions','chat_messages','tool_executions','video_analysis_cache','audit_log'] loop
    execute format('create policy role_read on public.%I for select to authenticated using ((select auth.jwt()->''app_metadata''->>''role'') in (''lho_operator'',''lho_supervisor'',''cc_readonly'',''demo_admin''))',t);
  end loop;
end $$;

create policy own_chat_session_insert on public.chat_sessions for insert to authenticated with check((select auth.uid())=user_id);
create policy own_chat_message_insert on public.chat_messages for insert to authenticated with check(session_id in(select id from public.chat_sessions where user_id=(select auth.uid())));
