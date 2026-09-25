-- Reverses 0060_wfl_template_updated.sql: the table stops announcing, and the copies keep their
-- badge, which is the part that was never a notification.
drop trigger announce_version on wfl.template;
drop function wfl.announce_template_version();
