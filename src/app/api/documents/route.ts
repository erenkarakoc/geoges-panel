import type { NextRequest } from "next/server";

import { documents } from "@/records";

import { fileInfo, handle, json, readBody, text } from "./respond";

/** A record's documents the person may see: `?schema=&table=&id=` (`&archived=1` adds archived). */
export function GET(request: NextRequest) {
  return handle(async () => {
    const q = request.nextUrl.searchParams;
    const list = await documents().listFor(
      { schema: q.get("schema") ?? "", table: q.get("table") ?? "", id: q.get("id") ?? "" },
      { withArchived: q.get("archived") === "1" },
    );
    return json({ documents: list });
  });
}

/** Starts a new document on a record with its first file; answers the upload to send parts to. */
export function POST(request: Request) {
  return handle(async () => {
    const body = await readBody(request);
    const record = (body.record ?? {}) as Record<string, unknown>;
    const started = await documents().startDocument({
      record: { schema: text(record.schema), table: text(record.table), id: text(record.id) },
      typeCode: text(body.typeCode),
      title: text(body.title),
      description: text(body.description) || null,
      file: fileInfo(body.file),
      isSigned: body.isSigned === true,
    });
    return json(started, 201);
  });
}
