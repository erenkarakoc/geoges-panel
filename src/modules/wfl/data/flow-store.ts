import { sql } from "kysely";

import { runAsUser, type DbIdentity } from "@/platform/db";
import type { SystemDb } from "@/platform/jobs/types";

/** Re-exported for the application layer, which may not name the database module itself. */
export type { DbIdentity };

/**
 * Flow definitions in the database (TASK-0117, migration 0045, REQ-WFL-023…025).
 *
 * Every statement goes through a definer function: the three tables are readable by whoever may
 * design a flow and writable by nobody directly, so the publish rules cannot be walked around by
 * an update. The rules themselves live in SQL for the same reason — a publish without a dry run is
 * refused by the database, not by a screen.
 */

export type FlowVersionStatus = "draft" | "published" | "superseded";

export type FlowVersion = {
  id: string;
  flowKey: string;
  version: number;
  status: FlowVersionStatus;
  definition: unknown;
  contentHash: string;
  publishedAt: Date | null;
};

/** Writes the open draft, or starts a new version when the last one is published. */
export function saveDraft(
  identity: DbIdentity,
  flow: { key: string; name: string; definition: unknown; singleInstance?: boolean },
) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ id: string }>`
      select wfl.save_draft(${flow.key}, ${flow.name}, ${JSON.stringify(flow.definition)}::jsonb,
                            ${flow.singleInstance ?? true}) as id`.execute(db);
    return rows[0].id;
  });
}

/** Records what a dry run found, against the definition as it stands now (REQ-WFL-025). */
export function recordDryRun(
  identity: DbIdentity,
  run: { versionId: string; passed: boolean; summary?: unknown },
) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ id: string }>`
      select wfl.record_dry_run(${run.versionId}::uuid, ${run.passed},
                                ${JSON.stringify(run.summary ?? {})}::jsonb) as id`.execute(db);
    return rows[0].id;
  });
}

/** Publishes a draft; the database refuses it without a passed dry run of this same definition. */
export function publishVersion(identity: DbIdentity, versionId: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ done: boolean | null }>`
      select wfl.publish_version(${versionId}::uuid) as done`.execute(db);
    return rows[0]?.done === true;
  });
}

/** Stops a flow from starting anything new; what is running finishes. */
export function disableFlow(identity: DbIdentity, flowId: string, reason: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ done: boolean | null }>`
      select wfl.disable_flow(${flowId}::uuid, ${reason}) as done`.execute(db);
    return rows[0]?.done === true;
  });
}

/** Every version of one flow, newest first; empty for somebody who may not design flows. */
export function readVersions(identity: DbIdentity, flowKey: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      id: string;
      flow_key: string;
      version: number;
      status: FlowVersionStatus;
      definition: unknown;
      content_hash: string;
      published_at: Date | null;
    }>`select v.id, f.key as flow_key, v.version, v.status, v.definition, v.content_hash,
              v.published_at
         from wfl.flow_version v join wfl.flow f on f.id = v.flow_id
        where f.key = ${flowKey}
        order by v.version desc`.execute(db);
    return rows.map((row): FlowVersion => ({
      id: row.id,
      flowKey: row.flow_key,
      version: Number(row.version),
      status: row.status,
      definition: row.definition,
      contentHash: row.content_hash,
      publishedAt: row.published_at,
    }));
  });
}

/** The version a trigger would run today, or null when nothing is published or the flow is off. */
export function readPublished(identity: DbIdentity, flowKey: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ id: string; version: number; definition: unknown }>`
      select v.id, v.version, v.definition
        from wfl.flow_version v join wfl.flow f on f.id = v.flow_id
       where f.key = ${flowKey} and v.status = 'published' and f.disabled_at is null`.execute(db);
    const row = rows[0];
    return row ? { id: row.id, version: Number(row.version), definition: row.definition } : null;
  });
}

/** One version's definition, read as the worker so the engine can run it dry. */
export async function readDefinitionOf(
  db: SystemDb,
  versionId: string,
): Promise<{ definition: unknown; status: string } | null> {
  const { rows } = await sql<{ definition: unknown; status: string }>`
    select definition, status from wfl.flow_version where id = ${versionId}::uuid`.execute(db);
  return rows[0] ?? null;
}

/** Writes the evidence of a dry run the engine performed (migration 0050). */
export async function recordDryRunAsSystem(
  db: SystemDb,
  run: { versionId: string; passed: boolean; summary: unknown },
): Promise<string> {
  const { rows } = await sql<{ id: string }>`
    select wfl.record_dry_run_as_system(${run.versionId}::uuid, ${run.passed},
                                        ${JSON.stringify(run.summary)}::jsonb) as id`.execute(db);
  return rows[0].id;
}
