import type { PreviewRoleId } from "@/platform/access/preview-roles";

/**
 * The work block at the top of "Bugün" (D-056, D-065): what this seat is expected to deal with
 * today, before any figure is shown.
 *
 * SAMPLE DATA. No module produces work items yet, so each seat has example rows. The seat also
 * decides the block, which is the development role switcher's job (D-061); IAM replaces both
 * with real permissions and real queues, and this file goes away with them.
 */

export type TodayWorkTone = "danger" | "warning" | "neutral";

export type TodayWorkRow = {
  id: string;
  title: string;
  note: string;
  tone: TodayWorkTone;
  /** Where the row leads. Every row must reach its source (§3.3). */
  href: `/${string}`;
};

export type TodayWork = {
  title: string;
  /** One line saying what this block is for, in this seat's words. */
  lead: string;
  rows: readonly TodayWorkRow[];
  action: { label: string; href: `/${string}` };
  /** Shown when nothing is waiting: an empty screen means finished work (D-056). */
  emptyText: string;
};

const ownerWork: TodayWork = {
  title: "Dikkat",
  lead: "Yönetimin bugün müdahale etmesi gerekenler (§3.3).",
  rows: [
    {
      id: "over-pour",
      title: "Hedefin üstünde döküm",
      note: "Kavaklı: proje hedefinin 42 panel üstüne çıkıldı, açıklama girilmemiş",
      tone: "danger",
      href: "/sites/kavakli/dokum",
    },
    {
      id: "stale-site",
      title: "3 gündür kayıt yok",
      note: "Ilgaz şantiyesinin son kaydı 13 Eylül",
      tone: "danger",
      href: "/sites/ilgaz",
    },
    {
      id: "late-collection",
      title: "Geciken tahsilat",
      note: "2 hakedişin vadesi geçti — 1,24 M₺",
      tone: "warning",
      href: "/finance",
    },
    {
      id: "idle-crane",
      title: "Atıl vinç",
      note: "Sarıyar: 6 gündür hareket yok",
      tone: "warning",
      href: "/equipment",
    },
  ],
  action: { label: "Tüm uyarılar", href: "/insights" },
  emptyText: "Bugün dikkat gerektiren bir durum yok.",
};

const coordinatorWork: TodayWork = {
  title: "Onay kuyruğu",
  lead: "Gün, kuyruğu boşaltmakla geçer (§4).",
  // Mirrors the approval centre, which has no sample records any more (D-106).
  rows: [],
  action: { label: "Kuyruğa gir", href: "/approvals" },
  emptyText: "Kuyruk boş. Bugün temiz.",
};

const siteEngineerWork: TodayWork = {
  title: "Bugünün kaydı",
  lead: "Tek iş: günün kaydını tamamlayıp onaya göndermek (§9.6).",
  rows: [
    {
      id: "missing-sections",
      title: "Kayıt taslak durumda",
      note: "Döküm ve puantaj girildi; montaj, zayi ve fotoğraf eksik",
      tone: "warning",
      href: "/sites/kavakli",
    },
    {
      id: "target",
      title: "Günlük hedefin gerisindesiniz",
      note: "24 / 30 panel — 6 panel eksik",
      tone: "neutral",
      href: "/sites/kavakli/dokum",
    },
    {
      id: "stock",
      title: "Kritik stok: kalıp yağı",
      note: "2 günlük kaldı, talep açılmadı",
      tone: "danger",
      href: "/inventory",
    },
  ],
  action: { label: "Günün kaydını aç", href: "/sites/kavakli" },
  emptyText: "Bugünün kaydı onaya gönderildi.",
};

const crewLeadWork: TodayWork = {
  title: "Bugünkü işiniz",
  lead: "Yalnız kendi çalışmanızla ilgili bilgiler (§2.5).",
  rows: [
    {
      id: "assignment",
      title: "Montaj — 3. kademe",
      note: "Kavaklı, A blok duvarı",
      tone: "neutral",
      href: "/sites/kavakli/montaj",
    },
    {
      id: "timesheet",
      title: "Dünkü puantaj onayınızı bekliyor",
      note: "8 kişi, 9 saat — doğru değilse bildirin",
      tone: "warning",
      href: "/sites/kavakli/puantaj",
    },
  ],
  action: { label: "Şantiyeyi aç", href: "/sites/kavakli" },
  emptyText: "Bugün için bekleyen bir iş yok.",
};

export const todayWorkBySeat: Readonly<Record<PreviewRoleId, TodayWork>> = {
  "crew-lead": crewLeadWork,
  coordinator: coordinatorWork,
  owner: ownerWork,
  "site-engineer": siteEngineerWork,
};
