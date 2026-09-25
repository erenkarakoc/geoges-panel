-- 0059 — flow templates, and the copies made from them
-- (TASK-0120, REQ-WFL-027, REQ-WFL-028, D-086, D-285).
--
-- A template is not a flow. The panel ships with the company's default processes as templates; a
-- flow in use is a **copy** of one (D-086). That is the whole point of the arrangement: updating a
-- template must not reach into a copy somebody has since changed. So the copy records which template
-- and which version of it it came from, and the newer template announces itself instead of
-- overwriting anything (REQ-WFL-027).
--
-- "Reset to template" writes a new **draft** from the template rather than publishing straight over
-- what is live. Publishing needs a passed dry run of exactly the definition being published
-- (migration 0045), and that rule has no exceptions — not even for a reset, which is a definition
-- change like any other. The reset is written to the audit log, because "who put the flow back" is
-- exactly the sort of question asked months later.

create table wfl.template (
  id uuid not null default core.uuid_v7(),
  /** How the template is named in the seed that ships it: `daily-site-log-approval`. */
  key text not null,
  name text not null,
  /** What this template is for, in the words the designer's list shows. */
  summary text,
  /** Bumped by the seed that ships a new one; a copy behind this number is told (REQ-WFL-027). */
  version integer not null default 1,
  definition jsonb not null,
  /** False for a template that is still being written or has been retired. */
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pk_template primary key (id),
  constraint uq_template__key unique (key),
  constraint ck_template__key check (key ~ '^[a-z][a-z0-9-]{2,60}$'),
  constraint ck_template__version check (version >= 1)
);

comment on table wfl.template is
  'A default company process the panel ships; a flow in use is a copy of one (D-086, REQ-WFL-027).';

insert into core.table_layer (schema_name, table_name, layer, history, portable, scope_source)
values ('wfl', 'template', 'config', 'tracked', true, 'company');

create trigger record_history after insert or update on wfl.template
  for each row execute function aud.capture_history();

alter table wfl.template enable row level security;

-- A template is a definition, so reading one is the same right as reading a flow's definition.
create policy template_read on wfl.template for select to geoges_app
  using ((select iam.has_permission('wfl.workflow.design')));

revoke all on wfl.template from public;
grant select on wfl.template to geoges_app;
grant select on wfl.template to geoges_worker;

-- ---------------------------------------------------------------------------------------------
-- Which template a flow came from
-- ---------------------------------------------------------------------------------------------

alter table wfl.flow
  add column source_template_key text references wfl.template (key),
  add column source_template_version integer;

comment on column wfl.flow.source_template_key is
  'The template this flow is a copy of, when it is one (D-086).';

alter table wfl.flow add constraint ck_flow__template check (
  (source_template_key is null) = (source_template_version is null));

/**
 * Starts a flow from a template (REQ-WFL-027). The copy carries the template's definition and
 * remembers where it came from; what it does from then on is its own business.
 *
 * The key and the name are given by the caller, because turning "Ödeme onayı" into an address is the
 * same job for a copy as for any other new flow and lives in one place.
 */
create function wfl.use_template(p_template_key text, p_flow_key text, p_flow_name text)
returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  tpl record;
  version_id uuid;
begin
  if not iam.has_permission('wfl.workflow.design') then
    raise exception 'flow design needs wfl.workflow.design'
      using errcode = 'P0001', hint = 'wfl.design_permission';
  end if;

  select * into tpl from wfl.template where key = p_template_key and is_active;
  if not found then
    raise exception 'no such template' using errcode = 'P0001', hint = 'wfl.no_template';
  end if;

  version_id := wfl.save_draft(p_flow_key, p_flow_name, tpl.definition, true);

  update wfl.flow
     set source_template_key = tpl.key, source_template_version = tpl.version
   where key = p_flow_key;

  insert into aud.audit_log (event_type, actor_user_id, target_schema, target_table, target_id,
                             payload)
  values ('workflow.template_used', core.current_user_id(), 'wfl', 'flow_version', version_id,
          pg_catalog.jsonb_build_object('template', tpl.key, 'template_version', tpl.version,
                                        'flow', p_flow_key));
  return version_id;
end
$$;

revoke all on function wfl.use_template(text, text, text) from public;
grant execute on function wfl.use_template(text, text, text) to geoges_app;

/**
 * Puts a copy back to what its template says (REQ-WFL-027). It writes a new draft — the published
 * version is untouched until somebody runs the dry run and publishes, which is the rule for every
 * definition change — and it is written to the audit log.
 */
create function wfl.reset_to_template(p_flow_key text) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  f record;
  tpl record;
  version_id uuid;
begin
  if not iam.has_permission('wfl.workflow.design') then
    raise exception 'flow design needs wfl.workflow.design'
      using errcode = 'P0001', hint = 'wfl.design_permission';
  end if;

  select * into f from wfl.flow where key = p_flow_key;
  if not found or f.source_template_key is null then
    raise exception 'this flow is not a copy of a template'
      using errcode = 'P0001', hint = 'wfl.no_template_source';
  end if;

  select * into tpl from wfl.template where key = f.source_template_key;
  if not found then
    raise exception 'no such template' using errcode = 'P0001', hint = 'wfl.no_template';
  end if;

  version_id := wfl.save_draft(f.key, f.name, tpl.definition, f.single_instance);

  update wfl.flow set source_template_version = tpl.version where id = f.id;

  insert into aud.audit_log (event_type, actor_user_id, target_schema, target_table, target_id,
                             payload)
  values ('workflow.template_reset', core.current_user_id(), 'wfl', 'flow_version', version_id,
          pg_catalog.jsonb_build_object('template', tpl.key, 'template_version', tpl.version,
                                        'flow', f.key));

  perform core.publish_event('workflow.template_reset', 'wfl', 'wfl', 'flow_version', version_id,
                             pg_catalog.jsonb_build_object('template', tpl.key, 'flow', f.key));
  return version_id;
end
$$;

revoke all on function wfl.reset_to_template(text) from public;
grant execute on function wfl.reset_to_template(text) to geoges_app;

/**
 * Copies whose template has moved on (REQ-WFL-027). A screen shows a badge from this and a job tells
 * the person who made the copy; neither of them changes the copy, which is the point.
 */
create function wfl.copies_behind_template()
returns table (flow_key text, flow_name text, template_key text, template_name text,
               copy_version integer, template_version integer, owner_user_id uuid)
language sql stable security definer
set search_path = ''
as $$
  select f.key, f.name, t.key, t.name, f.source_template_version, t.version, f.created_by_user_id
    from wfl.flow f
    join wfl.template t on t.key = f.source_template_key
   where t.is_active and f.disabled_at is null
     and f.source_template_version < t.version
   order by f.name
$$;

revoke all on function wfl.copies_behind_template() from public;
grant execute on function wfl.copies_behind_template() to geoges_app, geoges_worker;
