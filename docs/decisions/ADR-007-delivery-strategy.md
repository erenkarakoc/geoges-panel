# ADR-007 — Teslim stratejisi: önce tasarım, doğrulama, modül modül pilot

## Karar
1. Eski kod tabanları (`../eski/`) tamamen yok sayılır; proje sıfırdan kurulur.
2. Tüm modüllerin tasarımı (gereksinim, domain, UX, mimari, veritabanı, altyapı) ürün kodundan önce tamamlanır.
3. Riskli varsayımlar atılacak spike'larla doğrulanır; spike kodu ürüne alınmaz.
4. Temel altyapıdan sonra modüller dikey dilimler halinde geliştirilir ve her dilim gerçek kullanıcılarla pilotlanır.
5. İlk dilim: Çekirdek + Saha + Onay + Şantiye detayı + Cockpit.
6. İlk sürüm çevrimiçi web uygulamasıdır; çevrimdışı giriş (DEF-002), native mobil (DEF-003) ve veri aktarımı (DEF-001) ertelenmiştir.

## Bağlam
Önceki denemeler parça parça büyüdü, isimlendirme ve mimari tutarsız kaldı. Sahip önce bütün resmi görmek istiyor.

## Problem
Tamamen önden tasarım, gerçek kullanımda ortaya çıkacak hataları geç yakalar; tamamen yinelemeli geliştirme ise tutarsız mimari üretir.

## Alternatifler
1. Önce tüm tasarım, sonra kod
2. Teknik katman fazları
3. Temel + modül dilimleri (tasarım dilim bazında)

## Seçilen Çözüm
Seçenek 1, doğrulama spike'ları ve dilim bazlı pilot ile dengelenmiş hali.

## Gerekçe
Bütünsel tasarım modüller arası tutarlılığı sağlar; spike ve pilotlar önden tasarımın kör noktalarını erken ortaya çıkarır.

## Avantajlar
Tutarlı veri modeli ve isimlendirme, erken gerçek kullanıcı geri bildirimi.

## Dezavantajlar
İlk çalışan ekran daha geç gelir.

## Riskler
RISK-002 kapsam büyüklüğü; pilot geri bildirimi tasarımı değiştirebilir (değişiklik yönetimi ile ele alınır).

## Geçiş (Migration) Notları
Pilot bulguları CHG kayıtlarıyla tasarıma geri işlenir.

**Değişiklik (CHG-002, 2026-09-15, sahip onaylı):** Phase 01 ile paralel yürüyen **Milestone M0** eklendi. M0'da gerçek Supabase girişiyle çalışan giriş ekranları ve boş kart iskeletli dashboard yerelde gösterilir. Kod atılmaz; Phase 07 temelinin ilk parçası olarak kalite kapılarıyla kurulur. Diğer tüm maddeler geçerlidir.

**Değişiklik (CHG-003 ve CHG-004, 2026-09-16/17, sahip onaylı):** Yalnızca geliştirmede çalışan sunum sandbox'ı (CHG-003) ve navigasyon iskeletinin ürün kabuğuna aktarımı (CHG-004) onaylandı. CHG-004, **Phase 02**'nin (navigasyon, bilgi mimarisi, rol giriş ekranı, üst bar, mobil) ve **Phase 07**'nin (uygulama kabuğu) bir kısmını fazlarından önce teslim etti; iki faz da `PARTIALLY_DONE` işaretlidir ve yol haritasında neyin teslim edildiği, neyin borçta kaldığı kalem kalem yazılıdır. Maddenin geri kalanı (tasarım önce, spike, dilim pilotu) geçerlidir.

**Değişiklik (CHG-005, 2026-09-17, sahip onaylı):** Sahip talimatıyla ürün kodu, CHG-005 (kayıt tutarlılığı) ve CHG-006 (iş akışı altyapısı yönü) kapanana kadar **donduruldu**. Bu süre boyunca yalnızca kayıt/doküman işi ve kayıtları denetleyen araç kodu yazılır.

**Değişiklik (CHG-006, 2026-09-18, sahip onaylı):** Faz sırası değişmedi — iş akışı motoru ve tasarımcı temel altyapıdan sonra, modül dilimlerinden önce (D-088). Yeni bir yapım adımı eklendi: **kayıt türü üreteci, ilk dilimin pilotundan sonra** (D-105). CHG-005 ile konan ürün kodu dondurması CHG-006'nın işlenmesiyle sona erdi; bu ADR'nin "önce tasarım" kuralı aynen geçerlidir.

## Tarih
2026-09-15

## Durum
Kabul edildi
