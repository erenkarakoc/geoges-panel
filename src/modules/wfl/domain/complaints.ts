import { definitionSchema } from "@/modules/wfl/domain/definition";
import { stepNames, type DrawableStep } from "@/modules/wfl/domain/graph";

/**
 * What is missing from a flow, said the way a person would say it (TASK-0119, SCR-196).
 *
 * The rules themselves stay in one place — `definitionSchema` decides what a valid definition is
 * (D-283) — but a schema's own words are written for whoever wrote the schema: paths, types and
 * English. This turns each of its findings into a Turkish sentence about the step it belongs to, and
 * its fallback is a sentence too: nothing an editor sees is ever a field path, a step id or an
 * English message.
 */

export type Complaints = {
  /** Sentences about one step, by step id. */
  steps: Map<string, string[]>;
  /** Sentences about the flow as a whole. */
  flow: string[];
};

/** Which field of a step the finding is about, and what to say when it is missing or wrong. */
const STEP_FIELDS: Record<string, string> = {
  after: "Bekleme süresi 30 dakika, 8 saat ya da 2 gün gibi bir süre olmalı.",
  body: "Listedeki her öğe için hangi adımın çalışacağı seçilmedi.",
  flow: "Hangi akışın çalışacağı seçilmedi.",
  limit: "En çok kaç öğe için çalışacağı 1 ile 50 arasında olmalı.",
  list: "Hangi liste için çalışacağı yazılmadı.",
  owner: "Bu adımın kime düşeceği seçilmedi.",
  paths: "Paralel adımda en az iki dal olmalı.",
  priority: "Önceliği seçilmedi.",
  reason: "Kilidin sebebi yazılmadı; engellenen kişi bu cümleyi görecek.",
  recordType: "Hangi kayıt türünün oluşturulacağı yazılmadı.",
  status: "Kaydın hangi duruma taşınacağı yazılmadı.",
  subject: "Ne yazılacağı girilmedi.",
  test: "Neye bakılacağı belirlenmedi.",
  title: "Adımın adı en çok 200 harf olabilir.",
  to: "Kimin haberdar edileceği seçilmedi.",
  transition: "Hangi geçişin kapatılacağı yazılmadı.",
  whenFalse: "Koşul sağlanmazsa nereye gidileceği seçilmedi.",
  whenTrue: "Koşul sağlanırsa nereye gidileceği seçilmedi.",
};

/** The fields inside a field, where the sentence has to be more precise than the parent's. */
const NESTED_FIELDS: Record<string, string> = {
  "escalation.after": "Onay beklerken ne kadar sonra yükseltileceği bir süre olmalı.",
  "escalation.to": "Onay zamanında cevaplanmazsa kime gideceği seçilmedi.",
  "test.countOf": "Geçmişte neyin sayılacağı seçilmedi.",
  "test.field": "Hangi alana bakılacağı seçilmedi.",
  "test.op": "Karşılaştırmanın nasıl yapılacağı seçilmedi.",
  "test.value": "Karşılaştırılacak değer girilmedi.",
  "test.withinDays": "Kaç günlük geçmişe bakılacağı 1 ile 365 arasında olmalı.",
  "outcomes.approve": "Onaylanırsa nereye gidileceği seçilmedi.",
  "outcomes.reject": "Reddedilirse nereye gidileceği seçilmedi.",
  "outcomes.return": "Düzeltmeye dönerse nereye gidileceği seçilmedi.",
};

/** The flow's own settings, outside any step. */
const FLOW_FIELDS: Record<string, string> = {
  start: "Akışın nereden başlayacağı belirlenmedi.",
  steps: "Akışta hiç adım yok.",
  trigger: "Akışın ne olunca başlayacağı belirlenmedi.",
  "trigger.dailyAt": "Günlük saat 09:00 gibi yazılmalı.",
  "trigger.event": "Hangi olayla başlayacağı seçilmedi.",
  "trigger.everyMinutes": "Kaç dakikada bir çalışacağı 5 ile 1440 arasında olmalı.",
  "trigger.test": "Eşiğin neye bakacağı belirlenmedi.",
  "trigger.test.field": "Hangi alanın eşiği aşacağı seçilmedi.",
  "trigger.test.value": "Hangi değerin aşılacağı girilmedi.",
};

