/**
 * SAMPLE DATA (owner decision D-063). There is no notification service yet, so the bell shows
 * example entries marked "örnek veri". A seat's sample count slices this list, which keeps the
 * badge and the list telling the same story. Replace with real notifications when they exist.
 */
export type SampleNotification = { id: string; title: string; note: string };

export const sampleNotifications: readonly SampleNotification[] = [
  { id: "log-returned", title: "Kayıt düzeltmeye döndü", note: "Kavaklı · 15 Eylül günlük kaydı" },
  { id: "approval-waiting", title: "Onay bekleyen kayıt", note: "Ilgaz · 2 gündür bekliyor" },
  { id: "stock-low", title: "Kritik stok", note: "Kalıp yağı · 2 günlük kaldı" },
  { id: "task-assigned", title: "Yeni görev atandı", note: "A blok duvar ölçüsü" },
  { id: "payment-late", title: "Geciken tahsilat", note: "2 hakedişin vadesi geçti" },
  { id: "document-expiring", title: "Süresi dolan belge", note: "Vinç muayene raporu · 5 gün" },
];
