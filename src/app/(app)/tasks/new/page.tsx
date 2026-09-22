import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signInIdentity } from "@/modules/iam";
import { assignablePeople } from "@/modules/tsk";
import { AssignTaskForm } from "@/modules/tsk/ui/assign-task-form";
import { isModuleEnabled } from "@/platform/features/features";
import { FeatureOff } from "@/platform/ui/feature-off";

export const metadata: Metadata = { title: "Görev ver" };

// SCR-014 Görev ver (TASK-0108): the picker holds only the people in the giver's scope.
export default async function NewTaskPage() {
  if (!isModuleEnabled("TSK")) return <FeatureOff />;

  const signedIn = await signInIdentity();
  if (!signedIn) redirect("/sign-in");
  const people = await assignablePeople();

  return <AssignTaskForm people={people} selfId={signedIn.identity.userId} />;
}
