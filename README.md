# TENET

TENET; film, dizi, canlı TV ve tarayıcı oyunlarını aynı arayüzde buluşturan React uygulamasıdır. Film ve dizi kataloğu TMDB üzerinden yüklenir.

## Özellikler

- Film ve dizi keşfi, kategori filtreleri ve arama
- İçerik, sezon ve bölüm detayları
- Film evreni ve oyuncu bazlı Spotlight seçkileri
- Profil bazlı izleme geçmişi, liste, beğeni ve otomatik oynatma ayarı
- Üyelik paketleri ve paket erişim kontrolleri
- Canlı TV kanalları ve HLS oynatıcı
- 2048, Kelime Zinciri, Sudoku, Mayın Tarlası, Block Bloom ve Mahjong

## Teknolojiler

- React 19 ve TypeScript
- Vite
- Redux Toolkit
- React Router
- Sass
- Axios ve TMDB API
- RSuite, Lucide, Motion Icons, Anime.js ve HLS.js

## Kurulum

```bash
npm install
```

Kök dizinde `.env` dosyası oluşturup TMDB anahtarını ekleyin:

```env
VITE_TMDB_API_KEY=tmdb_anahtariniz
```

## Komutlar

```bash
npm run dev
npm run build
npm run lint
npm run preview
```
