# Bamboo Hop

Klasörü tamamen çıkarın ve index.html dosyasını açın
Oyun internet veya kurulum istemez
Güncel WebGL 2 destekli tarayıcı ve donanım hızlandırması gerekir

## Dosyalar

- runtime/modules/main.js oyun akışı ve girişler
- runtime/modules/config.js denge ve süreler
- runtime/modules/world.js sahne ve kamera
- runtime/modules/art.js panda ve nesneler
- runtime/modules/environment.js su ve ışıklar
- runtime/modules/atmosphere.js kar ve erime
- runtime/modules/render-budget.js otomatik çizim bütçesi
- runtime/modules/static-batches.js sabit dekorların toplu çizimi
- runtime/modules/save-storage.js yerel ve uzak kayıt bağlantısı
- runtime/modules/save.js kayıt doğrulama ve aktarım
- save-config.js oyuncu kimliği ve veritabanı bağlantısı
- save-schema.json kayıt alanları
- SAVE.md kayıt entegrasyonu örnekleri
- styles arayüz dosyaları
- vendor/three.js dış 3D kütüphanesi
- licenses.txt gerekli lisans bildirimleri

Oyun modülleri okunabilir JavaScript dosyalarıdır
Dosyayı değiştirip sayfayı yenilemek yeterlidir
Yeni bir modül eklerseniz index.html içindeki betik listesine runtime/start.js öncesinde ekleyin
Modülün ilk satırındaki kimliği dosya adıyla aynı tutun
Kendi kodunuz için derleme veya npm gerekmez

## Kontroller

Bilgisayarda ok tuşları ve WASD
Telefonda dokunma ile ileri gitme ve kaydırma ile yön değiştirme
Boşluk ileri ve Escape mola

## Performans

Yerel dosya ve sunucu aynı oyun kodlarını çalıştırır
Çizim bütçesi ekran çözünürlüğü ve ölçülen kare süresine göre ayarlanır
Kalite ve performans tercihleri oyuncu kaydına aittir
Dosya adresi ve localhost ayrı tarayıcı depoları kullanır
Aynı karşılaştırma için aynı kalite ve aynı pencere boyutunu kullanın

Tarayıcı konsolunda window.__bamboo.rendering ile kare süresi ve çizim sayısı görülebilir
frameMs değeri aktif oyundaki son ölçüm aralığıdır
Her donanım ve tarayıcıda aynı FPS garanti edilemez
WebGL 2 olmayan tarayıcılar desteklenmez
Yerel dosyada otomatik kayıt engelleniyorsa dışa aktarma API işlevini kullanın
