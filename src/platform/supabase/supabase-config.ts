/**
 * Supabase connection values (TASK-0024). Only the publishable key belongs here: it is sent to the
 * browser by design.
 *
 * The service_role key is not read here and never reaches the browser. Since TASK-0112 one file
 * does read it — `modules/iam/infrastructure/supabase/supabase-second-factor-admin.ts`, to take a
 * lost second factor away (D-236, D-272) — and it is the only one.
 */
export function readSupabaseConfig(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase env vars are missing. Copy .env.example to .env.local and fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url, publishableKey };
}
