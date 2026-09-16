import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { readSupabaseConfig } from "./supabase-config";

/**
 * Per-request Supabase client for server components, route handlers and server actions.
 * A new client is created for every request; sharing one across requests would leak sessions.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { url, publishableKey } = readSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server components cannot write cookies. `proxy.ts` refreshes the session instead.
        }
      },
    },
  });
}
