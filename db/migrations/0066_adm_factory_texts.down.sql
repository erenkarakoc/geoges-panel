-- Reverses 0066_adm_factory_texts.sql: the factory texts as they were.

alter table adm.rule disable trigger rule_guard;
alter table adm.working_calendar disable trigger calendar_guard;

update adm.working_calendar set reason = 'Başlangıç takvimi (REQ-ADM-010)' where reason = 'Başlangıç takvimi';
update adm.rule set reason = 'Başlangıç ayarı: sabah 07:30 (REQ-TSK-013 örneği)' where reason = 'Başlangıç ayarı: sabah 07:30';
update adm.rule set reason = 'Başlangıç ayarı: 24 saat; eskalasyon akışı Faz 08''de bu ayarı devralır (D-263)' where reason = 'Başlangıç ayarı: 24 saat';
update adm.rule_key set description = 'Bir oturumun en çok yaşayacağı gün sayısı (D-230).' where description = 'Bir oturumun en çok yaşayacağı gün sayısı.';
update adm.rule_key set description = 'Bu kadar gün hiç kullanılmayan oturum kapanır (D-230).' where description = 'Bu kadar gün hiç kullanılmayan oturum kapanır.';
update adm.rule_key set description = 'Bu rolleri taşıyan kişi ikinci adımı kurmadan panele geçemez (REQ-IAM-003).' where description = 'Bu rolleri taşıyan kişi ikinci adımı kurmadan panele geçemez.';
update adm.rule set reason = 'Başlangıç ayarı: 5 hatalı deneme (REQ-IAM-005; yöneticinin ayarı)' where reason = 'Başlangıç ayarı: 5 hatalı deneme; yönetici değiştirebilir';
update adm.rule set reason = 'Başlangıç ayarı: 15 dakika kilit (REQ-IAM-005; yöneticinin ayarı)' where reason = 'Başlangıç ayarı: 15 dakika kilit; yönetici değiştirebilir';
update adm.rule set reason = 'Başlangıç ayarı: 30 gün (D-230)' where reason = 'Başlangıç ayarı: 30 gün';
update adm.rule set reason = 'Başlangıç ayarı: 3 günlük hareketsizlik (D-230)' where reason = 'Başlangıç ayarı: 3 günlük hareketsizlik';
update adm.rule set reason = 'Başlangıç ayarı: hiçbir rol için zorunlu değil; sahip Tanımlar''dan seçer (REQ-IAM-003)' where reason = 'Başlangıç ayarı: hiçbir rol için zorunlu değil; sahip Tanımlar''dan seçer';
update adm.catalog set description = 'Bir iş gününde iş yapılmadığında seçilen neden (REQ-SIT-010).' where description = 'Bir iş gününde iş yapılmadığında seçilen neden.';
update adm.catalog set description = 'Projenin talepten kapanışa geçtiği aşamalar (REQ-PRJ-003).' where description = 'Projenin talepten kapanışa geçtiği aşamalar.';

alter table adm.rule enable trigger rule_guard;
alter table adm.working_calendar enable trigger calendar_guard;
