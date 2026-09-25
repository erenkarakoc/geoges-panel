import type { Metadata } from "next";

import {
  registerPartyAction,
  similarPartiesAction,
} from "@/app/(app)/leads-clients/parties/actions";
import {
  listParties,
  mayOpenParties,
  mayRegisterParties,
  PARTY_ROLES,
  type PartyRole,
} from "@/modules/crm";
import { PartiesDenied } from "@/modules/crm/ui/parties-denied";
import { PartyList } from "@/modules/crm/ui/party-list";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Firmalar" };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** The firm list (TASK-0122, REQ-CRM-004); the site-wide search's "Tümünü gör" lands here. */
export default async function PartiesPage({ searchParams }: PageProps<"/leads-clients/parties">) {
  if (!isModuleEnabled("CRM")) return <FeatureOff />;
  if (!(await mayOpenParties())) return <PartiesDenied />;

  const params = await searchParams;
  const words = one(params.q)?.trim() ?? "";
  const asked = one(params.role);
  const role = PARTY_ROLES.includes(asked as PartyRole) ? (asked as PartyRole) : null;
  const [parties, canRegister] = await Promise.all([
    listParties({ role, words }),
    mayRegisterParties(),
  ]);

  return (
    <PartyList
      actions={{ register: registerPartyAction, similar: similarPartiesAction }}
      canRegister={canRegister}
      key={`${words}|${role ?? ""}`}
      parties={parties}
      role={role}
      words={words}
    />
  );
}
