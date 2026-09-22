import { documents } from "@/records";

import { handle, json } from "../../../respond";

/** Marks a version as the signed one (REQ-DOC-005). */
export function POST(
  _request: Request,
  ctx: RouteContext<"/api/documents/versions/[versionId]/sign">,
) {
  return handle(async () => {
    const { versionId } = await ctx.params;
    await documents().markSigned(versionId);
    return json({ signed: true });
  });
}
