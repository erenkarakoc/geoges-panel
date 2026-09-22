import { describe, expect, it } from "vitest";

import { checkFile, checkPart, PART_BYTES, tidyRecognisedText, zipEntryNames } from "./documents";

describe("names in a bulk download (REQ-DOC-007)", () => {
  it("keeps Turkish names, strips folders and numbers repeats", () => {
    expect(
      zipEntryNames(["Hakediş.pdf", "hakediş.pdf", "../../etc/passwd", "Hakediş.pdf", ".env", ""]),
    ).toEqual([
      "Hakediş.pdf",
      "hakediş (2).pdf",
      "__.._etc_passwd",
      "Hakediş (3).pdf",
      "_env",
      "belge",
    ]);
  });
});

describe("accepted files (REQ-DOC-001)", () => {
  it("takes allowed types up to 200 MB and refuses the rest with a Turkish reason", () => {
    expect(checkFile({ name: "hakediş.pdf", type: "application/pdf", size: 1000 })).toEqual({
      ok: true,
    });
    expect(checkFile({ name: "x.exe", type: "application/x-msdownload", size: 10 })).toMatchObject({
      ok: false,
      reason: "Bu dosya türü panele yüklenemez.",
    });
    expect(
      checkFile({ name: "big.pdf", type: "application/pdf", size: 201 * 1024 * 1024 }),
    ).toMatchObject({ ok: false });
    expect(checkFile({ name: "empty.pdf", type: "application/pdf", size: 0 })).toMatchObject({
      ok: false,
    });
  });
});

describe("resumable parts (SPIKE-15)", () => {
  const upload = {
    sizeBytes: PART_BYTES * 2 + 100,
    partSize: PART_BYTES,
    receivedBytes: PART_BYTES,
  };

  it("accepts the part that starts where the server stopped, numbering from one", () => {
    expect(checkPart(upload, PART_BYTES, PART_BYTES)).toEqual({
      ok: true,
      partNumber: 2,
      last: false,
    });
    expect(checkPart({ ...upload, receivedBytes: PART_BYTES * 2 }, PART_BYTES * 2, 100)).toEqual({
      ok: true,
      partNumber: 3,
      last: true,
    });
  });

  it("answers 409 with the right offset when the client is out of step", () => {
    expect(checkPart(upload, 0, PART_BYTES)).toEqual({
      ok: false,
      status: 409,
      receivedBytes: PART_BYTES,
    });
  });

  it("refuses a part of the wrong length", () => {
    expect(checkPart(upload, PART_BYTES, 10)).toMatchObject({ ok: false, status: 400 });
  });
});

describe("recognised text (SPIKE-16)", () => {
  it("joins both passes and tidies punctuation between digits", () => {
    expect(tidyRecognisedText(["Net: 12 . 450 kg", "Plaka 34 ABC 12 / 3"])).toBe(
      "Net: 12.450 kg\nPlaka 34 ABC 12/3",
    );
  });
});
