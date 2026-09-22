import { readFileSync } from "node:fs";

import { afterAll, describe, expect, it } from "vitest";

import { createTesseractReader, joinByPosition } from "./text-reader";

/**
 * Local recognition (SPIKE-16). The weighing slip is the spike's synthetic "realistic scan";
 * the PDFs are written here: one with a text layer, one holding only that scan as an image.
 */
const scan = readFileSync(new URL("./fixtures/kantar-fisi-tarama.jpg", import.meta.url));

/** A minimal PDF: one page per entry, either a line of text or a JPEG filling the page. */
function makePdf(pages: ({ text: string } | { jpeg: Buffer; width: number; height: number })[]) {
  const objects: (string | Buffer)[] = [];
  const add = (body: string | Buffer) => objects.push(body) + 2; // 1 and 2: catalog, page tree
  const kids: number[] = [];
  const font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  for (const page of pages) {
    if ("text" in page) {
      const stream = `BT /F1 18 Tf 72 720 Td (${page.text}) Tj ET`;
      const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      kids.push(
        add(
          `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${content} 0 R /Resources << /Font << /F1 ${font} 0 R >> >> >>`,
        ),
      );
    } else {
      const image = add(
        Buffer.concat([
          Buffer.from(
            `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
          ),
          page.jpeg,
          Buffer.from("\nendstream"),
        ]),
      );
      const stream = `q ${page.width} 0 0 ${page.height} 0 0 cm /Im0 Do Q`;
      const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      kids.push(
        add(
          `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Contents ${content} 0 R /Resources << /XObject << /Im0 ${image} 0 R >> >> >>`,
        ),
      );
    }
  }
  const all: (string | Buffer)[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`,
    ...objects,
  ];
  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n")];
  const offsets: number[] = [];
  let length = chunks[0].length;
  all.forEach((body, i) => {
    offsets.push(length);
    const chunk = Buffer.concat([
      Buffer.from(`${i + 1} 0 obj\n`),
      Buffer.isBuffer(body) ? body : Buffer.from(body),
      Buffer.from("\nendobj\n"),
    ]);
    chunks.push(chunk);
    length += chunk.length;
  });
  const xref = [
    `xref\n0 ${all.length + 1}\n0000000000 65535 f \n`,
    ...offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${all.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`,
  ].join("");
  chunks.push(Buffer.from(xref));
  return new Uint8Array(Buffer.concat(chunks));
}

const reader = createTesseractReader({ maxPdfPages: 1 });
afterAll(() => reader.close());

const fold = (s: string) =>
  s.toLocaleLowerCase("tr").normalize("NFKD").replace(/\p{M}/gu, "").replace(/ı/g, "i");

describe("text layer order (SPIKE-10)", () => {
  it("joins items by line from the top, left to right", () => {
    const at = (str: string, x: number, y: number) => ({ str, transform: [10, 0, 0, 10, x, y] });
    expect(joinByPosition([at("dünya", 60, 700), at("Merhaba", 10, 701), at("alt", 10, 600)])).toBe(
      "Merhaba dünya\nalt",
    );
  });
});

describe("local recognition (SPIKE-16)", { timeout: 60_000 }, () => {
  it("reads a realistic weighing-slip scan in two passes", async () => {
    const result = await reader.read(new Uint8Array(scan), "image/jpeg");
    const text = fold(result.passes.join("\n"));
    for (const term of ["KANTAR", "118392", "21.09.2026", "Kırma taş", "GEOGES"]) {
      expect(text).toContain(fold(term));
    }
    expect(result).toMatchObject({ method: "ocr", pages: 1, pagesRead: 1 });
    expect(result.confidence).toBeGreaterThan(50);
  });

  it("takes a PDF's text layer and recognises a scanned page, up to the page limit", async () => {
    const layered = await reader.read(
      makePdf([{ text: "Sozlesme numarasi GEO-2026-0042 teslim tarihi" }]),
      "application/pdf",
    );
    expect(layered).toMatchObject({ method: "pdf_text", confidence: null, pagesRead: 1 });
    expect(layered.passes[0]).toContain("GEO-2026-0042");

    const scanned = await reader.read(
      makePdf([
        { jpeg: scan, width: 500, height: 813 },
        { jpeg: scan, width: 500, height: 813 },
      ]),
      "application/pdf",
    );
    expect(scanned).toMatchObject({ method: "ocr", pages: 2, pagesRead: 1 });
    expect(fold(scanned.passes.join("\n"))).toContain("118392");
  });
});
