import { documents } from "@/records";

import { handle, json } from "../../respond";

/** Where an upload stands; the uploader asks after a lost connection (SPIKE-15). */
export function GET(_request: Request, ctx: RouteContext<"/api/documents/uploads/[uploadId]">) {
  return handle(async () => {
    const { uploadId } = await ctx.params;
    return json(await documents().uploadState(uploadId));
  });
}
