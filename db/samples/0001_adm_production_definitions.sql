-- Sample production definitions for the pilot (TASK-0121, D-290). SAMPLE DATA: the pilot runs
-- entirely on examples, so these are plausible reinforced-earth panels and strips, not the
-- company's own list. Loaded by `npm run db:sample`; re-runnable (fixed ids from the code, never
-- overwritten). Management replaces them with the real list under Tanımlar when real use begins.

-- Consumables the recipes name (REQ-INV-001's examples), in the shared consumables list.
insert into adm.catalog_item (id, catalog_id, code, name)
select md5('sample:consumable:' || c.code)::uuid, md5('adm.catalog:consumable')::uuid, c.code, c.name
  from (values ('bolt_set', 'Cıvata-somun takımı'),
               ('rubber_pad', 'Lastik takoz'),
               ('form_oil', 'Kalıp yağı'),
               ('epdm', 'EPDM conta'),
               ('joint_filler', 'Derz dolgusu'),
               ('anchor', 'Ankraj')) as c(code, name)
on conflict do nothing;

-- Panels: one standard series stepping by width, and a top series for the last row.
insert into adm.panel_type (id, code, name, width_m, height_m, series, step)
select md5('sample:panel_type:' || p.code)::uuid, p.code, p.name, p.width, p.height, p.series, p.step
  from (values ('P-075', 'Örnek yarım panel', 0.75, 1.50, 'Standart', 1),
               ('P-100', 'Örnek 100''lük panel', 1.00, 1.50, 'Standart', 2),
               ('P-125', 'Örnek 125''lik panel', 1.25, 1.50, 'Standart', 3),
               ('P-150', 'Örnek tam panel', 1.50, 1.50, 'Standart', 4),
               ('T-075', 'Örnek tepe paneli, alçak', 1.50, 0.75, 'Tepe', 1),
               ('T-100', 'Örnek tepe paneli, yüksek', 1.50, 1.00, 'Tepe', 2))
       as p(code, name, width, height, series, step)
on conflict do nothing;

-- Strips: the three sections REQ-ADM-003 names, in the lengths they are usually cut to.
insert into adm.strip_type (id, code, name, width_mm, thickness_mm, hole_count, standard_lengths_m)
select md5('sample:strip_type:' || s.code)::uuid, s.code, s.name, s.width, s.thickness, s.holes,
       s.lengths::numeric[]
  from (values ('40x4', 'Örnek 40×4 galvaniz şerit', 40, 4, 2, '{3,4.5,6}'),
               ('50x4', 'Örnek 50×4 galvaniz şerit', 50, 4, 2, '{3,4.5,6,7.5}'),
               ('50x5', 'Örnek 50×5 galvaniz şerit', 50, 5, 2, '{4.5,6,9}'))
       as s(code, name, width, thickness, holes, lengths)
on conflict do nothing;

-- Recipes: what one panel cast or installed, or one metre of strip, usually takes.
insert into adm.consumption_recipe (id, output_kind, panel_type_id, strip_type_id, per_unit,
                                    material_item_id, qty_per_unit, valid_from, reason)
select md5('sample:recipe:' || r.key)::uuid, r.kind, null, null, r.per_unit,
       md5('sample:consumable:' || r.material)::uuid, r.qty, date '2026-01-01',
       'Örnek reçete (pilot)'
  from (values ('casting-oil', 'casting', 'm2', 'form_oil', 0.25),
               ('install-bolt', 'installation', 'piece', 'bolt_set', 4),
               ('install-pad', 'installation', 'piece', 'rubber_pad', 2),
               ('install-epdm', 'installation', 'm2', 'epdm', 0.6),
               ('install-filler', 'installation', 'm2', 'joint_filler', 0.4),
               ('strip-anchor', 'strip_installation', 'm', 'anchor', 0.2))
       as r(key, kind, per_unit, material, qty)
on conflict do nothing;
