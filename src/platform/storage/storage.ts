/**
 * `StorageProvider` port (PORTS_AND_SERVICES section 1, ADR-003, D-262). Modules know only this
 * interface; Cloudflare R2 is one adapter behind it (`r2.ts`), an in-memory one serves tests
 * (`memory.ts`). Access to a file is always decided by the application before a link is signed
 * (SPIKE-09 rule 1); links are short-lived and never written to any log (rule 5).
 */

export type SignedGetOptions = {
  /** The name the browser saves or shows, Turkish letters included (RFC 5987, rule 3). */
  fileName: string;
  /** Show in the browser (preview, REQ-DOC-008) instead of downloading. */
  inline?: boolean;
  contentType?: string;
  /** Short by default: a link is made for one request (rule 2). */
  expiresSeconds?: number;
};

export type UploadedPart = { partNumber: number; etag: string };

export interface StorageProvider {
  putObject(key: string, body: Uint8Array, contentType: string): Promise<void>;
  /** Size and type of a stored object, or null when there is none. */
  headObject(key: string): Promise<{ size: number; contentType: string | null } | null>;
  getObject(key: string): Promise<Uint8Array>;
  signedGetUrl(key: string, options: SignedGetOptions): Promise<string>;
  createMultipart(key: string, contentType: string): Promise<string>;
  uploadPart(key: string, uploadId: string, partNumber: number, body: Uint8Array): Promise<string>;
  completeMultipart(key: string, uploadId: string, parts: readonly UploadedPart[]): Promise<void>;
  abortMultipart(key: string, uploadId: string): Promise<void>;
  /** Only for removing sample data's files after a reset; the panel never deletes a document. */
  deleteObject(key: string): Promise<void>;
}

export const DEFAULT_LINK_SECONDS = 300;

/**
 * `Content-Disposition` for a Turkish file name (RFC 6266 / RFC 5987): an ASCII fallback for old
 * clients and the exact UTF-8 name for the rest ("Hakediş Ekim.pdf" stays "Hakediş Ekim.pdf").
 */
export function contentDisposition(fileName: string, inline = false): string {
  const fallback = fileName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/[^\x20-\x7e]/g, "_")
    .replace(/["\\]/g, "_");
  const encoded = encodeURIComponent(fileName).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${inline ? "inline" : "attachment"}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
