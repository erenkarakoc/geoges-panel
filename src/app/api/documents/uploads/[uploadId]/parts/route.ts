import type { NextRequest } from "next/server";

import { PART_BYTES } from "@/modules/doc";
import { documents } from "@/records";

import { handle, json } from "../../../respond";

/**
 * One part of a resumable upload (SPIKE-15): `PUT ?offset=<bytes>` with the raw bytes. The
 * server owns the offset; a part from elsewhere gets 409 and the offset to continue from.
 */
export function PUT(
  request: NextRequest,
  ctx: RouteContext<"/api/documents/uploads/[uploadId]/parts">,
) {
  return handle(async () => {
    const { uploadId } = await ctx.params;
    const raw = request.nextUrl.searchParams.get("offset");
    const offset = raw === null || raw === "" ? NaN : Number(raw);
    if (!Number.isSafeInteger(offset) || offset < 0) {
      return json({ error: "Parçanın konumu yok." }, 400);
    }
    const declared = Number(request.headers.get("content-length"));
    if (declared > PART_BYTES) return json({ error: "Parça çok büyük." }, 413);
    const body = new Uint8Array(await request.arrayBuffer());
    if (body.byteLength > PART_BYTES) return json({ error: "Parça çok büyük." }, 413);
    const result = await documents().putPart(uploadId, offset, body);
    return json({ receivedBytes: result.receivedBytes }, result.ok ? 200 : 409);
  });
}
