import "server-only";

import { AccessDeniedError, signInIdentity } from "@/modules/iam";
import {
  decideRevision,
  insertEffect,
  insertRevision,
  markApplied,
  markStale,
  readEffects,
  readRevisableType,
  readRevisions,
  type DbIdentity,
  type RevisionRequest,
  type RevisionView,
} from "@/modules/aud/data/revision-store";
import { REVISION_RULE_MESSAGES, type RevisionChange } from "@/modules/aud/domain/revisions";

/**
 * The revision service (TASK-0109, REQ-AUD-007…010, D-265).
 *
 * AUD keeps the request and the decision; the record itself belongs to another module, which
 * AUD may not touch (ADR-001). So each owning module registers an *applier* in the composition
 * root (`src/records`), the same way it registers a document resolver (D-262): the applier reads
 * its record as the signed-in person, refuses when the record moved on since the request was
 * made, writes the change and its correction movements, and names them so they can be linked to
 * the request. A record type with no applier cannot be asked about at all: an approval that
 * changes nothing is worse than no request.
 */

export class RevisionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RevisionError";
  }
}

/** What the module writes to carry a revision out, so AUD can link it (REQ-AUD-009). */
export type RevisionEffect = {
  schema: string;
  table: string;
  id?: string | null;
  note?: string | null;
};

export type RevisionOutcome =
  | { applied: true; note?: string; effects?: readonly RevisionEffect[] }
  /** The record changed after the request was made: it must be asked for again (D-265). */
  | { applied: false; stale: true; note: string }
  | { applied: false; stale?: false; note: string };

export type RevisionApplier = (
  identity: DbIdentity,
  request: RevisionRequest,
) => Promise<RevisionOutcome>;

/** Appliers by `<schema>.<table>`, registered by the module that owns the record. */
export type RevisionAppliers = Readonly<Record<string, RevisionApplier>>;

export type RevisionServiceDeps = {
  appliers: RevisionAppliers;
  /** The signed-in person; null when signed out. */
  identity: () => Promise<DbIdentity | null>;
};

/** Facts about the record only its own module knows; they decide who may ask and who sees. */
export type RecordPlace = {
  siteId?: string | null;
  projectId?: string | null;
  ownerUserId?: string | null;
  dataClass?: string;
};

function refusal(error: unknown): never {
  const hint = (error as { hint?: unknown } | null)?.hint;
  const message = typeof hint === "string" ? REVISION_RULE_MESSAGES[hint] : undefined;
  if (message) throw new RevisionError(message);
  throw error;
}

export function createRevisionService({ appliers, identity }: RevisionServiceDeps) {
  const who = async () => {
    const found = await identity();
    if (!found) throw new AccessDeniedError("iam.session");
    return found;
  };

  const applierFor = (record: { schema: string; table: string }) =>
    appliers[`${record.schema}.${record.table}`] ?? null;

  return {
    /** What the register says about a record type, with the applier's presence folded in. */
    async typeOf(schema: string, table: string) {
      const type = await readRevisableType(await who(), schema, table);
      return type && applierFor({ schema, table }) ? type : null;
    },

    /** Asks for a change on a locked record (REQ-AUD-008). Returns the new request's id. */
    async request(input: {
      record: { schema: string; table: string; id: string };
      changes: readonly RevisionChange[];
      reason: string;
      place?: RecordPlace;
    }): Promise<string> {
      if (!applierFor(input.record)) {
        throw new RevisionError(REVISION_RULE_MESSAGES["aud.not_revisable"]);
      }
      if (input.changes.length === 0) {
        throw new RevisionError(REVISION_RULE_MESSAGES["aud.no_changes"]);
      }
      try {
        return await insertRevision(await who(), {
          record: input.record,
          changes: input.changes,
          reason: input.reason,
          siteId: input.place?.siteId ?? null,
          projectId: input.place?.projectId ?? null,
          ownerUserId: input.place?.ownerUserId ?? null,
          dataClass: input.place?.dataClass ?? "internal",
        });
      } catch (error) {
        refusal(error);
      }
    },

    /** Requests the person may see: the approval screen, their own, or one record's history. */
    async list(view: RevisionView, record?: { schema: string; table: string; id: string }) {
      return readRevisions(await who(), view, record);
    },

    async effectsOf(id: string) {
      return readEffects(await who(), id);
    },

    /**
     * Approves or refuses a request. An approval is carried out at once by the owning module's
     * applier; when the record moved on meanwhile, the request becomes stale instead.
     */
    async decide(
      id: string,
      approve: boolean,
      reason: string | null,
    ): Promise<{ status: string; note?: string }> {
      const person = await who();
      let status: string;
      try {
        status = await decideRevision(person, id, approve, reason);
      } catch (error) {
        refusal(error);
      }
      if (status !== "approved") return { status };

      const [request] = (await readRevisions(person, "all")).filter((r) => r.id === id);
      // A decision already carried out is not carried out again: deciding twice is harmless.
      if (request?.appliedAt) {
        return { status: "approved", note: request.applyNote ?? undefined };
      }
      const applier = request ? applierFor(request.record) : null;
      if (!request || !applier) {
        const note = "Bu kayıt türünü uygulayacak modül kayıtlı değil.";
        await markStale(person, id, note);
        return { status: "stale", note };
      }

      const outcome = await applier(person, request);
      if (outcome.applied) {
        for (const effect of outcome.effects ?? []) {
          await insertEffect(person, id, effect);
        }
        await markApplied(person, id, outcome.note ?? null);
        return { status: "approved", note: outcome.note };
      }
      if (outcome.stale) {
        await markStale(person, id, outcome.note);
        return { status: "stale", note: outcome.note };
      }
      // The decision stands; the change could not be written and the screen says so.
      await markApplied(person, id, `Uygulanamadı: ${outcome.note}`);
      return { status: "approved", note: outcome.note };
    },
  };
}

export type RevisionService = ReturnType<typeof createRevisionService>;

/** The service of a request, for screens that do not build their own. */
export async function currentIdentity(): Promise<DbIdentity | null> {
  return (await signInIdentity())?.identity ?? null;
}
