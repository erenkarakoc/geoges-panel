import type { CapabilityDataClass, ModuleCapabilities } from "@/platform/capabilities/catalog";

/**
 * The contract test's reasoning, as pure functions (TASK-0118, REQ-WFL-004).
 *
 * Reading files is the test's job; deciding what counts as drift is this module's, so the rules
 * can be tested against a broken declaration without breaking the repository to do it.
 *
 * Three kinds of drift are worth catching, because the compiler cannot:
 *   1. the code declares something the module's own written catalog does not (or names it
 *      differently, or gives it another data class);
 *   2. an event is declared and never published, or published and never declared;
 *   3. a capability that was once published disappears or changes kind.
 */

/** What a row of a written catalog says, once the Turkish table is parsed. */
export type WrittenCapability = {
  code: string;
  name: string;
  dataClass: CapabilityDataClass | null;
};

export type WrittenCatalog = {
  module: string;
  events: readonly WrittenCapability[];
  actions: readonly WrittenCapability[];
  conditions: readonly WrittenCapability[];
};

/** The Turkish data-class words of the written catalogs. */
const DATA_CLASSES: Record<string, CapabilityDataClass> = {
  genel: "general",
  iç: "internal",
  ic: "internal",
  ticari: "commercial",
  hassas: "sensitive",
  "hassas kişisel": "sensitive",
  "kaydın sınıfı": "record",
};

export function dataClassOf(turkish: string): CapabilityDataClass | null {
  return DATA_CLASSES[turkish.trim().toLocaleLowerCase("tr")] ?? null;
}

/**
 * The declaration against the module's own written catalog. One direction only: the written
 * catalog describes the finished product and names capabilities no code has yet, which is not
 * drift. Declaring something the record does not know about is.
 */
export function declarationAgainstRecord(
  catalog: ModuleCapabilities,
  written: WrittenCatalog,
): string[] {
  const problems: string[] = [];
  const compare = (
    kind: string,
    declared: readonly { code: string; name: string; dataClass?: CapabilityDataClass }[],
    rows: readonly WrittenCapability[],
  ) => {
    for (const one of declared) {
      const row = rows.find((r) => r.code === one.code);
      if (!row) {
        problems.push(
          `${catalog.module}: ${kind} "${one.code}" is declared in code and not in the module's written catalog`,
        );
        continue;
      }
      if (row.name !== one.name) {
        problems.push(
          `${catalog.module}: ${kind} "${one.code}" is named "${one.name}" in code and "${row.name}" in the record`,
        );
      }
      if (one.dataClass && row.dataClass && row.dataClass !== one.dataClass) {
        problems.push(
          `${catalog.module}: ${kind} "${one.code}" is ${one.dataClass} in code and ${row.dataClass} in the record`,
        );
      }
    }
  };
  compare("event", catalog.events, written.events);
  compare("action", catalog.actions, written.actions);
  compare("condition field", catalog.conditions, written.conditions);
  return problems;
}

/**
 * Declared events against the events the code really publishes. Both directions matter here: a
 * declared event nobody publishes is a flow that will wait forever, and a published event nobody
 * declares is an event no flow can listen to.
 */
export function eventsAgainstReality(
  catalogs: readonly ModuleCapabilities[],
  published: readonly string[],
): string[] {
  const problems: string[] = [];
  const declared = new Set<string>();
  for (const catalog of catalogs) {
    for (const event of catalog.events) {
      declared.add(event.code);
      if (event.status === "deprecated") continue;
      if (!published.includes(event.code)) {
        problems.push(`${catalog.module}: event "${event.code}" is declared but never published`);
      }
    }
  }
  for (const code of published) {
    if (!declared.has(code)) {
      problems.push(`event "${code}" is published but no module declares it`);
    }
  }
  return problems;
}

export type PublishedCapability = { module: string; kind: string; code: string };

/**
 * The snapshot rule of REQ-WFL-004: a capability that has been published is added to or marked
 * deprecated, never removed and never quietly turned into something else. The snapshot is what
 * the repository remembers; the catalogs are what it has now.
 */
export function snapshotAgainstNow(
  snapshot: readonly PublishedCapability[],
  now: readonly PublishedCapability[],
): string[] {
  const problems: string[] = [];
  for (const was of snapshot) {
    const still = now.find((c) => c.code === was.code && c.kind === was.kind);
    if (!still) {
      const moved = now.find((c) => c.code === was.code);
      problems.push(
        moved
          ? `${was.module}: "${was.code}" was published as a ${was.kind} and is now a ${moved.kind}`
          : `${was.module}: "${was.code}" was published and is gone; mark it deprecated instead (REQ-WFL-004)`,
      );
    } else if (still.module !== was.module) {
      problems.push(
        `"${was.code}" was published by ${was.module} and is now declared by ${still.module}`,
      );
    }
  }
  return problems;
}
