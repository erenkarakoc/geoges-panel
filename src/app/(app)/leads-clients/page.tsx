import { redirect } from "next/navigation";

/**
 * "Talepler & Müşteriler". The lead list (SCR-080) arrives with Phase 13; until then the module
 * opens on what it already has, the firm list (TASK-0122).
 */
export default function LeadsClientsPage() {
  redirect("/leads-clients/parties");
}
