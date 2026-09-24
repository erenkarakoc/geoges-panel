import {
  resumeFromApproval,
  runEventTriggers,
  type OwnerRelations,
} from "@/modules/wfl/application/engine";
import type { EventSubscriber } from "@/platform/jobs/types";

/**
 * The engine as one subscriber (TASK-0117, REQ-WFL-007).
 *
 * Its `events` list is empty on purpose: which events matter is in the published definitions, not
 * in code, so the subscription rows are written by the publish itself (migration 0047) and this
 * list would only be a second, staler copy. The worker dispatches by subscriber name, so a
 * delivery addressed to `wfl.engine` arrives here whatever its event code is.
 *
 * Not replayable, and never will be: running a flow opens tasks and sends notifications, which a
 * read-model rebuild must not do twice (D-234).
 */
export function flowEngine(relations: OwnerRelations): EventSubscriber {
  return {
    name: "wfl.engine",
    events: [],
    replayable: false,
    async handle(db, event) {
      // Its own approvals come back here too: a decision is an event like any other, so a flow
      // waiting on a person is resumed by the same durable delivery as everything else.
      if (event.code === "approval.decided" && event.record?.id) {
        await resumeFromApproval(db, event.record.id, relations);
        return;
      }
      await runEventTriggers(
        db,
        {
          code: event.code,
          id: event.id,
          record: event.record,
          payload: event.payload,
        },
        relations,
      );
    },
  };
}
