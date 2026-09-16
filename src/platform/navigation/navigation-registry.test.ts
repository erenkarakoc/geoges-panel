import { describe, expect, it } from "vitest";

import { type AccessPolicy, previewAccessPolicy } from "@/platform/access/access-policy";
import { dashboardWidgetRegistry } from "@/platform/dashboard/dashboard-widget-registry";
import {
  findNavigationItemByHref,
  getVisibleNavigation,
  navigationRegistry,
  pickNavigationItems,
} from "@/platform/navigation/navigation-registry";

const allItems = navigationRegistry.flatMap((group) => group.items);

describe("navigationRegistry", () => {
  it("has unique ids and hrefs", () => {
    expect(new Set(allItems.map((item) => item.id)).size).toBe(allItems.length);
    expect(new Set(allItems.map((item) => item.href)).size).toBe(allItems.length);
  });

  it("uses single-segment kebab-case routes so placeholder pages can be generated", () => {
    for (const item of allItems) {
      expect(item.href).toMatch(/^\/[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("guards every item with a permission", () => {
    expect(allItems.every((item) => Boolean(item.requiredPermission))).toBe(true);
  });
});

describe("getVisibleNavigation", () => {
  it("shows everything under the M0 preview policy", () => {
    const visible = getVisibleNavigation(navigationRegistry, previewAccessPolicy);
    expect(visible.flatMap((group) => group.items)).toHaveLength(allItems.length);
  });

  it("hides items without permission and groups left empty", () => {
    const cockpitOnly: AccessPolicy = { can: (permission) => permission === "rpt.cockpit.view" };

    const visible = getVisibleNavigation(navigationRegistry, cockpitOnly);

    expect(visible.map((group) => group.id)).toEqual(["overview"]);
    expect(visible[0]?.items.map((item) => item.id)).toEqual(["cockpit"]);
  });
});

describe("pickNavigationItems", () => {
  it("keeps registry order, only given ids, and drops empty groups", () => {
    const picked = pickNavigationItems(navigationRegistry, ["finance", "cockpit"]);

    expect(picked.map((group) => group.id)).toEqual(["overview", "commercial"]);
    expect(picked.flatMap((group) => group.items).map((item) => item.id)).toEqual([
      "cockpit",
      "finance",
    ]);
  });
});

describe("findNavigationItemByHref", () => {
  it("finds a registered module and returns undefined for unknown routes", () => {
    expect(findNavigationItemByHref(navigationRegistry, "/inventory")?.moduleCode).toBe("INV");
    expect(findNavigationItemByHref(navigationRegistry, "/unknown")).toBeUndefined();
  });
});

describe("dashboardWidgetRegistry", () => {
  it("has unique widget ids", () => {
    const ids = dashboardWidgetRegistry.map((widget) => widget.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
