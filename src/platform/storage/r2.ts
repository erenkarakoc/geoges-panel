import "server-only";

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { contentDisposition, DEFAULT_LINK_SECONDS, type StorageProvider } from "./storage";

/**
 * Cloudflare R2 adapter (ADR-003, SPIKE-09) over the S3 API. Keys come only from server-side
 * `R2_` variables and never reach the browser; signed links are made per request and are not
 * logged. The bucket is not public: every read goes through a link the application signed after
 * its own permission check.
 */
export function readR2Config(env: Record<string, string | undefined> = process.env) {
  const need = ["R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"];
  const missing = need.filter((k) => !env[k]);
  if (missing.length) throw new Error(`R2 is not configured: ${missing.join(", ")} missing`);
  return {
    endpoint: env.R2_ENDPOINT as string,
    accessKeyId: env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY as string,
    bucket: env.R2_BUCKET_NAME as string,
  };
}

export function createR2Storage(config = readR2Config()): StorageProvider {
  const client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  const Bucket = config.bucket;

  return {
    async putObject(key, body, contentType) {
      await client.send(
        new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }),
      );
    },
    async headObject(key) {
      try {
        const head = await client.send(new HeadObjectCommand({ Bucket, Key: key }));
        return { size: Number(head.ContentLength ?? 0), contentType: head.ContentType ?? null };
      } catch (error) {
        if ((error as { name?: string }).name === "NotFound") return null;
        throw error;
      }
    },
    async getObject(key) {
      const object = await client.send(new GetObjectCommand({ Bucket, Key: key }));
      if (!object.Body) throw new Error(`empty object ${key}`);
      return object.Body.transformToByteArray();
    },
    async getObjectStream(key) {
      const object = await client.send(new GetObjectCommand({ Bucket, Key: key }));
      if (!object.Body) throw new Error(`empty object ${key}`);
      return object.Body.transformToWebStream() as ReadableStream<Uint8Array>;
    },
    async signedGetUrl(key, options) {
      return getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket,
          Key: key,
          ResponseContentDisposition: contentDisposition(options.fileName, options.inline),
          ResponseContentType: options.contentType,
        }),
        { expiresIn: options.expiresSeconds ?? DEFAULT_LINK_SECONDS },
      );
    },
    async createMultipart(key, contentType) {
      const created = await client.send(
        new CreateMultipartUploadCommand({ Bucket, Key: key, ContentType: contentType }),
      );
      if (!created.UploadId) throw new Error("R2 returned no upload id");
      return created.UploadId;
    },
    async uploadPart(key, uploadId, partNumber, body) {
      const part = await client.send(
        new UploadPartCommand({
          Bucket,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: body,
        }),
      );
      if (!part.ETag) throw new Error("R2 returned no part tag");
      return part.ETag;
    },
    async completeMultipart(key, uploadId, parts) {
      await client.send(
        new CompleteMultipartUploadCommand({
          Bucket,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: [...parts]
              .sort((a, b) => a.partNumber - b.partNumber)
              .map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })),
          },
        }),
      );
    },
    async abortMultipart(key, uploadId) {
      await client.send(new AbortMultipartUploadCommand({ Bucket, Key: key, UploadId: uploadId }));
    },
    async deleteObject(key) {
      await client.send(new DeleteObjectCommand({ Bucket, Key: key }));
    },
  };
}
