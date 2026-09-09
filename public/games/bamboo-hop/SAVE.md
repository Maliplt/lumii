# Kayıt yönetimi

İlk ayar save-config.js içindedir
Kayıt işlemleri runtime/modules/save-storage.js içindedir
Alanlar save-schema.json içinde açıklanır

## Kimlik

id oyuncuyu subId aynı oyuncunun ayrı kayıt alanını belirtir
İkisi de metin olarak tutulur

```js
window.BambooHopConfig = {
  id: "player-42",
  subId: "forest-main",
  autoSync: false,
  database: null
};
```

Yerel anahtar bamboo-hop:player-42:forest-main biçimindedir
Özel karakterler encodeURIComponent ile kodlanır
Yalnızca belgelenen kayıt biçimi kabul edilir
Eski kayıt silinmez

Ana menü açıkken profil değiştirilebilir

```js
BambooHopSave.useIdentity("player-42", "forest-main");
BambooHopSave.identity();
BambooHopSave.storageKey();
BambooHopSave.read();
BambooHopSave.record();
BambooHopSave.export();
BambooHopSave.import(jsonText);
```

import işlemi gelen ilerlemeyi seçili profile kopyalar
Dosyadaki kimlik seçili profili değiştirmez
Profiller oyun sırasında değiştirilemez

## Veritabanı bağlantısı

Bu pakette veritabanı veya sunucu kimlik doğrulaması yoktur
load ve save işlevlerini kendi oturum doğrulamalı sunucunuza bağlayın
Veritabanı parolası veya servis anahtarı oyun dosyalarına konulmamalıdır
Sunucu istekteki id değerine güvenmeden oturumun bu kayda erişimini doğrulamalıdır

```js
const database = {
  async load({ id, subId }) {
    return myAuthenticatedApi.readProgress(id, subId);
  },
  async save({ id, subId }, record) {
    return myAuthenticatedApi.writeProgress(id, subId, record);
  }
};
BambooHopSave.configureDatabase(database, false);
await BambooHopSave.loadRemote();
await BambooHopSave.pushRemote();
BambooHopSave.syncStatus();
```

myAuthenticatedApi örnek isimdir
Gerçek sunucu bağlantısı sizin entegrasyonunuz tarafından sağlanır
load null veya aşağıdaki kayıt zarfını döndürmelidir
save işlemi başarısız olduğunda hata fırlatmalıdır

```json
{
  "game": "Bamboo Hop",
  "version": 2,
  "identity": { "id": "player-42", "subId": "forest-main" },
  "savedAt": "2026-09-09T12:00:00.000Z",
  "progress": {
    "best": 55,
    "bamboo": 120
  }
}
```

Eksik ilerleme alanları varsayılan değerlerini alır
Uzak kimlik eşleşmezse kayıt yüklenmez
Veritabanında id ve subId birlikte benzersiz anahtar olmalıdır
autoSync açıkken yerel değişiklikler sıralı olarak uzak adaptöre yazılır
Uzak yükleme açık bir işlemdir ve yerel ilerlemenin üzerine yazar
Çakışma ve çoklu cihaz sürüm kontrolü sunucuda uygulanmalıdır
Yerel saat veya istemci skoru ticari ödül doğrulaması için güvenilir kaynak değildir

file adresi ve http adresi farklı yerel depolardır
Kayıt taşımak için export ve import kullanılabilir
