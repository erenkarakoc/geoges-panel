import { describe, expect, it } from "vitest";

import { createMemoryStorage } from "./memory";
import { contentDisposition } from "./storage";

describe("Turkish file names in downloads (RFC 5987, SPIKE-09 rule 3)", () => {
  it("keeps the exact UTF-8 name and gives old clients an ASCII fallback", () => {
    expect(contentDisposition("Hakediş Ekim (İmzalı).pdf")).toBe(
      "attachment; filename=\"Hakedis Ekim (Imzali).pdf\"; filename*=UTF-8''Hakedi%C5%9F%20Ekim%20%28%C4%B0mzal%C4%B1%29.pdf",
    );
  });

  it("shows a preview inline and never breaks the header with quotes", () => {
    expect(contentDisposition('şantiye "A".jpg', true)).toMatch(
      /^inline; filename="santiye _A_\.jpg"/,
    );
  });
});

describe("in-memory storage", () => {
  it("assembles a multipart upload in part order", async () => {
    const storage = createMemoryStorage();
    const id = await storage.createMultipart("k", "application/pdf");
    await storage.uploadPart("k", id, 2, new Uint8Array([3, 4]));
    await storage.uploadPart("k", id, 1, new Uint8Array([1, 2]));
    await storage.completeMultipart("k", id, [
      { partNumber: 2, etag: "b" },
      { partNumber: 1, etag: "a" },
    ]);
    expect([...(await storage.getObject("k"))]).toEqual([1, 2, 3, 4]);
    expect(await storage.headObject("k")).toEqual({ size: 4, contentType: "application/pdf" });
  });
});
