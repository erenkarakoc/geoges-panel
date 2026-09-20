/**
 * SPIKE-07 — throwaway data for the flow-designer canvas experiment.
 * Builds a 40-step definition shaped like the real templates in
 * `docs/workflows/END_TO_END_FLOWS.md`: a chain with an approval that has three
 * outcomes, a for-each fan-out, a parallel branch and a join.
 */

export type StepType =
  | "start"
  | "approval"
  | "task"
  | "condition"
  | "wait"
  | "notify"
  | "escalate"
  | "parallel"
  | "join"
  | "subflow"
  | "lock"
  | "record"
  | "foreach"
  | "end";

export type SpikeStep = {
  id: string;
  type: StepType;
  title: string;
  owner: string;
  hasError?: boolean;
};

export type SpikeEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

const owners = [
  "Şantiyenin koordinatörü",
  "Giriş sorumlusu",
  "Genel müdür",
  "Satın alma (SAL)",
  "Muhasebe (MUH)",
  "Teknik ofis (TO)",
];

const titles: Record<StepType, string[]> = {
  start: ["Günlük kayıt gönderildi"],
  approval: ["Koordinatör onayı", "Genel müdür onayı", "Hakediş onayı"],
  task: ["Düzelt ve yeniden gönder", "Faturayı kes", "İşverene sun", "Zimmeti teslim al"],
  condition: [
    "Tutar eşiği aşıldı mı?",
    "Son 30 günde 3'ten fazla bekleme?",
    "Saha harcaması var mı?",
  ],
  wait: ["Vade gününü bekle", "İşveren cevabını bekle"],
  notify: ["Koordinatöre bildir", "Sahibe kritik bildirim"],
  escalate: ["8 saatte karar yoksa üst role", "Gecikirse genel müdüre"],
  parallel: ["Paralel dal"],
  join: ["Birleşme"],
  subflow: ["Dış taraf onayı alt akışı"],
  lock: ["Zimmet kapanmadan çıkış kilidi"],
  record: ["Taslak hakediş oluştur", "Çıkış listesini aç"],
  foreach: ["Her açık zimmet için", "Her aktif şantiye için"],
  end: ["Bitiş"],
};

/** Deterministic pseudo-random so every run renders the same 40 steps. */
function pick<T>(list: T[], seed: number): T {
  return list[seed % list.length];
}

export function buildSpikeFlow(stepCount = 40): { steps: SpikeStep[]; edges: SpikeEdge[] } {
  const order: StepType[] = [
    "start",
    "condition",
    "approval",
    "task",
    "record",
    "notify",
    "wait",
    "parallel",
    "task",
    "foreach",
    "task",
    "join",
    "escalate",
    "subflow",
    "lock",
    "condition",
    "approval",
    "task",
    "notify",
    "end",
  ];

  const steps: SpikeStep[] = [];
  const edges: SpikeEdge[] = [];

  for (let i = 0; i < stepCount; i += 1) {
    const type = i === 0 ? "start" : i === stepCount - 1 ? "end" : order[i % order.length];
    const id = `s${i + 1}`;
    steps.push({
      id,
      type,
      title: pick(titles[type], i),
      owner: type === "approval" || type === "task" ? pick(owners, i) : "—",
      // one deliberately broken step: an approval with no owner chosen
      hasError: i === 16,
    });

    if (i > 0) {
      edges.push({ id: `e${i}`, source: `s${i}`, target: id });
    }
  }

  // Approval outcomes: the second approval sends corrections back two steps.
  const approvalIndex = steps.findIndex((s, i) => s.type === "approval" && i > 10);
  if (approvalIndex > 2) {
    edges.push({
      id: "e-return",
      source: steps[approvalIndex].id,
      target: steps[approvalIndex - 2].id,
      label: "düzeltmeye gönder",
    });
  }

  return { steps, edges };
}

export const stepLabels: Record<StepType, string> = {
  start: "Başlangıç",
  approval: "Onay",
  task: "Görev",
  condition: "Koşul",
  wait: "Bekleme",
  notify: "Bildirim",
  escalate: "Eskalasyon",
  parallel: "Paralel dal",
  join: "Birleşme",
  subflow: "Alt akış",
  lock: "Kilit",
  record: "Kayıt oluştur",
  foreach: "Her biri için",
  end: "Bitiş",
};
