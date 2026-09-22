import type { JobRegistry } from "./types";

const NAME = /^[a-z]{2,3}\.[a-z0-9_.-]+$/;

/**
 * Refuses a registry the worker could not run safely: duplicate or malformed names, a
 * subscriber without events, or a read model whose events no replayable subscriber keeps live.
 */
export function validateRegistry(registry: JobRegistry): JobRegistry {
  const problems: string[] = [];
  const seen = new Set<string>();
  const unique = (kind: string, name: string) => {
    if (!NAME.test(name)) problems.push(`${kind} ${name}: name must be <module>.<name>`);
    if (seen.has(`${kind}:${name}`)) problems.push(`${kind} ${name} is registered twice`);
    seen.add(`${kind}:${name}`);
  };
  for (const s of registry.subscribers) {
    unique("subscriber", s.name);
    if (!s.events.length) problems.push(`subscriber ${s.name} listens to no event`);
  }
  for (const j of registry.jobs) unique("job", j.type);
  for (const m of registry.readModels) {
    unique("read model", m.name);
    const fed = registry.subscribers.filter(
      (s) => s.replayable && m.events.every((e) => s.events.includes(e)),
    );
    if (!fed.length)
      problems.push(`read model ${m.name} has no replayable subscriber for all of its events`);
  }
  if (problems.length) throw new Error(`job registry is invalid:\n  ${problems.join("\n  ")}`);
  return registry;
}
