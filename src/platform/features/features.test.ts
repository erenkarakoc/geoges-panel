import { describe, expect, it } from "vitest";

import { disabledModules, isModuleEnabled } from "./features";

describe("feature switches (CONFIGURATION section 5)", () => {
  it("keeps every module on by default", () => {
    expect(isModuleEnabled("FIN", {})).toBe(true);
    expect(disabledModules({ FEATURES_OFF: "" }).size).toBe(0);
  });

  it("turns off the listed modules, whatever the spacing and case", () => {
    const env = { FEATURES_OFF: " fin, HR ,," };
    expect([...disabledModules(env)].sort()).toEqual(["FIN", "HR"]);
    expect(isModuleEnabled("FIN", env)).toBe(false);
    expect(isModuleEnabled("hr", env)).toBe(false);
    expect(isModuleEnabled("SIT", env)).toBe(true);
  });
});
