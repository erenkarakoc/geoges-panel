/**
 * The R2 adapter against the real bucket (TASK-0107, SPIKE-09), only where `R2_` settings exist
 * (skipped in CI, which holds no keys). It writes one synthetic object under `tests/`, reads it
 * through a signed link, checks that an expired link is refused, and deletes the object again.
 * Links are never printed. `npm run test:db`.
 */
import { afterAll, describe, expect, it } from "vitest";

import { readEnvFile } from "../../../scripts/db-admin.mjs";

import { createR2Storage, readR2Config } from "./r2";

const env: Record<string, string | undefined> = { ...readEnvFile(), ...process.env };
const configured = Boolean(env.R2_ENDPOINT && env.R2_ACCESS_KEY_ID);
const key = `tests/r2-adapter-${Date.now()}.txt`;
const storage = configured ? createR2Storage(readR2Config(env)) : null;

afterAll(async () => {
  await storage?.deleteObject(key);
});

describe.skipIf(!configured)("R2 adapter (SPIKE-09)", { timeout: 60_000 }, () => {
  it("assembles a multipart upload and serves it through a signed link with a Turkish name", async () => {
    const r2 = storage!;
    const first = new Uint8Array(5 * 1024 * 1024).fill(65);
    const last = new TextEncoder().encode("şantiye günlüğü");
    const uploadId = await r2.createMultipart(key, "text/plain");
    const parts = [
      { partNumber: 1, etag: await r2.uploadPart(key, uploadId, 1, first) },
      { partNumber: 2, etag: await r2.uploadPart(key, uploadId, 2, last) },
    ];
    await r2.completeMultipart(key, uploadId, parts);
    expect(await r2.headObject(key)).toMatchObject({ size: first.length + last.length });

    const link = await r2.signedGetUrl(key, { fileName: "Günlük Ekim.txt", expiresSeconds: 60 });
    const response = await fetch(link);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-disposition")).toContain(
      "filename*=UTF-8''G%C3%BCnl%C3%BCk%20Ekim.txt",
    );
    const body = new Uint8Array(await response.arrayBuffer());
    expect(new TextDecoder().decode(body.subarray(first.length))).toBe("şantiye günlüğü");
  });

  it("refuses an expired link and a changed one", async () => {
    const r2 = storage!;
    const link = await r2.signedGetUrl(key, { fileName: "x.txt", expiresSeconds: 1 });
    await new Promise((resolve) => setTimeout(resolve, 2_500));
    expect((await fetch(link)).status).toBe(403);
    const fresh = await r2.signedGetUrl(key, { fileName: "x.txt", expiresSeconds: 60 });
    expect((await fetch(fresh.replace("x.txt", "y.txt"))).status).toBe(403);
  });
});
