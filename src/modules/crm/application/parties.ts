import "server-only";

import { customFieldDefinitions, visibleCustomFields } from "@/modules/adm";
import {
  addPartyRole,
  insertContact,
  insertParty,
  readContacts,
  readParties,
  readParty,
  readPartyByTaxNo,
  readPartyNames,
  readPartiesWithRole,
  readSimilarParties,
  setContactStatus,
  setPartyStatus,
  updateContact,
  updateParty,
} from "@/modules/crm/data/party-store";
import {
  contactInput,
  partyInput,
  partyMessage,
  PARTY_ROLES,
  type PartyRole,
  type PartyStatus,
} from "@/modules/crm/domain/party";
import {
  AccessDeniedError,
  can,
  canSee,
  readEffectivePermissions,
  signInIdentity,
} from "@/modules/iam";

/**
 * Firm cards (TASK-0122, SCR-083). Firms are registered where they are met — sales its clients,
 * purchasing its suppliers, equipment the firms it rents from — so any of the three may register
 * one, and the database says the same thing again (`crm.may_register_parties`).
 */

const REGISTER = ["crm.module.manage", "pur.module.manage", "eqp.module.manage"] as const;
const OPEN = ["crm.module.view", "crm.module.own", "pur.module.view", "eqp.module.view"] as const;

async function identity() {
  const signedIn = await signInIdentity();
  if (!signedIn) throw new AccessDeniedError("iam.session");
  return signedIn.identity;
}

/** Whether the person may register firms and change their cards. */
export async function mayRegisterParties(): Promise<boolean> {
  const snapshot = await readEffectivePermissions();
  return Boolean(snapshot && REGISTER.some((permission) => can(snapshot, permission)));
}

/** Whether the person may open the firm list and firm cards. */
export async function mayOpenParties(): Promise<boolean> {
  const snapshot = await readEffectivePermissions();
  return Boolean(
    snapshot && [...OPEN, ...REGISTER].some((permission) => can(snapshot, permission)),
  );
}

async function assertMayOpen() {
  if (!(await mayOpenParties())) throw new AccessDeniedError("crm.module.view");
}

export async function listParties(filter: { words?: string | null; role?: string | null } = {}) {
  await assertMayOpen();
  const role = PARTY_ROLES.includes(filter.role as PartyRole) ? (filter.role as PartyRole) : null;
  return readParties(await identity(), { role, words: filter.words });
}

/** The card with its people and the custom values the person may see; null when there is none. */
export async function partyCard(id: string) {
  await assertMayOpen();
  const who = await identity();
  const found = await readParty(who, id);
  if (!found) return null;
  const [contacts, definitions, snapshot] = await Promise.all([
    readContacts(who, id),
    customFieldDefinitions("crm.party"),
    readEffectivePermissions(),
  ]);
  const customFields = visibleCustomFields(definitions, found.customFields, (dataClass) =>
    Boolean(snapshot && canSee(snapshot, "crm", dataClass)),
  );
  return { contacts, customFields, party: found };
}

/** Firm names by id, for the records that point at a firm (reference data, no card right). */
export async function partyNames(ids: readonly string[]) {
  return readPartyNames(await identity(), ids);
}

/** Active firms with a role, for another record's picker (a project's client, a site's subcontractor). */
export async function partyChoices(role: PartyRole) {
  return readPartiesWithRole(await identity(), role);
}

/** Firms whose name looks like the typed one — shown before a new card is saved. */
export async function findSimilarParties(name: string, except?: string | null) {
  await assertMayOpen();
  if (name.trim().length < 2) return [];
  return readSimilarParties(await identity(), name, except);
}

/**
 * What happened, in a sentence. `existingId` is the firm that already has this tax number, so the
 * screen can offer its card instead of a second one.
 */
export type PartyResult = { error: string | null; id?: string | null; existingId?: string | null };

function refusal(error: unknown): string | null {
  if (error instanceof AccessDeniedError) return "Firma kaydetme yetkiniz yok.";
  return partyMessage(error as { code?: string; constraint?: string });
}

async function attempt(work: () => Promise<string | boolean>): Promise<PartyResult> {
  try {
    if (!(await mayRegisterParties())) throw new AccessDeniedError("crm.module.manage");
    const done = await work();
    if (done === false) return { error: "Firma bulunamadı." };
    return { error: null, id: typeof done === "string" ? done : null };
  } catch (error) {
    const said = refusal(error);
    if (said) return { error: said };
    throw error;
  }
}

/** The form's own words first; the database is asked only with a valid card. */
function firstIssue(issues: readonly { message: string }[]): PartyResult {
  return { error: issues[0]?.message ?? "Firma bilgileri eksik." };
}

async function sameTaxNo(taxNo: string | null | undefined, self?: string) {
  if (!taxNo) return null;
  const found = await readPartyByTaxNo(await identity(), taxNo);
  return found && found.id !== self ? found : null;
}

export async function registerParty(input: unknown): Promise<PartyResult> {
  const parsed = partyInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  const existing = await sameTaxNo(parsed.data.taxNo);
  if (existing) {
    return {
      error: `Bu vergi numarası "${existing.name}" kartında kayıtlı. Yeni kart açmak yerine o firmaya rol ekleyin.`,
      existingId: existing.id,
    };
  }
  return attempt(async () => insertParty(await identity(), parsed.data));
}

export async function changeParty(id: string, input: unknown): Promise<PartyResult> {
  const parsed = partyInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  const existing = await sameTaxNo(parsed.data.taxNo, id);
  if (existing) {
    return {
      error: `Bu vergi numarası "${existing.name}" kartında kayıtlı; aynı numara iki firmada olamaz.`,
      existingId: existing.id,
    };
  }
  return attempt(async () => updateParty(await identity(), id, parsed.data));
}

/** "This firm, again, in a new role": the role joins the card that exists (REQ-PUR-001). */
export async function giveRole(id: string, role: string): Promise<PartyResult> {
  if (!PARTY_ROLES.includes(role as PartyRole)) return { error: "Bilinmeyen rol." };
  return attempt(async () => addPartyRole(await identity(), id, role as PartyRole));
}

/** A firm is never deleted; it turns passive and history still names it. */
export async function changePartyStatus(id: string, status: PartyStatus): Promise<PartyResult> {
  return attempt(async () => setPartyStatus(await identity(), id, status));
}

export async function addContact(partyId: string, input: unknown): Promise<PartyResult> {
  const parsed = contactInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  return attempt(async () => insertContact(await identity(), partyId, parsed.data));
}

export async function changeContact(id: string, input: unknown): Promise<PartyResult> {
  const parsed = contactInput.safeParse(input);
  if (!parsed.success) return firstIssue(parsed.error.issues);
  return attempt(async () => updateContact(await identity(), id, parsed.data));
}

/** Somebody who left the firm turns passive; the card's history still has them. */
export async function changeContactStatus(id: string, status: PartyStatus): Promise<PartyResult> {
  return attempt(async () => setContactStatus(await identity(), id, status));
}
