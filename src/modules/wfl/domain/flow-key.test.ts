import { describe, expect, it } from "vitest";

import { definitionSchema } from "@/modules/wfl/domain/definition";
import { FLOW_KEY, flowKeyOf, starterDefinition } from "@/modules/wfl/domain/flow-key";

describe("the key a new flow is filed under", () => {
  it("turns a Turkish name into an address the database accepts", () => {
    expect(flowKeyOf("Şantiye çıkış işlemi")).toBe("santiye-cikis-islemi");
    expect(FLOW_KEY.test(flowKeyOf("Şantiye çıkış işlemi"))).toBe(true);
  });

  it("numbers a key that is already taken instead of overwriting a flow", () => {
    expect(flowKeyOf("Zimmet", ["zimmet"])).toBe("zimmet-2");
    expect(flowKeyOf("Zimmet", ["zimmet", "zimmet-2"])).toBe("zimmet-3");
  });

  it("never takes an address the flows screen uses for itself", () => {
    expect(flowKeyOf("Templates")).toBe("templates-2");
    expect(flowKeyOf("New")).toBe("new-2");
  });

  it("still gives an address to a name with nothing usable in it", () => {
    expect(FLOW_KEY.test(flowKeyOf("!!!"))).toBe(true);
    expect(FLOW_KEY.test(flowKeyOf("AB"))).toBe(true);
  });

  it("starts a new flow with something the engine's own schema accepts", () => {
    expect(definitionSchema.safeParse(starterDefinition()).success).toBe(true);
  });
});
