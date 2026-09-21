-- The audit log screen's permission (TASK-0103, SCR-193, REQ-AUD-006, D-258). It belongs to the
-- owner layer alone: the database refuses it to any other role and to personal exceptions.
-- Re-runnable; a fixed id derived from the code, never overwritten.
insert into iam.permission (id, code, module, name, created_from)
values (md5('iam.permission:aud.audit-log.view')::uuid, 'aud.audit-log.view', 'aud',
        'Denetim Kayıtları: görür', 'seed')
on conflict do nothing;

insert into iam.role_permission (id, role_id, permission_id)
values (md5('iam.role_permission:SAH:aud.audit-log.view')::uuid, md5('iam.role:SAH')::uuid,
        md5('iam.permission:aud.audit-log.view')::uuid)
on conflict do nothing;