/** The schema's own extra checks; their messages carry a step id, which no screen should show. */
function customSentence(message: string, names: Map<string, string>): string {
  const named = (text: string) => {
    const id = text.slice(text.lastIndexOf(":") + 1).trim();
    return names.get(id) ?? null;
  };
  if (message.startsWith("adım kimliği iki kez")) {
    return "Aynı adım iki kez eklenmiş görünüyor; birini kaldırın.";
  }
  if (message.startsWith("başlangıç adımı yok")) {
    return "Akışın başlangıç adımı yok.";
  }
  if (message.startsWith("saat tetikleyicisi")) {
    return "Saatle başlayan akış ya günlük bir saat ya da bir dakika aralığı ister; ikisi birden olmaz.";
  }
  if (message.startsWith("kayıt oluştur adımı tür ister")) {
    const name = named(message);
    return name
      ? `${name} adımında hangi kayıt türünün oluşturulacağı yazılmadı.`
      : "Kayıt oluşturan adımda hangi kayıt türünün oluşturulacağı yazılmadı.";
  }
  if (message.startsWith("durum değiştir adımı durum ister")) {
    const name = named(message);
    return name
      ? `${name} adımında kaydın hangi duruma taşınacağı yazılmadı.`
      : "Durum değiştiren adımda kaydın hangi duruma taşınacağı yazılmadı.";
  }
  if (message.includes("her biri için") && message.includes("iç içe")) {
    return 'Bir "her biri için" adımı başka bir "her biri için" adımının içinde çalışamaz.';
  }
  // Something the schema added that this list does not know yet: still a sentence, never a path.
  return "Bu ayarda eksik ya da hatalı bir şey var.";
}

/** One finding as a sentence: the field's own wording, or a plain fallback. */
function sentenceFor(path: readonly (string | number | symbol)[], isStep: boolean): string {
  const fields = path.filter((part) => typeof part === "string") as string[];
  const dotted = fields.join(".");
  const table = isStep ? { ...STEP_FIELDS, ...NESTED_FIELDS } : FLOW_FIELDS;
  if (table[dotted]) return table[dotted];
  // A finding deeper than the list knows: answer about the field it belongs to.
  const first = fields[0];
  if (first && table[first]) return table[first];
  return isStep ? "Bu adımda cevaplanmamış bir soru var." : "Akışın kendisinde eksik bir ayar var.";
}

/**
 * Reads a draft and says what is missing, per step and for the flow. A draft with nothing wrong
 * gives two empty answers, which is what lets the screen offer the dry run.
 */
export function complaintsOf(draft: unknown): Complaints {
  const found = definitionSchema.safeParse(draft);
  const steps = new Map<string, string[]>();
  const flow: string[] = [];
  if (found.success) return { steps, flow };

  const written = (draft as { steps?: DrawableStep[] })?.steps;
  const names = stepNames(Array.isArray(written) ? written : []);

  const add = (id: string | null, sentence: string) => {
    if (!id) {
      if (!flow.includes(sentence)) flow.push(sentence);
      return;
    }
    const already = steps.get(id) ?? [];
    if (!already.includes(sentence)) steps.set(id, [...already, sentence]);
  };

  // A union's own finding says only "invalid input"; what is actually missing is in the branch that
  // came closest, so that branch's findings are the ones worth a sentence.
  const flattened = found.error.issues.flatMap((issue) => {
    if (issue.code !== "invalid_union") return [issue];
    const branches = (
      issue as { errors?: { path: PropertyKey[]; code: string; message: string }[][] }
    ).errors;
    if (!branches?.length) return [issue];
    const closest = branches.reduce((best, group) => (group.length < best.length ? group : best));
    return closest.map((inner) => ({
      ...inner,
      path: [...issue.path, ...inner.path],
    })) as typeof found.error.issues;
  });

  for (const issue of flattened) {
    const [first, index] = issue.path;
    const inStep = first === "steps" && typeof index === "number";
    const id = inStep ? (written?.[index]?.id ?? null) : null;

    if (issue.code === "custom") {
      add(id, customSentence(issue.message, names));
      continue;
    }
    // Where a step's own finding cannot be tied to a step — the array itself, or a step the draft
    // has not written down — it belongs to the flow.
    if (inStep && !id) {
      add(null, "Bir adım eksik ya da hatalı; şemadaki işaretli kutulara bakın.");
      continue;
    }
    add(id, sentenceFor(inStep ? issue.path.slice(2) : issue.path, inStep));
  }

  return { steps, flow };
}
