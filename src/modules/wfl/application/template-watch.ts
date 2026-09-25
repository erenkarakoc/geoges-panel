import { readCopiesBehindTemplateAsSystem } from "@/modules/wfl/data/flow-store";
import type { CapabilityActions } from "@/modules/wfl/application/engine";
import type { EventSubscriber } from "@/platform/jobs/types";

/**
 * A template that moved on tells the people whose copies are now behind (REQ-WFL-027, TASK-0120).
 *
 * It is a subscriber rather than a nightly sweep on purpose: the news happens once, when the template
 * changes, so it is told once. Nothing here touches a copy — the whole rule is that a template update
 * does not change what somebody has already made (D-086) — and the notification goes through the
 * catalog's action like every other notification a flow sends (D-280).
 */
export function flowTemplateWatch(actions: Partial<CapabilityActions>): EventSubscriber {
  return {
    name: "wfl.template_watch",
    events: ["workflow.template_updated"],
    // Not replayable: telling somebody twice is worse than not rebuilding a read model (D-234).
    replayable: false,
    async handle(db, event) {
      const templateKey = event.payload.template;
      if (typeof templateKey !== "string" || !actions.run) return;

      const behind = await readCopiesBehindTemplateAsSystem(db, templateKey);
      for (const copy of behind) {
        if (!copy.ownerUserId) continue;
        await actions.run(db, "notification.send", {
          userId: copy.ownerUserId,
          type: "workflow.template_behind",
          subject: `${copy.flowName} akışının şablonunda yeni sürüm var`,
          linkPath: `/admin/workflows/${copy.flowKey}`,
          // One word per copy and per template version: the same news is never sent twice.
          sourceKey: `wfl:template-behind:${copy.flowKey}:${copy.templateVersion}`,
          isCritical: false,
        });
      }
    },
  };
}
