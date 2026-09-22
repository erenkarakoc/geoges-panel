import { sql } from "kysely";

import { runAsUser, type DbIdentity } from "@/platform/db";

/**
 * Where a person stands with the panel on their Home Screen (TASK-0113, D-264). Everyone reads
 * and writes their own row and nobody else's.
 */

export type AppState = {
  introShown: boolean;
  onHomeScreen: boolean;
  pushEnabled: boolean;
};

export function readAppState(identity: DbIdentity): Promise<AppState> {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      intro_shown: boolean;
      on_home_screen: boolean;
      push_enabled: boolean;
    }>`select * from tsk.my_app_state()`.execute(db);
    const row = rows[0];
    return {
      introShown: row?.intro_shown ?? false,
      onHomeScreen: row?.on_home_screen ?? false,
      pushEnabled: row?.push_enabled ?? false,
    };
  });
}

export function noteAppState(
  identity: DbIdentity,
  note: { introShown?: boolean; onHomeScreen?: boolean; platform?: string | null },
) {
  return runAsUser(identity, async (db) => {
    await sql`
      select tsk.note_app_state(${note.introShown ?? false}, ${note.onHomeScreen ?? false},
                                ${note.platform ?? null})`.execute(db);
  });
}
