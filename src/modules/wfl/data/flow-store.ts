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

export type FlowSummary = {
  key: string;
  name: string;
  /** What starts it, in the definition's own words; null when no version exists yet. */
  trigger: string | null;
  /** The version a designer would open: the open draft, or the published one. */
  editableVersionId: string | null;
  draftVersion: number | null;
  publishedVersion: number | null;
  publishedAt: Date | null;
  disabledAt: Date | null;
};

/**
 * The flows this company has, as the list screen shows them (SCR-195). Readable by whoever may
 * design flows, which is the same right as reading a definition (migration 0045).
 */
export function readFlows(identity: DbIdentity) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      key: string;
      name: string;
      trigger: string | null;
      draft_id: string | null;
      draft_version: number | null;
      published_id: string | null;
      published_version: number | null;
      published_at: Date | null;
      disabled_at: Date | null;
    }>`select f.key, f.name, f.disabled_at,
              draft.id as draft_id, draft.version as draft_version,
              live.id as published_id, live.version as published_version,
              live.published_at,
              coalesce(draft.definition, live.definition) -> 'trigger' ->> 'type' as trigger
         from wfl.flow f
         left join wfl.flow_version draft
                on draft.flow_id = f.id and draft.status = 'draft'
         left join wfl.flow_version live
                on live.flow_id = f.id and live.status = 'published'
        order by f.name`.execute(db);
    return rows.map((row): FlowSummary => ({
      key: row.key,
      name: row.name,
      trigger: row.trigger,
      editableVersionId: row.draft_id ?? row.published_id,
      draftVersion: row.draft_version === null ? null : Number(row.draft_version),
      publishedVersion: row.published_version === null ? null : Number(row.published_version),
      publishedAt: row.published_at,
      disabledAt: row.disabled_at,
    }));
  });
}

/** One flow with the version a designer opens: its draft when there is one, else what is live. */
export function readFlowForDesigner(identity: DbIdentity, flowKey: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      key: string;
      name: string;
      single_instance: boolean;
      version_id: string | null;
      version: number | null;
      status: string | null;
      definition: unknown;
    }>`select f.key, f.name, f.single_instance,
              v.id as version_id, v.version, v.status, v.definition
         from wfl.flow f
         left join lateral (
           select * from wfl.flow_version x
            where x.flow_id = f.id and x.status in ('draft', 'published')
            order by case x.status when 'draft' then 0 else 1 end
            limit 1
         ) v on true
        where f.key = ${flowKey}`.execute(db);
    const row = rows[0];
    if (!row) return null;
    return {
      key: row.key,
      name: row.name,
      singleInstance: row.single_instance,
      versionId: row.version_id,
      version: row.version === null ? null : Number(row.version),
      status: row.status,
      definition: row.definition,
    };
  });
}
