import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { type AccessPolicy, previewAccessPolicy } from "@/platform/access/access-policy";
import { indicatorRegistry } from "@/platform/today/indicator-registry";
import {
  allNavigationItems,
  findNavigationItemByHref,
  getVisibleNavigation,
  navigationRegistry,
  noWorkCounts,
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

  it("uses kebab-case routes, and a single segment unless the screen sits inside another", () => {
    for (const item of allItems) {
      expect(item.href).toMatch(/^\/[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)?$/);
    }
    // A single segment is what the placeholder page can generate; a deeper address means the
    // screen has a route of its own, which the last test in this file checks against the disk.
    const deep = allItems.filter((item) => item.href.slice(1).includes("/"));
    expect(deep.map((item) => item.href)).toEqual([
      "/admin/workflows",
      "/approvals/revision-requests",
    ]);
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

  it("shows no badge until somebody reads the real numbers", () => {
    // The shell is handed counts per person; platform holds none of its own, so a badge can never
    // be a number nobody asked a module for.
    expect(noWorkCounts).toEqual({});
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
    expect(findNavigationItemByHref(navigationRegistry, "/today")?.id).toBe("today");
    expect(findNavigationItemByHref(navigationRegistry, "/approvals")?.id).toBe("approvals");
  });
});

describe("indicatorRegistry", () => {
  it("has unique indicator ids", () => {
    const ids = indicatorRegistry.map((indicator) => indicator.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('marks six figures as critical, the ones "Bugün" shows unfolded', () => {
    expect(indicatorRegistry.filter((indicator) => indicator.critical)).toHaveLength(6);
  });

  it("gives every figure a sample value, so no card renders an empty number", () => {
    expect(indicatorRegistry.every((indicator) => Boolean(indicator.sampleValue))).toBe(true);
  });
});

describe("getVisibleNavigation with feature switches (CONFIGURATION section 5)", () => {
  it("leaves a switched-off module out of the menu", () => {
    const all = getVisibleNavigation(navigationRegistry, previewAccessPolicy);
    const withoutFin = getVisibleNavigation(
      navigationRegistry,
      previewAccessPolicy,
      (code) => code !== "FIN",
    );
    const codes = (groups: typeof all) => groups.flatMap((g) => g.items.map((i) => i.moduleCode));
    expect(codes(all)).toContain("FIN");
    expect(codes(withoutFin)).not.toContain("FIN");
    expect(codes(withoutFin).length).toBe(codes(all).filter((c) => c !== "FIN").length);
  });
});

/**
 * Found by walking the acceptance list on 2026-09-24: the "Revizyon Talepleri" entry opened
 * "Henüz geliştirilmedi" for a screen built weeks earlier, because its address was a slug of its
 * own while the screen lives as the approval screen's second tab. Nothing failed — a slug with no
 * route is exactly what an unbuilt module looks like — so the menu is checked against the routes
 * on disk here.
 */
describe("every menu entry opens something", () => {
  const appDir = path.join(process.cwd(), "src", "app", "(app)");
  const pageOf = (href: string) => path.join(appDir, ...href.slice(1).split("/"), "page.tsx");
  const ownScreen = (href: string) => existsSync(pageOf(href));
  const placeholderSlug = (href: string) => !href.slice(1).includes("/");

  it("leads to a screen of its own or to the module placeholder", () => {
    const lost = allItems.filter((item) => !ownScreen(item.href) && !placeholderSlug(item.href));
    expect(lost.map((item) => item.href)).toEqual([]);
  });

  it("opens the screen that exists rather than a placeholder beside it", () => {
    // The built screens, by the addresses the screen inventory records for them.
    for (const href of [
      "/admin/workflows",
      "/approvals/revision-requests",
      "/audit-log",
      "/users-roles",
      "/tasks",
      "/approvals",
      "/today",
      "/sites",
    ]) {
      expect(ownScreen(href)).toBe(true);
      expect(findNavigationItemByHref(navigationRegistry, href)).toBeDefined();
    }
  });
});
