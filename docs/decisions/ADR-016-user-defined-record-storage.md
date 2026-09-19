# ADR-016 — Kullanıcı tanımlı kayıt türlerinin saklanması

## Karar
Kullanıcı tanımlı bir kayıt, ortak bir tabloda **tek satırdır**: alanları JSONB sütununda, kapsam, sahip ve durum gerçek sütunlarda tutulur. Tür başına tablo yaratılmaz.

## Bağlam
D-079 ile yetkili kullanıcı kendi kayıt türünü tanımlayabiliyor (REQ-WFL-035…039). Oluşturucu pilot sonrasında yapılacak (D-105), ama veri modeli baştan hazır olmalı.

## Problem
Kullanıcının tanımladığı yapı; yetki, arama, rapor, geçmiş ve göç gerekliliklerini bozmadan saklanmalı (RISK-010).

## Alternatifler
1. Alan-değer tabloları (EAV)
2. Tür başına JSONB satırı
3. Tür başına gerçek tablo (dinamik DDL)

## Seçilen Çözüm
Seçenek 2 (D-241). Ayrıntı: `docs/architecture/RECORD_TYPES.md`. Alan dizinleri tür tanımından üretilir; ilişkiler bağ tablosunda durur; alan silinmez, emekliye ayrılır (D-094).

## Gerekçe
Tek RLS politikası her türü kapsar; kayıt başına tek satır listeyi ve raporu ucuz tutar; kullanıcı eliyle şema değişikliği olmaz.

## Avantajlar
Yetki modeli aynen geçerli; yeni tür göç gerektirmez; yedek ve geri dönüş tek şema üzerinden.

## Dezavantajlar
JSONB sorguları tipli sütunlardan yavaştır; dizinler açıkça kurulmalıdır; alan tipi değiştirilemez.

## Riskler
RISK-010. Sınırlar kondu: 50 tür, 60 alan, 10 aranabilir alan, 10 ilişki türü. Doğrulama: SPIKE-08.

## Geçiş (Migration) Notları
Bir tür modül olacak kadar büyürse verisi JSONB'den tipli tabloya taşınır; kimlikler ve bağ tablosu korunur.

## Tarih
2026-09-20

## Durum
Kabul edildi (SPIKE-08 ile doğrulanacak)
