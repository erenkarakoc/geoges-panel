create or replace function adm.rule_value(p_key text, p_on date, p_site_id uuid default null,
                               p_project_id uuid default null, p_unit_id uuid default null)
returns table (rule_id uuid, value jsonb, valid_from date, scope_type text)
language sql stable security definer
set search_path = ''
as $$
  select r.id, r.value, r.valid_from, r.scope_type
    from adm.rule r join adm.rule_key k on k.id = r.rule_key_id
   where k.key = p_key and r.valid_from <= p_on
     and ((r.scope_type = 'site' and r.scope_id = p_site_id)
          or (r.scope_type = 'project' and r.scope_id = p_project_id)
          or (r.scope_type = 'unit' and r.scope_id = p_unit_id)
          or r.scope_type = 'company')
   order by case r.scope_type when 'site' then 1 when 'project' then 2 when 'unit' then 3
                              else 4 end,
            r.valid_from desc, r.created_at desc, r.id desc
   limit 1
$$;
alter table adm.rule drop column revision_order;
