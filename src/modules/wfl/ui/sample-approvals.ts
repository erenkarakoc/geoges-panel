/**
 * SAMPLE DATA for the approval centre (§4). No module produces approvals yet, so the screen is
 * judged on records that look like the real thing. The list is as long as the rail badge says
 * (`sampleWorkCounts.approvals`), which a test keeps true — a badge that disagrees with the
 * queue was the first thing to look wrong in the sandbox.
 */

export type ApprovalFact = {
  label: string;
  value: string;
  /** Marks a figure the approver is expected to check (§13). */
  flagged?: boolean;
};

export type ApprovalRecord = {
  id: string;
  title: string;
  site: string;
  person: string;
  submittedAt: string;
  facts: readonly ApprovalFact[];
};

export const sampleApprovals: readonly ApprovalRecord[] = [
  {
    id: "log-kavakli-15",
    title: "15 Eylül günlük şantiye kaydı",
    site: "Kavaklı Şantiyesi",
    person: "M. Yılmaz · Saha Mühendisi",
    submittedAt: "2 gündür bekliyor",
    facts: [
      { label: "Döküm", value: "28 panel" },
      { label: "Montaj", value: "24 panel" },
      { label: "Zayi", value: "2 panel — fotoğraf yok", flagged: true },
      { label: "Puantaj", value: "9 kişi · 9 saat" },
      { label: "Malzeme", value: "Üretimle uyumlu" },
      { label: "Saha harcaması", value: "1.240 ₺" },
    ],
  },
  {
    id: "log-ilgaz-15",
    title: "15 Eylül günlük şantiye kaydı",
    site: "Ilgaz Şantiyesi",
    person: "H. Demir · Saha Mühendisi",
    submittedAt: "dün gönderildi",
    facts: [
      { label: "Döküm", value: "0 panel — işveren dolgusu bekleniyor" },
      { label: "Bekleme", value: "6 saat 20 dk", flagged: true },
      { label: "Puantaj", value: "6 kişi · 8 saat" },
      { label: "Fotoğraf", value: "4 adet" },
    ],
  },
  {
    id: "expense-kavakli",
    title: "Saha harcaması onayı",
    site: "Kavaklı Şantiyesi",
    person: "M. Yılmaz · Saha Mühendisi",
    submittedAt: "bugün gönderildi",
    facts: [
      { label: "Tutar", value: "14.850 ₺" },
      { label: "Konu", value: "Kalıp yağı ve sarf malzeme" },
      { label: "Belge", value: "Fiş fotoğrafı eklendi" },
    ],
  },
];
