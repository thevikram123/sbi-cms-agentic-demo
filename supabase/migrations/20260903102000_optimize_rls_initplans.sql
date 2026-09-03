-- Cache the JWT once per statement instead of invoking auth.jwt() per row.
do $$
declare
  t text;
begin
  foreach t in array array[
    'circles','branches','cameras','devices','incidents','alerts','incident_events',
    'evidence','ai_findings','incident_actions','escalations','sops','sop_steps',
    'knowledge_chunks','chat_sessions','chat_messages','tool_executions',
    'video_analysis_cache','audit_log'
  ] loop
    execute format('drop policy if exists role_read on public.%I',t);
    execute format(
      'create policy role_read on public.%I for select to authenticated using (((select auth.jwt())->''app_metadata''->>''role'') in (''lho_operator'',''lho_supervisor'',''cc_readonly'',''demo_admin''))',
      t
    );
  end loop;
end $$;
