/**
 * What a dry run's step did, said the way a person would say it (TASK-0119, SCR-196).
 *
 * The engine keeps its own short words — `sent`, `held`, `too_many` — because they go into the run
 * log and into evidence that has to stay comparable. A screen never shows them: this turns each one
 * into a Turkish sentence, and the fallback is a sentence as well, so an outcome added to the engine
 * tomorrow cannot leak a code onto a screen today.
 */

export type ReportStep = {
  stepId: string;
  type: string;
  outcome: string;
  status?: "done" | "failed" | "waiting";
  /** What the outcome is about: another flow, a record type, a list, a transition. */
  about?: string;
  /** When the step would act, for a wait or an escalation. */
  at?: string | number | Date | null;
  owner?: string | null;
};

const PLAIN: Record<string, string> = {
  branches: "dalları başlattı",
  empty: "liste boş olduğu için bir şey yapmadı",
  end: "akışı bitirdi",
  false: "koşul sağlanmadı",
  held: "geçişi kilitledi",
  items: "listedeki her öğe için dal açtı",
  joined: "dalların bitmesini bekledi ve devam etti",
  list_failed: "listeyi okuyamadı",
  next: "tamamlandı",
  no_branch: "tek bir dal açamadı",
  no_list: "listesi bağlı olmadığı için durdu",
  no_owner: "kime düşeceği bulunamadı",
  no_record: "üzerinde çalışacağı kayıt yok",
  no_subflow: "çalıştıracağı akış yayımlanmamış",
  raised: "üste haber verdi",
  refused: "ilgili modül bu işi kabul etmedi",
  sent: "bildirimi gönderdi",
  timeout: "koşul sorgusu süreyi aştı",
  too_many: "liste izin verilenden uzun",
  true: "koşul sağlandı",
  unknown: "bu adımı motor henüz yürütmüyor",
  waiting: "bekliyor",
  would_create: "taslak kayıt oluşturur",
  would_escalate: "üste haber verir",
  would_hold: "geçişi kilitler",
  would_set_status: "kaydın durumunu değiştirir",
  would_subflow: "başka bir akışa devreder",
  would_wait: "bekler",
};

const clock = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });

/**
 * One row of the report as a sentence. `names` gives an action's, a flow's or a record type's own
 * Turkish name where the catalog has one; anything it does not know is simply left out rather than
 * shown as a code.
 */
export function reportStepText(step: ReportStep, names?: ReadonlyMap<string, string>): string {
  const base = PLAIN[step.outcome];
  const named = step.about ? names?.get(step.about) : null;

  const parts: string[] = [];
  parts.push(
    base ??
      (step.status === "failed"
        ? "akışı durdurdu"
        : step.status === "waiting"
          ? "bekliyor"
          : "tamamlandı"),
  );
  if (named) parts.push(`(${named})`);
  if (step.at) parts.push(`· ${clock.format(new Date(step.at))}`);
  return parts.join(" ");
}

/** Where the whole run ended up. */
export function reportEndText(ends: string | null): string | null {
  if (ends === "done") return "Akış sonuna kadar yürüdü.";
  if (ends === "waiting") return "Akış bir kişiyi ya da bir süreyi beklemeye geçti.";
  if (ends === "failed") return "Akış tamamlanamadı.";
  return null;
}
