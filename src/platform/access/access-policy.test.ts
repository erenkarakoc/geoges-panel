import { describe, expect, it } from "vitest";

import { type AccessPolicy, filterByPermission } from "@/platform/access/access-policy";

const onlyViewSites: AccessPolicy = {
  can: (permission) => permission === "sit.site.view",
};

describe("filterByPermission", () => {
  it("keeps items the policy allows and items without a required permission", () => {
    const items = [
      { id: "sites", requiredPermission: "sit.site.view" },
      { id: "finance", requiredPermission: "fin.finance.view" },
      { id: "public" },
    ];

    expect(filterByPermission(items, onlyViewSites).map((item) => item.id)).toEqual([
      "sites",
      "public",
    ]);
  });
});
