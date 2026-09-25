import { sql } from "kysely";

import { runAsUser, type DbIdentity } from "@/platform/db";
import { scheduleJob } from "@/platform/db/events";
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

/** The job type the designer's dry run is run by; the engine only runs on the worker (D-284). */
export const DRY_RUN_JOB = "wfl.dry_run";

export type DryRunEvidence = {
  id: string;
  passed: boolean;
  /** Whether this evidence is of the definition as it stands now (content hash, migration 0045). */
  current: boolean;
  summary: unknown;
  createdAt: Date;
};

/**
 * Asks for a dry run of this version (REQ-WFL-025, D-284).
 *
 * The engine runs on the worker's connection and request code never holds one, so the designer does
 * not run the dry run itself: it asks, the worker runs it within a tick or two, and the evidence
 * row is what the screen then reads. The key is the version and its content hash, so pressing the
 * button twice on the same definition asks for one run, and a changed definition is a new question.
 */
export async function requestDryRun(
  identity: DbIdentity,
  versionId: string,
  context: Record<string, unknown> = {},
): Promise<{ asked: boolean; hash: string } | null> {
  return runAsUser(identity, async (db) => {
    // Reading the version at all needs the design permission (migration 0045), so this is the
    // permission check as well as the lookup: without it there is nothing to schedule for.
    const { rows } = await sql<{ content_hash: string }>`
      select content_hash from wfl.flow_version where id = ${versionId}::uuid`.execute(db);
    const hash = rows[0]?.content_hash;
    if (!hash) return null;

    const asked = await scheduleJob(db, {
      type: DRY_RUN_JOB,
      runAt: new Date(),
      key: `${DRY_RUN_JOB}:${versionId}:${hash}`,
      payload: { versionId, context },
    });
    return { asked, hash };
  });
}

/** What the last dry run of this version found, and whether it was of the definition as it is. */
export function readLastDryRun(identity: DbIdentity, versionId: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      id: string;
      passed: boolean;
      summary: unknown;
      created_at: Date;
      current: boolean;
    }>`select r.id, r.passed, r.summary, r.ran_at as created_at,
              (r.content_hash = v.content_hash) as current
         from wfl.dry_run r
         join wfl.flow_version v on v.id = r.flow_version_id
        where r.flow_version_id = ${versionId}::uuid
        order by r.ran_at desc
        limit 1`.execute(db);
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      passed: row.passed,
      current: row.current,
      summary: row.summary,
      createdAt: row.created_at,
    } satisfies DryRunEvidence;
  });
}

/**
 * What the publish confirmation has to say before anybody presses it (REQ-WFL-023, REQ-WFL-024):
 * which version is live today and how many runs would carry on with it. A running instance is bound
 * to the version it started on and stays there, which is the sentence the dialog has to show.
 */
export function readPublishSummary(identity: DbIdentity, versionId: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      version: number;
      live_version: number | null;
      live_running: string | null;
    }>`select v.version,
              live.version as live_version,
              (select pg_catalog.count(*) from wfl.instance i
                where i.flow_version_id = live.id and i.status = 'running') as live_running
         from wfl.flow_version v
         left join wfl.flow_version live
                on live.flow_id = v.flow_id and live.status = 'published'
        where v.id = ${versionId}::uuid`.execute(db);
    const row = rows[0];
    if (!row) return null;
    return {
      version: Number(row.version),
      liveVersion: row.live_version === null ? null : Number(row.live_version),
      runningOnLive: Number(row.live_running ?? 0),
    };
  });
}

/** One flow with the version a designer opens: its draft when there is one, else what is live. */
export function readFlowForDesigner(identity: DbIdentity, flowKey: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      flow_id: string;
      key: string;
      name: string;
      single_instance: boolean;
      source_template_key: string | null;
      version_id: string | null;
      version: number | null;
      status: string | null;
      definition: unknown;
    }>`select f.id as flow_id, f.key, f.name, f.single_instance, f.source_template_key,
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
      flowId: row.flow_id,
      key: row.key,
      name: row.name,
      singleInstance: row.single_instance,
      sourceTemplateKey: row.source_template_key,
      versionId: row.version_id,
      version: row.version === null ? null : Number(row.version),
      status: row.status,
      definition: row.definition,
    };
  });
}

export type FlowTemplate = {
  key: string;
  name: string;
  summary: string | null;
  version: number;
  definition: unknown;
};

/** The templates the panel ships (REQ-WFL-028); readable by whoever may design a flow. */
export function readTemplates(identity: DbIdentity) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      key: string;
      name: string;
      summary: string | null;
      version: number;
      definition: unknown;
    }>`select key, name, summary, version, definition from wfl.template
        where is_active order by name`.execute(db);
    return rows.map((row): FlowTemplate => ({
      definition: row.definition,
      key: row.key,
      name: row.name,
      summary: row.summary,
      version: Number(row.version),
    }));
  });
}

/** Starts a flow from a template; the copy remembers which template and version it came from. */
export function startFromTemplate(
  identity: DbIdentity,
  template: { templateKey: string; flowKey: string; flowName: string },
) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ id: string }>`
      select wfl.use_template(${template.templateKey}, ${template.flowKey},
                              ${template.flowName}) as id`.execute(db);
    return rows[0].id;
  });
}

/** Puts a copy back to what its template says, as a new draft (REQ-WFL-027). */
export function resetToTemplate(identity: DbIdentity, flowKey: string) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{ id: string }>`
      select wfl.reset_to_template(${flowKey}) as id`.execute(db);
    return rows[0].id;
  });
}

/** The copies whose template has moved on: a badge on the list and a word to whoever made them. */
export function readCopiesBehindTemplate(identity: DbIdentity) {
  return runAsUser(identity, async (db) => {
    const { rows } = await sql<{
      flow_key: string;
      flow_name: string;
      template_key: string;
      template_name: string;
      copy_version: number;
      template_version: number;
      owner_user_id: string | null;
    }>`select * from wfl.copies_behind_template()`.execute(db);
    return rows.map((row) => ({
      flowKey: row.flow_key,
      flowName: row.flow_name,
      templateKey: row.template_key,
      templateName: row.template_name,
      copyVersion: Number(row.copy_version),
      templateVersion: Number(row.template_version),
      ownerUserId: row.owner_user_id,
    }));
  });
}
