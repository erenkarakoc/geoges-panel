# ADR-013 — AI sürekliliği ve skill yönetimi

## Karar
- Projenin doğruluk kaynağı **Git + `/ai` + `/docs` + ADR'lardır**. AI hafıza araçları yardımcı katmandır.
- Üç katmanlı süreklilik: (1) Git ve proje dokümanları, (2) claude-mem ve yerleşik AI hafızası, (3) anlık konuşma bağlamı.
- claude-mem bu projeye **yalnızca yerel modda** kurulur (bulut senkronizasyonu ve dış bildirim kanalları kapalı).
- `ui-ux-pro-max` eklentisi bu projede devre dışı bırakılır (ADR-009 ile çelişir).
- Başlangıç skill seti denetlenip onaylandıktan sonra proje kapsamında, commit'e sabitlenerek kurulur: Supabase (`supabase`, `supabase-postgres-best-practices`), COSS (`coss`, `coss-particles`), Vercel (`react-best-practices`), Cloudflare (skill'ler; uzak MCP sunucusu şimdilik yok), Next.js (sürüme bağlı paket içi dokümanlar + `AGENTS.md`). Tailwind CSS için resmi skill bulunmadığından Lombiq `tailwind-4-docs` seçilmiştir (OQ-005); doküman kopyası yalnızca yerelde tutulur (D-024).
- Kayıt ve güncelleme süreci: `ai/AI_SKILLS.md`.

## Bağlam
Proje farklı AI modelleri, IDE'ler ve oturumlar arasında bağlam kaybetmeden sürdürülmelidir.

## Problem
Konuşma geçmişine veya tek bir hafıza aracına güvenmek bağlam kaybına; denetimsiz skill kurulumu tedarik zinciri riskine yol açar.

## Alternatifler
1. Yalnız AI hafızası
2. Yalnız repo dokümanları
3. Katmanlı süreklilik + denetimli skill'ler (seçilen)

## Seçilen Çözüm
Seçenek 3.

## Gerekçe
Repo dokümanları deterministiktir ve herhangi bir modelle çalışır; hafıza araçları geri çağırmayı hızlandırır; resmi skill'ler güncel ve sürüme uygun bilgi sağlar.

## Avantajlar
Model bağımsızlığı, bağlam kaybına dayanıklılık.

## Dezavantajlar
Durum dosyalarının her oturumda güncellenmesi disiplin ister.

## Riskler
RISK-004 skill/eklenti tedarik zinciri; claude-mem'in konuşma içeriğini saklaması (hassas veri paylaşılmaması, `<private>` etiketleri).

## Geçiş (Migration) Notları
Proje olgunlaştıkça proje özel skill'leri (`geoges-*`) oluşturulur (`ai/AI_SKILLS.md`).

## Tarih
2026-09-15

## Durum
Kabul edildi. Kurulumlar onaylandı ve tamamlandı (OQ-003…OQ-006 yanıtlandı; TASK-0008, TASK-0010, TASK-0016).
