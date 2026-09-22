import type { NextRequest } from "next/server";

import { contentDisposition } from "@/platform/storage";
import { documents } from "@/records";

import { handle, json } from "../respond";

/**
 * Every document of a record (`?schema=&table=&id=`) or a project (`?project=`) the person may
 * see, as one ZIP (REQ-DOC-007). Written to the audit log before the first byte is sent.
 */
export function GET(request: NextRequest) {
  return handle(async () => {
    const q = request.nextUrl.searchParams;
    const project = q.get("project");
    const scope = project
      ? { projectId: project }
      : {
          record: {
            schema: q.get("schema") ?? "",
            table: q.get("table") ?? "",
            id: q.get("id") ?? "",
          },
        };
    const { count, zip } = await documents().bulkDownload(scope);
    if (count === 0) return json({ error: "İndirilecek belge yok." }, 404);
    const day = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul" }).format(
      new Date(),
    );
    return new Response(zip, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": contentDisposition(`Belgeler ${day}.zip`),
        "Cache-Control": "no-store",
      },
    });
  });
}
