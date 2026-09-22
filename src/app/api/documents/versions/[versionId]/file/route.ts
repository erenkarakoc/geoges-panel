import { NextResponse, type NextRequest } from "next/server";

import { documents } from "@/records";

import { handle } from "../../../respond";

/**
 * Opens one version (REQ-DOC-008): the document is read as the person first, then the browser
 * is sent to a five-minute signed link. `?preview=1` shows it in the browser when the type
 * allows. The link is neither logged nor cached (SPIKE-09 rules 2 and 5).
 */
export function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/documents/versions/[versionId]/file">,
) {
  return handle(async () => {
    const { versionId } = await ctx.params;
    const preview = request.nextUrl.searchParams.get("preview") === "1";
    const { url } = await documents().link(versionId, { preview });
    const response = NextResponse.redirect(url, 303);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  });
}
