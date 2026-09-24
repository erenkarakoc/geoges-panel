-- Revert the application code first; the flag then goes back to being written by the bootstrap
-- command alone. No flag value is changed by this.
drop function iam.note_second_factor(uuid, boolean);
