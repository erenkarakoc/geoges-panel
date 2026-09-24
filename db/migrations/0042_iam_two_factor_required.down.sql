-- Revert the application code first; without this function no role is made to use a second factor
-- and `iam.user.must_setup_2fa` alone decides, as before.
drop function iam.second_factor_required();
