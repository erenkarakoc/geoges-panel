import { sql } from "kysely";

import { runAsUser, type DbIdentity, type DbTransaction } from "@/platform/db";

import type {
  CorrectionInput,
  DailyMeasure,
  TargetEndBasis,
} from "@/modules/prj/domain/daily-target";

/**
 * Daily targets in the database (TASK-0123 step 3, migration 0068). The calculation is the
 * database's (`prj.daily_targets`); a correction is an insert the database completes with the
 * calculated value and refuses for a past day, a day off or a line the day does not have.
 */

type Tx = DbTransaction<unknown>;

export type DailyTargetFrame = {
  projectId: string;
  chosenBasis: TargetEndBasis | null;
  basis: TargetEndBasis | null;
  endOn: string | null;
  businessDay: boolean;
  daysLeft: number;
  revisionId: string | null;
};

export type DailyTargetLine = {
  measure: DailyMeasure;
  panelTypeId: string | null;
  stripTypeId: string | null;
  stripLengthM: number | null;
  workItemId: string | null;
  unitAreaM2: number | null;
  remaining: number;
  calculated: number | null;
  corrected: number | null;
  isCorrected: boolean;
  correctionReason: string | null;
  correctedByUserId: string | null;
  correctedAt: Date | null;
};

const num = (value: string | number | null) => (value === null ? null : Number(value));

/** The frame and lines of a site's day; null when the person may not see the site. */
export function readDailyTargets(identity: DbIdentity, siteId: string, on: string) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows: frames } = await sql<{
      project_id: string;
      chosen_basis: TargetEndBasis | null;
      basis: TargetEndBasis | null;
      end_on: string | null;
      business_day: boolean;
      days_left: number;
      revision_id: string | null;
    }>`
      select project_id, chosen_basis, basis, end_on::text, business_day, days_left, revision_id
        from prj.daily_target_frame(${siteId}::uuid, ${on}::date)`.execute(db);
    const frame = frames[0];
    if (!frame) return null;
    const { rows } = await sql<{
      measure: DailyMeasure;
      panel_type_id: string | null;
      strip_type_id: string | null;
      strip_length_m: string | null;
      work_item_id: string | null;
      unit_area_m2: string | null;
      remaining: string;
      calculated: string | null;
      corrected: string | null;
      is_corrected: boolean;
      correction_reason: string | null;
      corrected_by_user_id: string | null;
      corrected_at: Date | null;
    }>`
      select * from prj.daily_targets(${siteId}::uuid, ${on}::date)
       order by array_position(array['panel_cast', 'panel_install', 'strip_install', 'work_item'],
                               measure), strip_length_m`.execute(db);
    return {
      frame: {
        basis: frame.basis,
        businessDay: frame.business_day,
        chosenBasis: frame.chosen_basis,
        daysLeft: frame.days_left,
        endOn: frame.end_on,
        projectId: frame.project_id,
        revisionId: frame.revision_id,
      } satisfies DailyTargetFrame,
      lines: rows.map((row): DailyTargetLine => ({
        calculated: num(row.calculated),
        corrected: num(row.corrected),
        correctedAt: row.corrected_at,
        correctedByUserId: row.corrected_by_user_id,
        correctionReason: row.correction_reason,
        isCorrected: row.is_corrected,
        measure: row.measure,
        panelTypeId: row.panel_type_id,
        remaining: Number(row.remaining),
        stripLengthM: num(row.strip_length_m),
        stripTypeId: row.strip_type_id,
        unitAreaM2: num(row.unit_area_m2),
        workItemId: row.work_item_id,
      })),
    };
  });
}

/** Writes a correction of one line of a day; the database adds the calculated value. */
export function insertCorrection(
  identity: DbIdentity,
  site: { siteId: string; projectId: string },
  on: string,
  input: CorrectionInput,
) {
  return runAsUser(identity, async (db: Tx) => {
    const { rows } = await sql<{ id: string }>`
      insert into prj.daily_target_correction (project_id, site_id, target_on, measure,
                                               panel_type_id, strip_type_id, strip_length_m,
                                               work_item_id, corrected, reason)
      values (${site.projectId}::uuid, ${site.siteId}::uuid, ${on}::date, ${input.measure},
              ${input.panelTypeId}::uuid, ${input.stripTypeId}::uuid, ${input.stripLengthM},
              ${input.workItemId}::uuid, ${input.corrected}, ${input.reason})
      returning id`.execute(db);
    return rows[0]?.id ?? null;
  });
}
