-- 0057 — why an approval is with you, and approvals that belong to a group
-- (TASK-0120, REQ-WFL-013, REQ-WFL-017, REQ-WFL-033, REQ-IAM-020, REQ-IAM-025, REQ-IAM-026, D-285).
--
-- Two things are missing before the approval centre can be honest with people.
--
-- First: the engine works out who a step falls to, but it does not write down *how*. "Why is this
-- with me" is then unanswerable, and the requirements ask for the answer in the person's own words —
-- "because you hold this role", "because you are the site's coordinator". So the rule travels with
-- the approval, as the definition wrote it. The sentence is composed where the names live (the
-- screen), not stored here, because a role that is renamed must not leave old approvals explaining
-- themselves with the old name.
--
-- Second: an approval does not always belong to one person. An owner approval is every owner's and
-- any one of them completes it (REQ-IAM-025, REQ-IAM-026), and a step addressed by role or by
-- permission means whoever holds it. So the owner may be a rule rather than a row, and who may see
-- and decide is answered from that rule — by the database, on every read, from live assignments,
-- which is also what makes a person's leaving or changing role take effect by itself
-- (REQ-WFL-017).
--
-- A delegate (REQ-IAM-020) sees what the person they stand in for sees. Only a company-wide
-- delegation does so for now, and deliberately: an approval carries the record's address but not
-- its scope, so a delegation limited to one site cannot be checked against it yet. Showing less
-- than the delegation allows is the safe direction; when records carry their scope this gets
-- stricter, not looser.

-- ---------------------------------------------------------------------------------------------
-- What IAM has to answer for this (asked as functions, so no module reads another's tables)
-- ---------------------------------------------------------------------------------------------

/** Does the person asking hold this role today? The role is named as a flow definition names it. */
create function iam.holds_role_code(p_code text) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (select from iam.active_assignments(core.current_user_id()) a
                  join iam.role r on r.id = a.role_id
                 where r.code = p_code)
$$;

comment on function iam.holds_role_code(text) is
  'Whether the caller holds the role with this code today (REQ-WFL-017).';

/**
 * Is the person asking standing in for this one today (REQ-IAM-020)? Only a company-wide
 * delegation answers yes here; a scoped delegation needs the record's scope, which an approval does
 * not carry yet.
 */
create function iam.stands_in_for(p_user uuid) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select from iam.role_assignment x
     where x.is_delegation
       and x.user_id = core.current_user_id()
       and x.delegated_by_user_id = p_user
       and x.starts_on <= iam.today() and x.ends_on >= iam.today()
       and iam.covers(x.scope_type, x.scope_ids, 'company', null)
       and exists (select from iam.active_assignments(x.user_id)))
$$;

comment on function iam.stands_in_for(uuid) is
  'Whether the caller holds an active company-wide delegation from this person (REQ-IAM-020).';

revoke all on function iam.holds_role_code(text), iam.stands_in_for(uuid) from public;
grant execute on function iam.holds_role_code(text), iam.stands_in_for(uuid)
  to geoges_app, geoges_worker;

-- ---------------------------------------------------------------------------------------------
-- The approval carries its own addressing rule, and may belong to a group
-- ---------------------------------------------------------------------------------------------

alter table wfl.approval
  alter column owner_user_id drop not null,
  add column owner_rule jsonb not null default '{}'::jsonb;

comment on column wfl.approval.owner_rule is
  'How the step addressed this approval, as the definition wrote it (D-097, REQ-WFL-013).';

-- Addressed to somebody: a person, or a rule that says which people.
alter table wfl.approval add constraint ck_approval__addressed check (
  owner_user_id is not null or owner_rule ? 'type');

-- The waiting index only helped a person's own queue; a group's approvals are found by rule.
drop index if exists wfl.ix_approval__waiting;
create index ix_approval__waiting on wfl.approval (created_at)
  where status = 'waiting';
create index ix_approval__waiting_owner on wfl.approval (owner_user_id, created_at)
  where status = 'waiting' and owner_user_id is not null;

/**
 * Is this approval mine to see and to answer (REQ-WFL-017, REQ-IAM-020, REQ-IAM-025)?
 *
 * One question, asked in one place, used by the row security policy, by the decision and by the
 * queue's own read — so a screen cannot show an approval the database would refuse to let the same
 * person decide.
 */
create function wfl.approval_is_mine(p_owner_user_id uuid, p_owner_rule jsonb) returns boolean
language sql stable security definer
set search_path = ''
as $$
  select case
    when p_owner_user_id is not null then
      p_owner_user_id = core.current_user_id() or iam.stands_in_for(p_owner_user_id)
    when p_owner_rule->>'type' = 'role' then iam.holds_role_code(p_owner_rule->>'role')
    when p_owner_rule->>'type' = 'permission' then
      iam.has_permission(p_owner_rule->>'permission')
    when p_owner_rule->>'type' = 'owner_layer' then iam.is_owner_layer()
    else false
  end
$$;

comment on function wfl.approval_is_mine(uuid, jsonb) is
  'Whether the caller is one of the people this approval belongs to (REQ-WFL-017).';

revoke all on function wfl.approval_is_mine(uuid, jsonb) from public;
grant execute on function wfl.approval_is_mine(uuid, jsonb) to geoges_app, geoges_worker;

-- Whoever the approval belongs to sees it, and so does whoever may design flows, because they
-- answer for what the queue is doing.
drop policy approval_read on wfl.approval;
create policy approval_read on wfl.approval for select to geoges_app
  using (
    (select wfl.approval_is_mine(owner_user_id, owner_rule))
    or (select iam.has_permission('wfl.workflow.design'))
  );

