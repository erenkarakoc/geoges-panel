import { describe, expect, it } from "vitest";

import { validateRegistry } from "./registry";
import type { EventSubscriber, JobRegistry, ReadModelDefinition } from "./types";

const noop = async () => {};
const subscriber = (name: string, events: string[], replayable = false): EventSubscriber => ({
  name,
  events,
  replayable,
  handle: noop,
});
const model = (name: string, events: string[]): ReadModelDefinition => ({
  name,
  table: "rpt.x",
  events,
  replay: noop,
  compare: async () => 0,
  clear: noop,
});
const registry = (over: Partial<JobRegistry>): JobRegistry => ({
  subscribers: [],
  jobs: [],
  readModels: [],
  ...over,
});

describe("job registry", () => {
  it("accepts well-formed subscribers, jobs and a fed read model", () => {
    expect(() =>
      validateRegistry(
        registry({
          subscribers: [subscriber("rpt.site-summary", ["sit.approved"], true)],
          jobs: [{ type: "iam.deactivate-departed", run: noop }],
          readModels: [model("rpt.site_summary", ["sit.approved"])],
        }),
      ),
    ).not.toThrow();
  });

  it("refuses duplicate and malformed names and subscribers without events", () => {
    expect(() =>
      validateRegistry(
        registry({
          subscribers: [subscriber("inv.stock", ["a.b"]), subscriber("inv.stock", ["a.b"])],
          jobs: [{ type: "NoModule", run: noop }],
        }),
      ),
    ).toThrow(/registered twice[\s\S]*name must be/);
    expect(() => validateRegistry(registry({ subscribers: [subscriber("inv.x", [])] }))).toThrow(
      /listens to no event/,
    );
  });

  it("takes the platform's own workers under core, the name the search index has always had", () => {
    expect(() =>
      validateRegistry(
        registry({
          subscribers: [subscriber("core.search-index", ["party.created"])],
          jobs: [{ type: "core.search-rebuild", run: noop }],
        }),
      ),
    ).not.toThrow();
    expect(() => validateRegistry(registry({ jobs: [{ type: "cores.x", run: noop }] }))).toThrow(
      /name must be/,
    );
  });

  it("takes a subscriber whose subscriptions are written in the database, when it says so", () => {
    // The flow engine hears whatever the published definitions listen to, which nothing in code
    // can know (REQ-WFL-007). Saying it outright is what keeps an empty list from meaning both
    // "dynamic" and "somebody forgot".
    const engine = { ...subscriber("wfl.engine", []), dynamicEvents: true };
    expect(() => validateRegistry(registry({ subscribers: [engine] }))).not.toThrow();
  });

  it("refuses a read model that no replayable subscriber keeps live (D-234)", () => {
    expect(() =>
      validateRegistry(
        registry({
          subscribers: [subscriber("tsk.notify", ["sit.approved"], false)],
          readModels: [model("rpt.site_summary", ["sit.approved"])],
        }),
      ),
    ).toThrow(/no replayable subscriber/);
  });
});
