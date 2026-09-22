import "server-only";

import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

/**
 * `TextReader` port (TASK-0107 step 3, SPIKE-16, D-262): the text of a scan, a photo or a PDF,
 * read on this server. Tesseract (tesseract.js with the Turkish and English `best_int` models
 * from npm, integrity-checked by the lockfile) recognises images in two passes: automatic
 * layout and sparse text, the second catching table rows the first skips. A PDF gives its text
 * layer, joined by position; a page without one is drawn and recognised. Nothing leaves the
 * machine.
 */
export type RecognisedText = {
  /** Raw text of each pass or page, in order. */
  passes: string[];
  /** Mean confidence (0-100) of the recognised pages; null when only a text layer was read. */
  confidence: number | null;
  method: "ocr" | "pdf_text";
  pages: number;
  /** Pages read; fewer than `pages` when a scanned PDF is longer than the limit. */
  pagesRead: number;
};

export interface TextReader {
  read(bytes: Uint8Array, mimeType: string): Promise<RecognisedText>;
  close(): Promise<void>;
}

/** A page with fewer characters than this in its text layer is treated as a scan. */
const MIN_LAYER_CHARS = 20;
/** Scale at which a scanned PDF page is drawn before recognition (~150 dpi). */
const RENDER_SCALE = 2;

type TesseractWorker = {
  setParameters(params: Record<string, string>): Promise<unknown>;
  recognize(image: Uint8Array | Buffer): Promise<{ data: { text: string; confidence: number } }>;
  terminate(): Promise<unknown>;
};

const require = createRequire(import.meta.url);

/** Tesseract wants every model in one folder; the npm packages keep one each. */
function modelFolder() {
  const folder = join(tmpdir(), "geoges-ocr", "4.0.0_best_int");
  mkdirSync(folder, { recursive: true });
  for (const lang of ["tur", "eng"]) {
    const target = join(folder, `${lang}.traineddata.gz`);
    if (existsSync(target)) continue;
    const pkg = dirname(require.resolve(`@tesseract.js-data/${lang}/package.json`));
    copyFileSync(join(pkg, "4.0.0_best_int", `${lang}.traineddata.gz`), target);
  }
  return folder;
}

type TextItem = { str: string; transform: number[]; hasEOL?: boolean };

/** Joins a page's text items by position: top to bottom, then left to right (SPIKE-10). */
export function joinByPosition(items: readonly TextItem[]): string {
  const lines: { y: number; parts: { x: number; str: string }[] }[] = [];
  for (const item of items) {
    if (!item.str.trim()) continue;
    const x = item.transform[4];
    const y = item.transform[5];
    const height = Math.abs(item.transform[3]) || 1;
    let line = lines.find((l) => Math.abs(l.y - y) < height / 2);
    if (!line) lines.push((line = { y, parts: [] }));
    line.parts.push({ x, str: item.str });
  }
  return lines
    .sort((a, b) => b.y - a.y)
    .map((l) =>
      l.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .join("\n");
}

export function createTesseractReader({ maxPdfPages = 30 } = {}): TextReader {
  let worker: Promise<TesseractWorker> | null = null;
  // One recognition at a time: the worker is single-threaded and shared.
  let queue: Promise<unknown> = Promise.resolve();

  function tesseract() {
    worker ??= (async () => {
      const { createWorker } = await import("tesseract.js");
      return (await createWorker(["tur", "eng"], 1, {
        langPath: modelFolder(),
        cacheMethod: "none",
        gzip: true,
      })) as unknown as TesseractWorker;
    })();
    return worker;
  }

  async function recognise(image: Uint8Array) {
    const w = await tesseract();
    const buffer = Buffer.from(image);
    await w.setParameters({ tessedit_pageseg_mode: "3" });
    const auto = (await w.recognize(buffer)).data;
    await w.setParameters({ tessedit_pageseg_mode: "11" });
    const sparse = (await w.recognize(buffer)).data;
    return { passes: [auto.text, sparse.text], confidence: auto.confidence };
  }

  async function readPdf(bytes: Uint8Array): Promise<RecognisedText> {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loading = pdfjs.getDocument({
      data: new Uint8Array(bytes),
      disableFontFace: true,
      useSystemFonts: false,
      standardFontDataUrl:
        join(dirname(require.resolve("pdfjs-dist/package.json")), "standard_fonts") + "/",
    });
    const pdf = await loading.promise;
    try {
      const passes: string[] = [];
      const confidences: number[] = [];
      let scanned = 0;
      let pagesRead = 0;
      for (let n = 1; n <= pdf.numPages; n += 1) {
        const page = await pdf.getPage(n);
        const layer = joinByPosition(
          (await page.getTextContent()).items.flatMap((i) => ("str" in i ? [i as TextItem] : [])),
        );
        if (layer.replace(/\s/g, "").length >= MIN_LAYER_CHARS) {
          passes.push(layer);
          pagesRead += 1;
          continue;
        }
        if (scanned >= maxPdfPages) continue;
        scanned += 1;
        const viewport = page.getViewport({ scale: RENDER_SCALE });
        const { createCanvas } = await import("@napi-rs/canvas");
        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        await page.render({
          canvas: canvas as unknown as HTMLCanvasElement,
          viewport,
        }).promise;
        const recognised = await recognise(canvas.toBuffer("image/png"));
        passes.push(...recognised.passes);
        confidences.push(recognised.confidence);
        pagesRead += 1;
      }
      return {
        passes,
        confidence: confidences.length
          ? confidences.reduce((a, b) => a + b, 0) / confidences.length
          : null,
        method: confidences.length ? "ocr" : "pdf_text",
        pages: pdf.numPages,
        pagesRead,
      };
    } finally {
      await loading.destroy();
    }
  }

  return {
    read(bytes, mimeType) {
      const run = queue.then(async (): Promise<RecognisedText> => {
        if (mimeType === "application/pdf") return readPdf(bytes);
        const recognised = await recognise(bytes);
        return { ...recognised, method: "ocr", pages: 1, pagesRead: 1 };
      });
      queue = run.catch(() => {});
      return run;
    },
    async close() {
      if (worker) await (await worker).terminate();
      worker = null;
    },
  };
}
