import "server-only";

import { createMemoryStorage } from "./memory";
import { createR2Storage } from "./r2";
import type { StorageProvider } from "./storage";

export {
  contentDisposition,
  DEFAULT_LINK_SECONDS,
  type SignedGetOptions,
  type StorageProvider,
  type UploadedPart,
} from "./storage";

let chosen: StorageProvider | null = null;

/**
 * The storage adapter of this process (ADR-003): R2 when the server holds `R2_` settings. A
 * development machine without them keeps files in memory until the server stops; production
 * refuses to start document work without R2.
 */
export function storageProvider(env: Record<string, string | undefined> = process.env) {
  if (!chosen) {
    if (env.R2_ENDPOINT) chosen = createR2Storage();
    else if (env.NODE_ENV === "production") throw new Error("R2 is not configured");
    else chosen = createMemoryStorage();
  }
  return chosen;
}

/**
 * The same adapter, chosen at the first call instead of at import, so that code wired at start
 * (the worker's registry) does not fail before any document work is asked for.
 */
export const processStorage: StorageProvider = {
  putObject: (...a) => storageProvider().putObject(...a),
  headObject: (...a) => storageProvider().headObject(...a),
  getObject: (...a) => storageProvider().getObject(...a),
  getObjectStream: (...a) => storageProvider().getObjectStream(...a),
  signedGetUrl: (...a) => storageProvider().signedGetUrl(...a),
  createMultipart: (...a) => storageProvider().createMultipart(...a),
  uploadPart: (...a) => storageProvider().uploadPart(...a),
  completeMultipart: (...a) => storageProvider().completeMultipart(...a),
  abortMultipart: (...a) => storageProvider().abortMultipart(...a),
  deleteObject: (...a) => storageProvider().deleteObject(...a),
};
