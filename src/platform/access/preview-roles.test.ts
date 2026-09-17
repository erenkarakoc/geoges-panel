import { describe, expect, it } from "vitest";

import {
  createPreviewRolePolicy,
  previewRoles,
  resolvePreviewRole,
} from "@/platform/access/preview-roles";
import { allNavigationItems } from "@/platform/navigation/navigation-registry";

describe("resolvePreviewRole", () => {
  it("ignores the cookie when switching is not allowed", () => {
    expect(resolvePreviewRole("crew-lead", false).id).toBe("owner");
  });

  it("uses the cookie in development and falls back to the owner", () => {
    expect(resolvePreviewRole("crew-lead", true).id).toBe("crew-lead");
    expect(resolvePreviewRole("unknown", true).id).toBe("owner");
    expect(resolvePreviewRole(undefined, true).id).toBe("owner");
  });
});

describe("createPreviewRolePolicy", () => {
  it("lets the owner seat see every menu entry", () => {
    const owner = createPreviewRolePolicy(resolvePreviewRole(undefined, false));
    for (const item of allNavigationItems()) {
      expect(owner.can(item.requiredPermission ?? "")).toBe(true);
    }
  });

  it("narrows other seats to their permissions", () => {
    const crewLead = createPreviewRolePolicy(resolvePreviewRole("crew-lead", true));
    expect(crewLead.can("sit.daily-site-log.view")).toBe(true);
    expect(crewLead.can("fin.finance.view")).toBe(false);
  });

  it("only grants permissions that exist in the menu", () => {
    const known = new Set(allNavigationItems().map((item) => item.requiredPermission));
    for (const role of previewRoles) {
      if (role.permissions !== "all") {
        for (const permission of role.permissions) {
          expect(known.has(permission)).toBe(true);
        }
      }
    }
  });

  it("gives every seat at least one site", () => {
    for (const role of previewRoles) {
      expect(role.sites.length).toBeGreaterThan(0);
    }
  });
});
