import { readRoleHolder } from "@/modules/iam/data/account-security-store";
import { defineCapabilities } from "@/platform/capabilities/catalog";

/**
 * What IAM offers a flow (REQ-WFL-003, `docs/requirements/REQ-IAM.md` catalog). No action, by
 * decision: nothing in the panel grants or takes away a permission at run time, so a flow cannot
 * ask for one (D-092, REQ-WFL-022). What it publishes and what a condition may read is here.
 *
 * Only what exists today is declared; the module's written catalog also names events that arrive
 * with the roles and delegation screens (Phase 09).
 */
export const iamCapabilities = defineCapabilities({
  module: "IAM",
  events: [
    {
      code: "two_factor.reset",
      name: "İki adımlı doğrulama sıfırlandı",
      when: "Bir yönetici başkasının ikinci faktörünü sıfırladığında",
      carries: ["kişi", "sıfırlayan"],
      dataClass: "internal",
    },
  ],
  actions: [],
  conditions: [
    { code: "user.roles", name: "Kişinin rolleri", type: "list", dataClass: "internal" },
    { code: "user.is_owner", name: "Sahip katmanında mı", type: "boolean", dataClass: "internal" },
    { code: "user.manager", name: "Kişinin amiri", type: "person", dataClass: "internal" },
    {
      code: "role_assignment.scope",
      name: "Atamanın kapsamı",
      type: "scope",
      dataClass: "internal",
    },
  ],
  relations: [
    {
      code: "role.holder",
      name: "Rolü taşıyan kişi",
      resolve: (caller, roleCode) =>
        roleCode ? readRoleHolder(caller.db, roleCode) : Promise.resolve(null),
    },
  ],
});
