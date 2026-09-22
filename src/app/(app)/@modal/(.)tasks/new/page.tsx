import { signInIdentity } from "@/modules/iam";
import { assignablePeople } from "@/modules/tsk";
import { AssignTaskOverlay } from "@/modules/tsk/ui/assign-task-form";
import { isModuleEnabled } from "@/platform/features/features";

// SCR-014 Görev ver opened from inside the panel (the header's primary action, the task list):
// the form comes over the current page instead of replacing it. A reload shows the page version.
export default async function NewTaskOverlay() {
  if (!isModuleEnabled("TSK")) return null;

  const signedIn = await signInIdentity();
  if (!signedIn) return null;
  const people = await assignablePeople();

  return <AssignTaskOverlay people={people} selfId={signedIn.identity.userId} />;
}