-- ---------------------------------------------------------------------------------------------
-- Opening and deciding, with the rule in hand
-- ---------------------------------------------------------------------------------------------

drop function wfl.request_approval(uuid, uuid, text, text, uuid);

/**
 * Opens the approval a step is waiting on. The engine's, not a person's.
 *
 * The owner may be a person the engine worked out, or nobody at all when the rule addresses a group;
 * either way the rule itself is written down, because that is what the queue shows and what decides
 * who may answer.
 */
create function wfl.request_approval(p_instance_id uuid, p_step_state_id uuid, p_step_id text,
                                     p_title text, p_owner_user_id uuid,
                                     p_owner_rule jsonb default '{}'::jsonb)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  i record;
  new_id uuid;
begin
  -- `if not found`, not `if i is null`: a record whose every column came back null reads as null,
  -- and an instance started by hand about no particular record has exactly that shape. The version
  -- this replaces asked the wrong question and refused such a run; a test caught it.
  select id, record_schema, record_table, record_id into i
    from wfl.instance where id = p_instance_id and status = 'running';
  if not found then
    raise exception 'this instance is not running'
      using errcode = 'P0001', hint = 'wfl.not_running';
  end if;
  if p_owner_user_id is null and not (coalesce(p_owner_rule, '{}'::jsonb) ? 'type') then
    raise exception 'an approval is addressed to somebody'
      using errcode = 'P0001', hint = 'wfl.no_owner';
  end if;

  insert into wfl.approval (instance_id, step_state_id, step_id, title, owner_user_id, owner_rule,
                            record_schema, record_table, record_id)
  values (p_instance_id, p_step_state_id, p_step_id, p_title, p_owner_user_id,
          coalesce(p_owner_rule, '{}'::jsonb), i.record_schema, i.record_table, i.record_id)
  on conflict (step_state_id) do nothing
  returning id into new_id;

  if new_id is null then
    select id into new_id from wfl.approval where step_state_id = p_step_state_id;
  end if;
  return new_id;
end
$$;

revoke all on function wfl.request_approval(uuid, uuid, text, text, uuid, jsonb) from public;
grant execute on function wfl.request_approval(uuid, uuid, text, text, uuid, jsonb) to geoges_worker;

create or replace function wfl.decide_approval(p_approval_id uuid, p_decision text,
                                               p_reason text default null)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  a record;
begin
  select * into a from wfl.approval where id = p_approval_id;
  if a is null then
    raise exception 'no such approval' using errcode = 'P0001', hint = 'wfl.no_approval';
  end if;
  -- One question decides this, and the row security policy asks the same one (REQ-IAM-025).
  if not wfl.approval_is_mine(a.owner_user_id, a.owner_rule) then
    raise exception 'this approval belongs to somebody else'
      using errcode = 'P0001', hint = 'wfl.not_your_approval';
  end if;
  if a.status = 'decided' then
    return false;
  end if;
  if p_decision not in ('approve', 'reject', 'return') then
    raise exception 'an approval is approved, rejected or sent back'
      using errcode = 'P0001', hint = 'wfl.bad_decision';
  end if;
  if p_decision <> 'approve'
     and (p_reason is null or pg_catalog.length(pg_catalog.btrim(p_reason)) < 3) then
    raise exception 'a refusal or a send-back says why'
      using errcode = 'P0001', hint = 'wfl.reason_required';
  end if;

  update wfl.approval
     set status = 'decided', decision = p_decision, reason = pg_catalog.btrim(p_reason),
         decided_by_user_id = core.current_user_id(), decided_at = pg_catalog.now()
   where id = p_approval_id;

  insert into aud.audit_log (event_type, actor_user_id, target_schema, target_table, target_id,
                             payload)
  values ('approval.decided', core.current_user_id(), 'wfl', 'approval', p_approval_id,
          pg_catalog.jsonb_build_object('decision', p_decision, 'instance', a.instance_id,
                                        'step', a.step_id));

  perform core.publish_event('approval.decided', 'wfl', 'wfl', 'approval', p_approval_id,
                             pg_catalog.jsonb_build_object('decision', p_decision,
                                                           'instance', a.instance_id,
                                                           'step', a.step_id),
                             1, a.instance_id::text);
  return true;
end
$$;

-- ---------------------------------------------------------------------------------------------
-- The queue's own read
-- ---------------------------------------------------------------------------------------------

/**
 * Everything the approval centre needs about the approvals waiting on the person asking
 * (SCR-012, REQ-WFL-012, REQ-WFL-013, REQ-WFL-016).
 *
 * It is one function rather than a join in the application because of what it has to reach: the
 * flow's name, the step, and whether this record has been sent back before. Those live on rows the
 * approver has no business reading in general — so the function answers only for approvals that are
 * already theirs, and answers nothing else.
 */
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
         a.record_schema, a.record_table, a.record_id, a.created_at, a.owner_rule,
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

/** How many approvals are waiting on this person: the badge the work layer and "Bugün" show. */
create function wfl.my_approval_count() returns integer
language sql stable security definer
set search_path = ''
as $$
  select pg_catalog.count(*)::integer
    from wfl.approval a
   where a.status = 'waiting' and wfl.approval_is_mine(a.owner_user_id, a.owner_rule)
$$;

revoke all on function wfl.my_approval_count() from public;
grant execute on function wfl.my_approval_count() to geoges_app;
