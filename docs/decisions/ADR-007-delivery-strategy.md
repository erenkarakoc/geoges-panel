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

## Tarih
2026-09-15

## Durum
Kabul edildi
