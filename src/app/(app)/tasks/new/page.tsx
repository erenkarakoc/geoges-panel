import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signInIdentity } from "@/modules/iam";
import { assignablePeople } from "@/modules/tsk";
import { AssignTaskPage } from "@/modules/tsk/ui/assign-task-form";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Görev ver" };

// SCR-014 Görev ver as a page, for an address opened directly or reloaded. Inside the panel the
// same address opens as a dialog over the current page (@modal/(.)tasks/new).
export default async function NewTaskPage() {
  if (!isModuleEnabled("TSK")) return <FeatureOff />;

  const signedIn = await signInIdentity();
  if (!signedIn) redirect("/sign-in");
  const people = await assignablePeople();

  return <AssignTaskPage people={people} selfId={signedIn.identity.userId} />;
}
