/**
 * The browser side of a resumable upload (TASK-0107 step 2, SPIKE-15, D-262). No component
 * here: the "Belgeler" section and its upload control come with the first detail screen
 * (Phase 09) and drive this logic.
 *
 * A photo is shrunk before it leaves the phone; the file then goes in parts. The server owns
 * the offset: after a 409, a dropped connection or a reload the uploader asks where to continue
 * and never sends a byte twice on purpose. While the device is offline it waits for the
 * connection instead of burning its retries.
 */

export type UploadStart = {
  uploadId: string;
  partSize: number;
  sizeBytes: number;
  receivedBytes: number;
  documentId?: string;
};

/** How the uploader talks to the server; `httpTransport` below, a fake one in tests. */
export interface UploadTransport {
  state(uploadId: string): Promise<{ receivedBytes: number; status: string }>;
  /** 200 with the new offset, or 409 with the server's offset. Throws when the network fails. */
  putPart(
    uploadId: string,
    offset: number,
    part: Blob,
  ): Promise<{ status: 200 | 409; receivedBytes: number }>;
  complete(uploadId: string): Promise<{ versionId: string }>;
}

export class UploadStalledError extends Error {
  constructor(readonly uploadId: string) {
    super("Bağlantı kurulamadı; yükleme kaldığı yerden sürdürülebilir.");
    this.name = "UploadStalledError";
  }
}

/** A refusal the server explained (bad type, no right, closed upload); retrying will not help. */
export class UploadRefusedError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "UploadRefusedError";
  }
}

export type UploadOptions = {
  onProgress?: (receivedBytes: number, sizeBytes: number) => void;
  signal?: AbortSignal;
  /** Waits between failed attempts (ms); the last one repeats until `maxFailures`. */
  retryDelaysMs?: readonly number[];
  /** Failures in a row, while online, before giving up with `UploadStalledError`. */
  maxFailures?: number;
  isOnline?: () => boolean;
  /** Resolves when the device is back online. */
  waitOnline?: (signal?: AbortSignal) => Promise<void>;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
};

const RETRY_DELAYS_MS = [1_000, 3_000, 10_000, 30_000];

function abortError() {
  return new DOMException("Yükleme durduruldu.", "AbortError");
}

function browserSleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => (clearTimeout(timer), reject(abortError())), {
      once: true,
    });
  });
}

function browserWaitOnline(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (typeof navigator === "undefined" || navigator.onLine) return resolve();
    if (signal?.aborted) return reject(abortError());
    window.addEventListener("online", () => resolve(), { once: true, signal });
    signal?.addEventListener("abort", () => reject(abortError()), { once: true });
  });
}

/**
 * Sends `file` into an upload the server has opened (new document or new version), starting
 * wherever the server says, and completes it. Call again with the same `start.uploadId` after
 * `UploadStalledError` or a reload to continue.
 */
export async function sendFile(
  file: Blob,
  start: UploadStart,
  transport: UploadTransport,
  options: UploadOptions = {},
): Promise<{ versionId: string }> {
  const {
    onProgress,
    signal,
    retryDelaysMs = RETRY_DELAYS_MS,
    maxFailures = 8,
    isOnline = () => typeof navigator === "undefined" || navigator.onLine,
    waitOnline = browserWaitOnline,
    sleep = browserSleep,
  } = options;
  const { uploadId, partSize, sizeBytes } = start;
  if (file.size !== sizeBytes) throw new Error("the file is not the one the upload was opened for");

  let offset = start.receivedBytes;
  let failures = 0;

  /** After any failure: wait (for the network, then a moment) and ask the server where it is. */
  async function recover() {
    if (!isOnline()) {
      await waitOnline(signal);
    } else {
      failures += 1;
      if (failures >= maxFailures) throw new UploadStalledError(uploadId);
      await sleep(retryDelaysMs[Math.min(failures - 1, retryDelaysMs.length - 1)], signal);
    }
    try {
      offset = (await transport.state(uploadId)).receivedBytes;
    } catch (error) {
      if (error instanceof UploadRefusedError) throw error;
      // Still unreachable: the next attempt fails and brings us back here.
    }
  }

  onProgress?.(offset, sizeBytes);
  while (offset < sizeBytes) {
    if (signal?.aborted) throw abortError();
    const part = file.slice(offset, Math.min(offset + partSize, sizeBytes));
    try {
      const answer = await transport.putPart(uploadId, offset, part);
      offset = answer.receivedBytes;
      if (answer.status === 200) failures = 0;
      onProgress?.(offset, sizeBytes);
    } catch (error) {
      if (error instanceof UploadRefusedError) throw error;
      if ((error as { name?: string }).name === "AbortError") throw error;
      await recover();
    }
  }

  for (;;) {
    try {
      return await transport.complete(uploadId);
    } catch (error) {
      if (error instanceof UploadRefusedError) throw error;
      if ((error as { name?: string }).name === "AbortError") throw error;
      await recover();
    }
  }
}

/** Types the browser can redraw; HEIC and PDFs go as they are. */
const SHRINKABLE = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Shrinks a photo so its longer side is at most `maxEdge` pixels (SPIKE-15: 5.86 MB → 238 KB)
 * and keeps the camera's orientation. Anything else, or a picture already small enough, is
 * returned unchanged.
 */
export async function shrinkPhoto(file: File, maxEdge = 1600, quality = 0.85): Promise<File> {
  if (!SHRINKABLE.has(file.type) || typeof createImageBitmap === "undefined") return file;
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = maxEdge / Math.max(bitmap.width, bitmap.height);
    if (scale >= 1) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
  } finally {
    bitmap.close();
  }
}

async function answer<T>(response: Response): Promise<T> {
  if (response.ok || response.status === 409) return (await response.json()) as T;
  if (response.status >= 500 || response.status === 429) {
    throw new Error(`server answered ${response.status}`);
  }
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  throw new UploadRefusedError(response.status, body.error ?? "Yükleme reddedildi.");
}

/** The panel's `/api/documents` routes. */
export function httpTransport(base = "/api/documents"): UploadTransport & {
  startDocument(input: {
    record: { schema: string; table: string; id: string };
    typeCode: string;
    title: string;
    description?: string;
    file: File;
    isSigned?: boolean;
  }): Promise<UploadStart>;
  startVersion(documentId: string, file: File, isSigned?: boolean): Promise<UploadStart>;
} {
  const post = (url: string, body: unknown) =>
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  const describe = (file: File) => ({ name: file.name, type: file.type, size: file.size });
  return {
    async startDocument({ file, ...rest }) {
      return answer(await post(base, { ...rest, file: describe(file) }));
    },
    async startVersion(documentId, file, isSigned = false) {
      return answer(
        await post(`${base}/${documentId}/versions`, { file: describe(file), isSigned }),
      );
    },
    async state(uploadId) {
      return answer(await fetch(`${base}/uploads/${uploadId}`, { cache: "no-store" }));
    },
    async putPart(uploadId, offset, part) {
      const response = await fetch(`${base}/uploads/${uploadId}/parts?offset=${offset}`, {
        method: "PUT",
        headers: { "content-type": "application/octet-stream" },
        body: part,
      });
      const { receivedBytes } = await answer<{ receivedBytes: number }>(response);
      return { status: response.status === 409 ? 409 : 200, receivedBytes };
    },
    async complete(uploadId) {
      return answer(await post(`${base}/uploads/${uploadId}/complete`, {}));
    },
  };
}
