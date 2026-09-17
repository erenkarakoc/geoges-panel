import { describe, expect, it } from "vitest";

import { type AccessPolicy, previewAccessPolicy } from "@/platform/access/access-policy";
import { dashboardWidgetRegistry } from "@/platform/dashboard/dashboard-widget-registry";
import {
  allNavigationItems,
  findNavigationItemByHref,
  getVisibleNavigation,
  navigationRegistry,
  sampleWorkCounts,
  pickNavigationItems,
  workNavigation,
} from "@/platform/navigation/navigation-registry";

const groupItems = navigationRegistry.flatMap((group) => group.items);
const allItems = allNavigationItems();

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

  it("gives every group an icon, because the rail shows the group and not its modules", () => {
    expect(navigationRegistry.every((group) => Boolean(group.icon))).toBe(true);
  });
});

describe("workNavigation", () => {
  it("holds the three screens of the work layer, in order", () => {
    expect(workNavigation.map((item) => item.id)).toEqual(["today", "approvals", "tasks"]);
  });

  it("keeps them out of the module groups, so no screen is listed twice", () => {
    const groupIds = new Set(groupItems.map((item) => item.id));
    for (const item of workNavigation) {
      expect(groupIds.has(item.id)).toBe(false);
    }
  });

  it("counts sample badges only for entries that exist", () => {
    const ids = new Set(workNavigation.map((item) => item.id));
    for (const id of Object.keys(sampleWorkCounts)) {
      expect(ids.has(id)).toBe(true);
    }
  });
});

describe("getVisibleNavigation", () => {
  it("shows everything under the M0 preview policy", () => {
    const visible = getVisibleNavigation(navigationRegistry, previewAccessPolicy);
    expect(visible.flatMap((group) => group.items)).toHaveLength(groupItems.length);
  });

  it("hides items without permission and groups left empty", () => {
    const financeOnly: AccessPolicy = { can: (permission) => permission === "fin.finance.view" };

    const visible = getVisibleNavigation(navigationRegistry, financeOnly);

    expect(visible.map((group) => group.id)).toEqual(["commercial"]);
    expect(visible[0]?.items.map((item) => item.id)).toEqual(["finance"]);
  });
});

describe("pickNavigationItems", () => {
  it("keeps registry order, only given ids, and drops empty groups", () => {
    const picked = pickNavigationItems(navigationRegistry, ["finance", "inventory"]);

    expect(picked.map((group) => group.id)).toEqual(["resources-production", "commercial"]);
    expect(picked.flatMap((group) => group.items).map((item) => item.id)).toEqual([
      "inventory",
      "finance",
    ]);
  });
});

describe("findNavigationItemByHref", () => {
  it("finds a registered module and returns undefined for unknown routes", () => {
    expect(findNavigationItemByHref(navigationRegistry, "/inventory")?.moduleCode).toBe("INV");
    expect(findNavigationItemByHref(navigationRegistry, "/unknown")).toBeUndefined();
  });

  it("finds work-layer screens too, now that they left the group list", () => {
    expect(findNavigationItemByHref(navigationRegistry, "/dashboard")?.id).toBe("today");
    expect(findNavigationItemByHref(navigationRegistry, "/approvals")?.id).toBe("approvals");
  });
});

describe("dashboardWidgetRegistry", () => {
  it("has unique widget ids", () => {
    const ids = dashboardWidgetRegistry.map((widget) => widget.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('marks six figures as critical, the ones "Bugün" shows unfolded', () => {
    expect(dashboardWidgetRegistry.filter((widget) => widget.critical)).toHaveLength(6);
  });

  it("gives every figure a sample value, so no card renders an empty number", () => {
    expect(dashboardWidgetRegistry.every((widget) => Boolean(widget.sampleValue))).toBe(true);
  });
});
