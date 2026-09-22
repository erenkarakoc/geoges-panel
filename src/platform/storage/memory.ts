import { contentDisposition, type StorageProvider } from "./storage";

/**
 * In-memory `StorageProvider` for tests (and CI, which holds no R2 keys). Signed links are fake
 * `memory://` addresses that carry the key and the disposition, so tests can check both.
 */
export function createMemoryStorage(): StorageProvider & { objects: Map<string, Uint8Array> } {
  const objects = new Map<string, Uint8Array>();
  const types = new Map<string, string>();
  const uploads = new Map<string, { key: string; parts: Map<number, Uint8Array> }>();
  let counter = 0;

  return {
    objects,
    async putObject(key, body, contentType) {
      objects.set(key, body);
      types.set(key, contentType);
    },
    async headObject(key) {
      const body = objects.get(key);
      return body ? { size: body.byteLength, contentType: types.get(key) ?? null } : null;
    },
    async getObject(key) {
      const body = objects.get(key);
      if (!body) throw new Error(`no object ${key}`);
      return body;
    },
    async getObjectStream(key) {
      const body = objects.get(key);
      if (!body) throw new Error(`no object ${key}`);
      return new Blob([new Uint8Array(body)]).stream();
    },
    async signedGetUrl(key, options) {
      if (!objects.has(key)) throw new Error(`no object ${key}`);
      const disposition = encodeURIComponent(contentDisposition(options.fileName, options.inline));
      return `memory://${key}?disposition=${disposition}&expires=${options.expiresSeconds ?? 300}`;
    },
    async createMultipart(key, contentType) {
      const id = `upload-${++counter}`;
      uploads.set(id, { key, parts: new Map() });
      types.set(key, contentType);
      return id;
    },
    async uploadPart(key, uploadId, partNumber, body) {
      const upload = uploads.get(uploadId);
      if (!upload || upload.key !== key) throw new Error(`no upload ${uploadId}`);
      upload.parts.set(partNumber, body);
      return `"etag-${partNumber}-${body.byteLength}"`;
    },
    async completeMultipart(key, uploadId, parts) {
      const upload = uploads.get(uploadId);
      if (!upload || upload.key !== key) throw new Error(`no upload ${uploadId}`);
      const ordered = [...parts].sort((a, b) => a.partNumber - b.partNumber);
      const chunks = ordered.map((p) => {
        const chunk = upload.parts.get(p.partNumber);
        if (!chunk) throw new Error(`part ${p.partNumber} missing`);
        return chunk;
      });
      const size = chunks.reduce((n, c) => n + c.byteLength, 0);
      const body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
      }
      objects.set(key, body);
      uploads.delete(uploadId);
    },
    async abortMultipart(_key, uploadId) {
      uploads.delete(uploadId);
    },
    async deleteObject(key) {
      objects.delete(key);
      types.delete(key);
    },
  };
}
