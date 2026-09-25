import type { AccessPolicy } from "@/platform/access/access-policy";

/**
 * SAMPLE DATA (owner decision D-061). There are no roles yet — IAM designs them (Phase 01/04).
 * These four seats come from the navigation prototype (TASK-0031) so the shell can be judged
 * from each of them. In development the account menu switches between them; everywhere else
 * the owner seat is used, which sees everything, exactly like `previewAccessPolicy`.
 * Delete this file when the IAM policy lands; the shell only depends on `AccessPolicy`.
 */
export type PreviewRoleId = "owner" | "coordinator" | "site-engineer" | "crew-lead";

export type PreviewRole = {
  id: PreviewRoleId;
  label: string;
  /** Permissions this seat holds; `"all"` sees every module. */
  permissions: "all" | readonly string[];
  /** Right zone fallback when the page has no action of its own (D-062). */
  primaryAction: string;
  /** Sites the scope selector offers; a single site is shown as plain text. */
  sites: readonly string[];
};

export const PREVIEW_ROLE_COOKIE = "dev_preview_role";

export const previewRoles: readonly PreviewRole[] = [
  {
    id: "owner",
    label: "Sahip",
    permissions: "all",
    primaryAction: "Görev ver",
    sites: ["Tüm şantiyeler", "Kavaklı Şantiyesi", "Ilgaz Şantiyesi", "Sarıyar Şantiyesi"],
  },
  {
    id: "coordinator",
    label: "Koordinatör",
    permissions: [
      "rpt.cockpit.view",
      "wfl.approval.view",
      "tsk.task.view",
      "sit.daily-site-log.view",
      "prj.module.view",
      "sit.module.view",
      "rpt.daily-report.view",
      "inv.stock.view",
      "eqp.asset.view",
      "qhs.record.view",
      "sup.ticket.view",
    ],
    primaryAction: "Kuyruğa gir",
    sites: ["Tüm şantiyelerim", "Kavaklı Şantiyesi", "Ilgaz Şantiyesi", "Sarıyar Şantiyesi"],
  },
  {
    id: "site-engineer",
    label: "Saha Mühendisi",
    permissions: [
      "rpt.cockpit.view",
      "tsk.task.view",
      "sit.daily-site-log.view",
      "sit.module.view",
      "inv.stock.view",
    ],
    primaryAction: "Günü kaydet",
    sites: ["Kavaklı Şantiyesi"],
  },
  {
    id: "crew-lead",
    label: "Taşeron Ekip Başı",
    permissions: ["rpt.cockpit.view", "tsk.task.view", "sit.daily-site-log.view"],
    primaryAction: "Günü kaydet",
    sites: ["Kavaklı Şantiyesi"],
  },
];

const ownerRole = previewRoles[0];

/**
 * The seat the shell renders. The cookie is honoured only when `allowSwitching` is true
 * (development), so a stale cookie can never narrow what a production user sees.
 */
export function resolvePreviewRole(
  cookieValue: string | undefined,
  allowSwitching: boolean,
): PreviewRole {
  if (!allowSwitching) {
    return ownerRole;
  }
  return previewRoles.find((role) => role.id === cookieValue) ?? ownerRole;
}

export function createPreviewRolePolicy(role: PreviewRole): AccessPolicy {
  const { permissions } = role;
  return {
    can: (permission) => permissions === "all" || permissions.includes(permission),
  };
}

/** Development role switcher: remembers the chosen seat for the server to read. */
export function rememberPreviewRole(roleId: PreviewRoleId): void {
  document.cookie = `${PREVIEW_ROLE_COOKIE}=${roleId}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}
