"use server";

import { revalidatePath } from "next/cache";

import { findSimilarParties, registerParty } from "@/modules/crm";
import type { PartyFormValue } from "@/modules/crm/ui/party-form";

/** The firm list (TASK-0122): lookalikes before a new card, then the card itself. */
export async function similarPartiesAction(name: string) {
  const found = await findSimilarParties(name);
  return found.map((one) => ({ city: one.city, id: one.id, name: one.name, roles: one.roles }));
}

export async function registerPartyAction(value: PartyFormValue) {
  const said = await registerParty(value);
  if (!said.error) revalidatePath("/leads-clients/parties");
  return said;
}
