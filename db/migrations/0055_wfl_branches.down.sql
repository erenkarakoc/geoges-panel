-- Reverses 0055_wfl_branches.sql. Branch runs are ordinary runs, so the rows stay; only the
-- columns that made them branches and the functions that opened them go away.
drop function wfl.branch_parent(uuid);
drop function wfl.branch_state(uuid);
drop function wfl.start_branch(uuid, uuid, text, text, jsonb);

delete from wfl.run_log where kind in ('branch_opened', 'branch_joined');
alter table wfl.run_log drop constraint ck_run_log__kind;
alter table wfl.run_log add constraint ck_run_log__kind
  check (kind in ('started', 'entered', 'left', 'waiting', 'failed', 'limit', 'ended'));

update wfl.instance set trigger_kind = 'manual' where trigger_kind = 'branch';
alter table wfl.instance drop constraint ck_instance__trigger;
alter table wfl.instance add constraint ck_instance__trigger
  check (trigger_kind in ('event', 'clock', 'threshold', 'manual'));

alter table wfl.instance drop constraint ck_instance__branch;
drop index wfl.ix_instance__branch_running;
drop index wfl.ix_instance__parent;
alter table wfl.instance
  drop column depth,
  drop column start_step_id,
  drop column branch_label,
  drop column parent_step_state_id,
  drop column parent_instance_id;
