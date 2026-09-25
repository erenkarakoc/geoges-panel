/**
 * CRM's public surface (MODULE_BOUNDARIES section 2). Other modules and routes reach firms only
 * through here. Server-only. The firm card is built first (TASK-0122); leads, the contact log,
 * tenders and the client scorecard arrive in Phase 13.
 */
export {
  addContact,
  changeContact,
  changeContactStatus,
  changeParty,
  changePartyStatus,
  findSimilarParties,
  giveRole,
  listParties,
  mayOpenParties,
  mayRegisterParties,
  partyCard,
  registerParty,
  type PartyResult,
} from "./application/parties";
export {
  PARTY_ROLES,
  ROLE_LABELS,
  ROLE_NOTES,
  roleWords,
  taxNoWarning,
  type PartyRole,
  type PartyStatus,
} from "./domain/party";
export type { Party, PartyContact, PartyRow } from "./data/party-store";

// Site-wide search (TASK-0110): how a firm looks in results, registered in src/records.
export { projectPartyForSearch, scanPartiesForSearch } from "./data/party-store";

// The module's capability catalog, read by the flow engine (TASK-0118).
export { crmCapabilities } from "@/modules/crm/capabilities";
