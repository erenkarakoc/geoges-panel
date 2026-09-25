-- 0058 — the queue also says whose place a delegate is standing in (TASK-0120, REQ-IAM-020).
--
-- 0057 told the queue *that* an approval is here through a delegation. The screen has to say whose:
-- "Ayşe Yılmaz adına vekâleten sizde" is the sentence, and it needs the person the approval belongs
-- to. One column more on the same answer, and the person's name is looked up where names live.

drop function wfl.my_approvals();

create function wfl.my_approvals()
returns table (
  id uuid,
  instance_id uuid,
  step_id text,
  title text,
  record_schema text,
  record_table text,
  record_id uuid,
  created_at timestamptz,
  owner_rule jsonb,
  /** Whose approval it is, when it belongs to one person; null when it belongs to a group. */
  owner_user_id uuid,
  /** True when it is in this queue through a delegation rather than the person's own place. */
  delegated boolean,
  flow_key text,
  flow_name text,
  flow_version integer,
  /** How many times this run has been sent back for correction already (REQ-WFL-016). */
  returned_before integer,
  /** Why it was sent back the last time, so the approver sees what was asked for. */
  last_return_reason text
)
language sql stable security definer
set search_path = ''
as $$
  select a.id, a.instance_id, a.step_id, a.title,
         a.record_schema, a.record_table, a.record_id, a.created_at, a.owner_rule, a.owner_user_id,
         (a.owner_user_id is not null and a.owner_user_id <> core.current_user_id()) as delegated,
         f.key as flow_key, f.name as flow_name, v.version as flow_version,
         (select pg_catalog.count(*)::integer from wfl.approval r
           where r.instance_id = a.instance_id and r.decision = 'return') as returned_before,
         (select r.reason from wfl.approval r
           where r.instance_id = a.instance_id and r.decision = 'return'
           order by r.decided_at desc limit 1) as last_return_reason
    from wfl.approval a
    join wfl.instance i on i.id = a.instance_id
    join wfl.flow_version v on v.id = i.flow_version_id
    join wfl.flow f on f.id = v.flow_id
   where a.status = 'waiting'
     and wfl.approval_is_mine(a.owner_user_id, a.owner_rule)
   order by a.created_at
$$;

comment on function wfl.my_approvals() is
  'The approvals waiting on the caller, with what the queue has to show about each (SCR-012).';

revoke all on function wfl.my_approvals() from public;
grant execute on function wfl.my_approvals() to geoges_app;
