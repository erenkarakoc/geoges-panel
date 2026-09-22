/**
 * Documents' rules that need no database (TASK-0107, REQ-DOC, D-262, SPIKE-15).
 */

/** The record a document belongs to (REQ-DOC-001). */
export type RecordRef = { schema: string; table: string; id: string };

/**
 * What the owning module says about its record: read as the signed-in person, so a record they
 * cannot see yields nothing. The document copies these facts and never changes them (DOC-K2).
 */
export type RecordFacts = {
  module: string;
  siteId: string | null;
  projectId: string | null;
  ownerUserId: string | null;
  dataClass: "general" | "internal" | "commercial" | "sensitive";
};

/** Files the panel accepts (REQ-DOC-001); anything else is refused on the server. */
export const ALLOWED_TYPES: Readonly<Record<string, string>> = {
  "application/pdf": "PDF",
  "image/jpeg": "JPEG görsel",
  "image/png": "PNG görsel",
  "image/webp": "WebP görsel",
  "image/heic": "HEIC görsel",
  "application/msword": "Word belgesi",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word belgesi",
  "application/vnd.ms-excel": "Excel tablosu",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel tablosu",
  "text/plain": "Metin",
};

/** Largest single file (bytes). */
export const MAX_FILE_BYTES = 200 * 1024 * 1024;
/** Part size of a resumable upload; R2 needs at least 5 MB for every part but the last. */
export const PART_BYTES = 5 * 1024 * 1024;
/** Types shown in the browser without downloading (REQ-DOC-008). */
export const PREVIEWABLE = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);

export type FileCheck = { ok: true } | { ok: false; reason: string };

export function checkFile(file: { name: string; type: string; size: number }): FileCheck {
  if (!file.name.trim()) return { ok: false, reason: "Dosyanın adı yok." };
  if (!(file.type in ALLOWED_TYPES)) {
    return { ok: false, reason: "Bu dosya türü panele yüklenemez." };
  }
  if (file.size <= 0) return { ok: false, reason: "Dosya boş." };
  if (file.size > MAX_FILE_BYTES) return { ok: false, reason: "Dosya 200 MB'tan büyük." };
  return { ok: true };
}

/** Where a part must start and how long it must be (SPIKE-15: the server owns the offset). */
export type PartCheck =
  | { ok: true; partNumber: number; last: boolean }
  | { ok: false; status: 409; receivedBytes: number }
  | { ok: false; status: 400; reason: string };

export function checkPart(
  upload: { sizeBytes: number; partSize: number; receivedBytes: number },
  offset: number,
  length: number,
): PartCheck {
  if (offset !== upload.receivedBytes) {
    return { ok: false, status: 409, receivedBytes: upload.receivedBytes };
  }
  const remaining = upload.sizeBytes - offset;
  const expected = Math.min(upload.partSize, remaining);
  if (length !== expected) {
    return { ok: false, status: 400, reason: `part must be ${expected} bytes` };
  }
  return {
    ok: true,
    partNumber: Math.floor(offset / upload.partSize) + 1,
    last: offset + length === upload.sizeBytes,
  };
}

/** Recognised text after the two passes (SPIKE-16): joined, digits' punctuation tidied. */
export function tidyRecognisedText(passes: readonly string[]): string {
  return passes
    .join("\n")
    .replace(/(\d)\s*([.,:/-])\s*(\d)/g, "$1$2$3")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Below this mean confidence a scan is flagged "kalite düşük, yeniden tarayın" (SPIKE-16). */
export const LOW_CONFIDENCE = 80;

export const DOC_RULE_MESSAGES: Readonly<Record<string, string>> = {
  "doc.no_delete": "Belge silinmez; gerekçeyle arşivleyin.",
  "doc.record_fixed": "Belge bağlı olduğu kayıttan ve kapsamından ayrılamaz.",
  "doc.version_fixed": "Belge sürümü değiştirilemez; yeni sürüm yükleyin.",
  "doc.health_report_forbidden": "Sağlık raporu belge olarak tutulmaz.",
  "doc.upload_incomplete": "Yükleme tamamlanmadı.",
};
