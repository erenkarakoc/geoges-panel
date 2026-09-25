import { describe, expect, it } from "vitest";

import { validateRegistry } from "@/platform/jobs/registry";

import { jobRegistry } from "./registry";

/**
 * The registry the worker really starts with. Its rules were tested only against made-up
 * registries, so the first real search registration (TASK-0122) stopped the dev server at start;
 * checking the real one here finds that before anybody starts a server.
 */
describe("the application's job registry", () => {
  it("is one the worker can start with", () => {
    expect(() => validateRegistry(jobRegistry)).not.toThrow();
  });
});
