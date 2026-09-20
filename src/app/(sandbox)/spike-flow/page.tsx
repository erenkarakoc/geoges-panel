import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SpikeFlowPageWithProvider } from "@/sandbox/spike-flow/spike-flow-page";

export const metadata: Metadata = { title: "SPIKE-07 akış şeması" };

// Phase 06 spike (SPIKE-07), development only, deleted with its report.
export default function SpikeFlowRoute() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <SpikeFlowPageWithProvider />;
}
