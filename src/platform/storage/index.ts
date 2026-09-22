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
