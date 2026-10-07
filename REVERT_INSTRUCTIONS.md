# Tenett Kurumsal Web Sitesi & 6 Ekim Geri Alma (Revert) Rehberi

Bu proje, **Tenett** için profesyonel bir kurumsal web sitesi (Ürünler, Hakkımızda, Kuruluş Hikayesi, Alınan Yatırımlar, Büyüme Metrikleri, Basın Kiti ve İletişim) ile donatılmıştır.

---

## 🔒 6 Ekim 2026 Durumunun Korunması (Güvenlik Önlemi)

Tenet'in 6 Ekim'deki tüm çalışma ağacı, unstaged ve untracked dosyaları dahil olmak üzere **eksiksiz olarak** Git üzerinde yedeklenmiş ve commit edilmiştir:

- **Yedek Branch Adı:** `backup/tenet-6-ekim`
- **Yedek Commit Hash:** `7a8867e` ("chore: snapshot of Tenet platform as of 6 Ekim 2026")
- **Şu Anki Kurumsal Site Branch:** `corporate-site`

---

## 🚀 Kurumsal Web Sitesi Sayfaları ve Canlı Demo

Kurumsal web sitesi yayındayken platform şu şekilde organize edilmiştir:

1. **`/` (Ana Sayfa / Genel Bakış):**
   - Tenett Yüksek Performanslı Medya ve Eğlence Ekosistemi.
   - İnteraktif ürün demosu (4K oynatıcı, dahili Arcade oyunları, TV modu).
   - Çekirdek metrikler (<180ms TTFB, 4K 60fps, 7+ WASM oyunu).

2. **`/products` (Ürünlerimiz):**
   - Tenet Stream OS (HLS v7, HDR10, Dolby 5.1).
   - Tenet Arcade (Doom WASM, Block Bloom, 2048, Mahjong, Sudoku).
   - Tenet TV & Leanback Modu (10-foot arayüz, uzaktan kumanda desteği).
   - Debrid Core & Multi-Source (Real-Debrid & Torrentio akıllı önbellek).
   - Karşılaştırma matrisi (Geleneksel oynatıcılara ve IPTV'ye karşı).

3. **`/about` (Hakkımızda & Kuruluş):**
   - 2024 İstanbul (Maslak) & Londra kuruluş hikayesi.
   - Sıfır Şişkinlik (Zero Bloat) ve Medya Özgürlüğü ilkeleri.
   - Yönetim ve mühendislik kadrosu.
   - Zaman çizelgesi (2024 Pre-seed -> 2025 Seed -> 2026 v2.6).

4. **`/investors` (Yatırımcılar & Sermaye):**
   - Pre-Seed ($450K) ve Seed Round ($1.8M) finansman turları.
   - Scale Media Partners & Emerging Digital Ventures.
   - Büyüme metrikleri (Retention %86.4, LTV/CAC 4.8x).
   - Sermaye kullanım planı ve Pitch Deck talep formu.

5. **`/contact` (İletişim & Basın Kiti):**
   - Yatırımcı, partnerlik ve basın iletişim formu.
   - Vektörel Tenett logoları (SVG) ve basın varlıkları indirme alanı.
   - İstanbul ve Londra merkez iletişim bilgileri.

6. **`/app` (Canlı Tenet Platformu):**
   - Orijinal Tenet film, dizi, canlı TV ve oyun platformu `/app` adresinde %100 çalışır durumdadır.
   - Kurumsal sitedeki "Canlı Platformu Test Et" / "Canlı Platform" butonları doğrudan burayı açar.

---

## ⏪ 6 Ekim'deki Haline Geri Dönme (Revert) Talimatı

Kurumsal web sitesini kullandıktan sonra, platformu **6 Ekim'deki haline tek bir komutla** geri döndürmek için terminalde şu komutu çalıştırmanız yeterlidir:

```bash
git checkout backup/tenet-6-ekim
```

Eğer `main` dalı üzerinde çalışmak ve 6 Ekim haline sabitlemek isterseniz:

```bash
git checkout main
git reset --hard backup/tenet-6-ekim
```

Bu işlem yapıldığında hiçbir kod veya ayar kaybolmadan, doğrudan 6 Ekim'deki Tenet platformuna anında geri dönmüş olursunuz.
