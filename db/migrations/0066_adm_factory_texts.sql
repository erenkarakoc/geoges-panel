-- 0066 — factory texts without planning codes (owner, 2026-09-26).
--
-- The descriptions and reasons the seeds gave rules, the company calendar and two shared lists
-- carried requirement and decision numbers ("(REQ-IAM-005)", "(D-230)"), which are the project's
-- own bookkeeping and mean nothing to the people reading Tanımlar. The seeds no longer write them;
-- this corrects the rows already written, and only where the text is still the factory one.
--
-- Rules and calendar rows are never updated (their guards refuse it): a change of value is a new
-- dated row. This is not a change of value — the same rows keep their value and their date, only
-- the wording of their factory note changes — so the guards are lifted for these statements alone.

alter table adm.rule disable trigger rule_guard;
alter table adm.working_calendar disable trigger calendar_guard;

update adm.working_calendar set reason = 'Başlangıç takvimi' where reason = 'Başlangıç takvimi (REQ-ADM-010)';
update adm.rule set reason = 'Başlangıç ayarı: sabah 07:30' where reason = 'Başlangıç ayarı: sabah 07:30 (REQ-TSK-013 örneği)';
update adm.rule set reason = 'Başlangıç ayarı: 24 saat' where reason = 'Başlangıç ayarı: 24 saat; eskalasyon akışı Faz 08''de bu ayarı devralır (D-263)';
update adm.rule_key set description = 'Bir oturumun en çok yaşayacağı gün sayısı.' where description = 'Bir oturumun en çok yaşayacağı gün sayısı (D-230).';
update adm.rule_key set description = 'Bu kadar gün hiç kullanılmayan oturum kapanır.' where description = 'Bu kadar gün hiç kullanılmayan oturum kapanır (D-230).';
update adm.rule_key set description = 'Bu rolleri taşıyan kişi ikinci adımı kurmadan panele geçemez.' where description = 'Bu rolleri taşıyan kişi ikinci adımı kurmadan panele geçemez (REQ-IAM-003).';
update adm.rule set reason = 'Başlangıç ayarı: 5 hatalı deneme; yönetici değiştirebilir' where reason = 'Başlangıç ayarı: 5 hatalı deneme (REQ-IAM-005; yöneticinin ayarı)';
update adm.rule set reason = 'Başlangıç ayarı: 15 dakika kilit; yönetici değiştirebilir' where reason = 'Başlangıç ayarı: 15 dakika kilit (REQ-IAM-005; yöneticinin ayarı)';
update adm.rule set reason = 'Başlangıç ayarı: 30 gün' where reason = 'Başlangıç ayarı: 30 gün (D-230)';
update adm.rule set reason = 'Başlangıç ayarı: 3 günlük hareketsizlik' where reason = 'Başlangıç ayarı: 3 günlük hareketsizlik (D-230)';
update adm.rule set reason = 'Başlangıç ayarı: hiçbir rol için zorunlu değil; sahip Tanımlar''dan seçer' where reason = 'Başlangıç ayarı: hiçbir rol için zorunlu değil; sahip Tanımlar''dan seçer (REQ-IAM-003)';
update adm.catalog set description = 'Bir iş gününde iş yapılmadığında seçilen neden.' where description = 'Bir iş gününde iş yapılmadığında seçilen neden (REQ-SIT-010).';
update adm.catalog set description = 'Projenin talepten kapanışa geçtiği aşamalar.' where description = 'Projenin talepten kapanışa geçtiği aşamalar (REQ-PRJ-003).';

alter table adm.rule enable trigger rule_guard;
alter table adm.working_calendar enable trigger calendar_guard;
