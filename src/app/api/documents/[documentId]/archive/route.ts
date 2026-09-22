import { documents } from "@/records";

import { handle, json, readBody, text } from "../../respond";

/** Archives a document with a reason (REQ-DOC-006); it is never deleted. */
export function POST(request: Request, ctx: RouteContext<"/api/documents/[documentId]/archive">) {
  return handle(async () => {
    const { documentId } = await ctx.params;
    const body = await readBody(request);
    await documents().archive(documentId, text(body.reason));
    return json({ archived: true });
  });
}
