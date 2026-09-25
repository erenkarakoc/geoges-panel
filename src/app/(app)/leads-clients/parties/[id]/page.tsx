import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  addContactAction,
  changeContactAction,
  changePartyAction,
  setContactStatusAction,
  setPartyStatusAction,
} from "@/app/(app)/leads-clients/parties/[id]/actions";
import { mayOpenParties, mayRegisterParties, partyCard } from "@/modules/crm";
import { PartiesDenied } from "@/modules/crm/ui/parties-denied";
import { PartyCard } from "@/modules/crm/ui/party-card";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Firma kartı" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** SCR-083 — the firm card (TASK-0122). */
export default async function PartyCardPage({ params }: PageProps<"/leads-clients/parties/[id]">) {
  if (!isModuleEnabled("CRM")) return <FeatureOff />;
  if (!(await mayOpenParties())) return <PartiesDenied />;

  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [card, canRegister] = await Promise.all([partyCard(id), mayRegisterParties()]);
  if (!card) notFound();

  return (
    <PartyCard
      actions={{
        addContact: addContactAction.bind(null, id),
        change: changePartyAction.bind(null, id),
        changeContact: changeContactAction.bind(null, id),
        setContactStatus: setContactStatusAction.bind(null, id),
        setStatus: setPartyStatusAction.bind(null, id),
      }}
      canRegister={canRegister}
      contacts={card.contacts}
      customFields={card.customFields}
      key={card.party.updatedAt.toISOString()}
      party={card.party}
    />
  );
}
