/**
 * Why an approval is with this person (REQ-WFL-013, REQ-WFL-033, TASK-0120).
 *
 * The rule is stored with the approval; the sentence is written here, from the rule and the names
 * the panel knows today. That way a role that is renamed does not leave old approvals explaining
 * themselves with the old name — and nothing in the sentence is a code.
 */

export type OwnerRule = {
  type?: string;
  userId?: string;
  role?: string;
  relation?: string;
  permission?: string;
};

export type NameBook = {
  roles?: ReadonlyMap<string, string>;
  permissions?: ReadonlyMap<string, string>;
  relations?: ReadonlyMap<string, string>;
  people?: ReadonlyMap<string, string>;
};

/** The sentence a person reads on the approval: "… olduğunuz için". */
export function whyMine(rule: unknown, names: NameBook = {}): string {
  const said = (rule ?? {}) as OwnerRule;

  if (said.type === "role" && said.role) {
    const role = names.roles?.get(said.role);
    return role ? `${role} rolünü taşıdığınız için sizde.` : "Taşıdığınız rol nedeniyle sizde.";
  }
  if (said.type === "permission" && said.permission) {
    const permission = names.permissions?.get(said.permission);
    return permission
      ? `${permission} yetkiniz olduğu için sizde.`
      : "Sahip olduğunuz bir yetki nedeniyle sizde.";
  }
  if (said.type === "relation" && said.relation) {
    const relation = names.relations?.get(said.relation);
    return relation ? `${relation} olduğunuz için sizde.` : "Kayıtla ilişkiniz nedeniyle sizde.";
  }
  if (said.type === "user") {
    return "Bu adım doğrudan size verildiği için sizde.";
  }
  return "Akış bu adımı size verdi.";
}

/**
 * The same, for an approval that is in this queue because of a delegation (REQ-IAM-020). It says
 * whose place is being stood in and nothing more: the rule explains why the approval is *theirs*,
 * which is their sentence, not the delegate's.
 */
export function whyDelegated(forWhom: string | null | undefined, names: NameBook = {}): string {
  const who = forWhom ? (names.people?.get(forWhom) ?? null) : null;
  return who ? `${who} adına vekâleten sizde.` : "Vekâleten sizde.";
}
