import type { z } from "zod";

import type { SystemDb } from "@/platform/jobs/types";

/**
 * What a module can be asked to do, declared where the module is (TASK-0118, REQ-WFL-003/004,
 * D-078, D-280).
 *
 * The declaration is not a description of the code: it *carries* the code. An action holds the
 * function that runs it, so "declared but not implemented" cannot compile and the contract test is
 * left with the three things a compiler cannot check — that the declaration matches the module's
 * own written catalog, that a declared event is really published, and that a published capability
 * never quietly disappears (REQ-WFL-004).
 *
 * The flow designer offers exactly what these catalogs hold and nothing else; an ability that is
 * not here does not exist for a flow. That is why no action writes a ledger: the capability is
 * missing rather than forbidden (D-080, REQ-WFL-002).
 */

/** The four classes of `docs/architecture/PERMISSIONS.md`; a condition never widens them. */
export type CapabilityDataClass = "general" | "internal" | "commercial" | "sensitive" | "record";

/** A published capability is added or deprecated, never removed (REQ-WFL-004). */
export type CapabilityStatus = "active" | "deprecated";

export type EventCapability = {
  /** `<record>.<what happened>`, the code `core.publish_event` writes. */
  code: string;
  name: string;
  /** When the module publishes it, in the words of the module's own catalog. */
  when: string;
  /** What the event carries, for the designer's "what can I read here". */
  carries: readonly string[];
  dataClass: CapabilityDataClass;
  status?: CapabilityStatus;
};

/**
 * What an action is given when it runs. The engine hands it the transaction its step is writing in,
 * so the action's effect and the step's "done" mark commit together, and who the flow acts
 * as — its own system authority, never the designer's, so the id is null unless a person asked
 * for the step itself (REQ-WFL-020, D-082).
 */
export type CapabilityCaller = { db: SystemDb; userId: string | null };

/**
 * An action as the engine sees it: a code, a schema and a function it may call with whatever the
 * flow definition holds. The input is `unknown` on purpose — the engine never knows an action's
 * shape, and `defineAction` below is what keeps the declaration typed where it is written.
 */
export type ActionCapability = {
  code: string;
  name: string;
  /** Checked before the action runs; the designer builds its form from this. */
  input: z.ZodType<unknown>;
  /** What the caller must hold, or `system` when only a flow may ask (REQ-WFL-020). */
  permission: string;
  /** What a second, identical call does — every action says it (REQ-WFL-004). */
  onRepeat: string;
  /** What is left behind when the call dies half-way. */
  onFailure: string;
  status?: CapabilityStatus;
  run: (caller: CapabilityCaller, input: unknown) => Promise<unknown>;
};

/**
 * Declares one action. The module writes it with its own input type; what comes back takes
 * `unknown` and parses with the declared schema before the module's function ever sees it, so an
 * engine holding a definition from three versions ago cannot hand an action a shape it does not
 * expect.
 */
export function defineAction<Input, Result>(action: {
  code: string;
  name: string;
  input: z.ZodType<Input>;
  permission: string;
  onRepeat: string;
  onFailure: string;
  status?: CapabilityStatus;
  run: (caller: CapabilityCaller, input: Input) => Promise<Result>;
}): ActionCapability {
  return {
    ...action,
    input: action.input as z.ZodType<unknown>,
    run: (caller, raw) => action.run(caller, action.input.parse(raw)),
  };
}

export type ConditionFieldCapability = {
  code: string;
  name: string;
  type: "text" | "number" | "boolean" | "choice" | "date" | "list" | "person" | "scope";
  dataClass: CapabilityDataClass;
  status?: CapabilityStatus;
};

/** How a step finds its owner: `site.coordinator`, `record.submitter` … (D-097). */
export type OwnerRelationCapability = {
  code: string;
  name: string;
  status?: CapabilityStatus;
};

export type ModuleCapabilities = {
  /** The three-letter module code, upper case, as in MODULE_MAP. */
  module: string;
  events: readonly EventCapability[];
  actions: readonly ActionCapability[];
  conditions: readonly ConditionFieldCapability[];
  relations: readonly OwnerRelationCapability[];
};

const MODULE = /^[A-Z]{3}$/;
const CODE = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

/**
 * Declares one module's catalog. The checks here are the ones that would otherwise be found by a
 * flow failing at run time: a code that is not a code, or the same one declared twice.
 */
export function defineCapabilities(catalog: ModuleCapabilities): ModuleCapabilities {
  if (!MODULE.test(catalog.module)) {
    throw new Error(`capability catalog: "${catalog.module}" is not a module code`);
  }
  const seen = new Set<string>();
  for (const code of [
    ...catalog.events.map((e) => e.code),
    ...catalog.actions.map((a) => a.code),
    ...catalog.conditions.map((c) => c.code),
  ]) {
    if (!CODE.test(code)) {
      throw new Error(`${catalog.module}: "${code}" is not a capability code`);
    }
    if (seen.has(code)) {
      throw new Error(`${catalog.module}: "${code}" is declared twice`);
    }
    seen.add(code);
  }
  return catalog;
}

/** Every capability's code and kind, which is what the contract test and the designer read. */
export function capabilityCodes(catalog: ModuleCapabilities) {
  return [
    ...catalog.events.map((e) => ({ kind: "event" as const, code: e.code, status: status(e) })),
    ...catalog.actions.map((a) => ({ kind: "action" as const, code: a.code, status: status(a) })),
    ...catalog.conditions.map((c) => ({
      kind: "condition" as const,
      code: c.code,
      status: status(c),
    })),
    ...catalog.relations.map((r) => ({
      kind: "relation" as const,
      code: r.code,
      status: status(r),
    })),
  ];
}

const status = (c: { status?: CapabilityStatus }) => c.status ?? "active";
