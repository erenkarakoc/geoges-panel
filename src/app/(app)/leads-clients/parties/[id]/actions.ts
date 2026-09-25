"use server";

import { revalidatePath } from "next/cache";

import {
  addContact,
  changeContact,
  changeContactStatus,
  changeParty,
  changePartyStatus,
  type PartyStatus,
} from "@/modules/crm";
import type { PartyFormValue } from "@/modules/crm/ui/party-form";

/** The firm card (SCR-083, TASK-0122). Every change refreshes the card and the list. */
function refreshed<T extends { error: string | null }>(partyId: string, said: T): T {
  if (!said.error) {
    revalidatePath(`/leads-clients/parties/${partyId}`);
    revalidatePath("/leads-clients/parties");
  }
  return said;
}

export async function changePartyAction(partyId: string, value: PartyFormValue) {
  return refreshed(partyId, await changeParty(partyId, value));
}

export async function setPartyStatusAction(partyId: string, status: PartyStatus) {
  return refreshed(partyId, await changePartyStatus(partyId, status));
}

type ContactForm = { name: string; title: string; phone: string; email: string };

export async function addContactAction(partyId: string, value: ContactForm) {
  return refreshed(partyId, await addContact(partyId, value));
}

export async function changeContactAction(partyId: string, contactId: string, value: ContactForm) {
  return refreshed(partyId, await changeContact(contactId, value));
}

export async function setContactStatusAction(
  partyId: string,
  contactId: string,
  status: PartyStatus,
) {
  return refreshed(partyId, await changeContactStatus(contactId, status));
}
