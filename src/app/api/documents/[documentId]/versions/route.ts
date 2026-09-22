import { documents } from "@/records";

import { fileInfo, handle, json, readBody } from "../../respond";

/** Starts a new version of a document (REQ-DOC-005); earlier versions stay. */
export function POST(request: Request, ctx: RouteContext<"/api/documents/[documentId]/versions">) {
  return handle(async () => {
    const { documentId } = await ctx.params;
    const body = await readBody(request);
    const started = await documents().startVersion(
      documentId,
      fileInfo(body.file),
      body.isSigned === true,
    );
    return json(started, 201);
  });
}
