import { sql } from "kysely";
import type { SystemDb } from "@/platform/jobs/types";

/** bigint counts stay strings; an operational check never logs record text or identities. */
export type SearchIntegrity = {
  search_rows: string;
  row_mismatches: string;
  posting_mismatches: string;
  bucket_mismatches: string;
  vocabulary_mismatches: string;
};

export async function assertSearchIntegrity(db: SystemDb) {
  const result = await sql<SearchIntegrity>`select * from core.search_integrity()`.execute(db);
  const report = result.rows[0];
  if (
    !report ||
    [
      report.row_mismatches,
      report.posting_mismatches,
      report.bucket_mismatches,
      report.vocabulary_mismatches,
    ].some((count) => BigInt(count) !== BigInt(0))
  ) {
    throw new Error("Search helpers differ from indexed source rows");
  }
  return report;
}
