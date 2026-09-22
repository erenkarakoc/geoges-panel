import { documents } from "@/records";

import { handle, json, readBody, text } from "../../../respond";

/** Joins the received parts into the file and adds the version; safe to repeat. */
export function POST(
  request: Request,
  ctx: RouteContext<"/api/documents/uploads/[uploadId]/complete">,
) {
  return handle(async () => {
    const { uploadId } = await ctx.params;
    const body = await readBody(request);
    const sha256 = /^[0-9a-f]{64}$/.test(text(body.sha256)) ? text(body.sha256) : null;
    return json(await documents().complete(uploadId, sha256));
  });
}
