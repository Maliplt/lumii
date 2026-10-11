// kurumsal site içeriği,
// tüm metinler burada; sayfalar sadece bu veriyi çizer.

export const company = {
  name: "Tenett",
  legalName: "Tenett Teknoloji A.Ş.",
  product: "TENET",
  founded: "2025",
  operatingSince: "Şubat 2026",
  city: "İstanbul",
  address: "Maslak Mah. Büyükdere Cad. No: 255, 34485 Sarıyer / İstanbul",
  email: "iletisim@tenett.com.tr",
  investorEmail: "yatirimci@tenett.com.tr",
  pressEmail: "basin@tenett.com.tr",
  phone: "+90 212 000 00 00",
};

export const navLinks = [
  { to: "/kurumsal", label: "Şirket", end: true },
  { to: "/kurumsal/hakkimizda", label: "Hakkımızda" },
  { to: "/kurumsal/tenet", label: "TENET Projesi" },
  { to: "/kurumsal/yapay-zeka", label: "Yapay Zekâ" },
  { to: "/kurumsal/iletisim", label: "İletişim" },
];

export const keyFigures = [
  { value: "Şub 2026", label: "Ticari faaliyete başlangıç" },
  { value: "26", label: "Platforma gömülü yerli oyun" },
  { value: "4", label: "Tek hesapta içerik dikeyi" },
  { value: "2", label: "Üretimde kullanılan öncü model" },
];

export const history = [
  {
    date: "Mart 2025",
    title: "Bir mutfak masası fikri",
    text: "Kurucu ekip, film, dizi, canlı yayın ve oyun için dört ayrı abonelik ödemenin yorgunluğundan yola çıkarak tek ekranlı bir eğlence platformu taslağı çizdi.",
  },
  {
    date: "Temmuz 2025",
    title: "Tenett Teknoloji A.Ş. kuruldu",
    text: "Şirket İstanbul'da tescil edildi. İlk çalışan prototip; profil yönetimi, oynatıcı ve iki tarayıcı oyunuyla iç testlere açıldı.",
  },
  {
    date: "Kasım 2025",
    title: "Tohum yatırım turu",
    text: "Türkiye merkezli girişim sermayesi fonları ve melek yatırımcı ağlarının katılımıyla tohum turu tamamlandı; ekip on dört kişiye ulaştı.",
  },
  {
    date: "Şubat 2026",
    title: "Ticari faaliyete başladık",
    text: "TENET platformu ücretli paketleriyle kullanıcılara açıldı. Aynı ay yapay zekâ destekli altyazı eşleme ve kişiselleştirilmiş vitrin canlıya alındı.",
  },
  {
    date: "Haziran 2026",
    title: "Canlı TV ve oyun kütüphanesi",
    text: "Canlı TV yayınları eklendi; satrançtan kelime zincirine yirmi altı oyunluk yerli oyun kütüphanesi tek hesap altında toplandı.",
  },
  {
    date: "Ekim 2026",
    title: "Bugün",
    text: "Ürün ekibimiz Claude Opus 5.5 ve Fable 5.1 modelleriyle çalışan iç araçlarla haftalık sürüm takvimini koruyor; sıradaki durak TV uygulamaları.",
  },
];

export const values = [
  {
    no: "01",
    title: "Tek hesap, tek fatura",
    text: "Kullanıcının eğlence bütçesini parçalamayan, şeffaf paket yapısı.",
  },
  {
    no: "02",
    title: "Türkçe önce gelir",
    text: "Altyazıdan oyun sözlüğüne kadar her katman Türkçe için tasarlanır, sonra çevrilir.",
  },
  {
    no: "03",
    title: "Ölçülebilir yapay zekâ",
    text: "Bir modeli ancak ölçtüğümüz bir sorunu çözüyorsa ürüne alırız.",
  },
  {
    no: "04",
    title: "Aile için güvenli",
    text: "PIN kilitli profiller ve yaşa uygun vitrinler varsayılan ayardır, ek paket değil.",
  },
];

// NOT: yatirimci listesi temsilidir; yayina almadan once
// her kurumun yazili onayi alinmali ve liste guncellenmelidir
export const investorRounds = [
  {
    round: "Tohum Turu",
    date: "Kasım 2025",
    lead: "212",
    investors: ["212", "Revo Capital", "Galata Business Angels"],
  },
  {
    round: "Seri A",
    date: "Eylül 2026",
    lead: "Earlybird Digital East",
    investors: [
      "Earlybird Digital East",
      "İş Girişim",
      "Diffusion Capital Partners",
      "Collective Spark",
      "Boğaziçi Ventures",
    ],
  },
];

export const investors = [
  { name: "212", type: "Girişim Sermayesi", note: "Tohum turu lideri" },
  { name: "Earlybird Digital East", type: "Girişim Sermayesi", note: "Seri A lideri" },
  { name: "Revo Capital", type: "Girişim Sermayesi", note: "Tohum turu" },
  { name: "İş Girişim", type: "Kurumsal Girişim Sermayesi", note: "Seri A" },
  { name: "Diffusion Capital Partners", type: "Girişim Sermayesi", note: "Seri A" },
  { name: "Collective Spark", type: "Girişim Sermayesi", note: "Seri A" },
  { name: "Boğaziçi Ventures", type: "Girişim Sermayesi", note: "Seri A" },
  { name: "Galata Business Angels", type: "Melek Yatırımcı Ağı", note: "Tohum turu" },
];

export const productModules = [
  {
    key: "film",
    label: "Film & Dizi",
    title: "Sinema oynatıcısı, ev ekranında",
    text: "Uyarlanabilir akış, bölüm geçişleri, kaldığın yerden devam ve otomatik eşlenen altyazılarla tam ekran sinema deneyimi.",
    points: ["HLS uyarlanabilir akış", "Kaldığın yerden devam", "Çok dilli altyazı", "Fragman önizleme"],
  },
  {
    key: "tv",
    label: "Canlı TV",
    title: "Kanallar, tek bir rehberde",
    text: "Ulusal ve tematik kanallar, aynı hesapla ve aynı oynatıcıyla; ayrı bir uygulama gerektirmeden.",
    points: ["Kanal rehberi", "Düşük gecikmeli yayın", "Profil bazlı favoriler"],
  },
  {
    key: "oyun",
    label: "Oyunlar",
    title: "İndirmeden oynanan yerli oyunlar",
    text: "Satranç, sudoku, kelime zinciri, mahjong, 2048 ve daha fazlası tarayıcıda anında açılır; ilerleme hesabına kaydedilir.",
    points: ["26 oyun", "Türkçe sözlük tabanlı kelime oyunları", "Mobil uyumlu kontroller"],
  },
  {
    key: "profil",
    label: "Profil & Aile",
    title: "Herkese kendi vitrini",
    text: "Bir hesapta birden fazla profil, PIN kilidi ve yaşa göre şekillenen içerik akışı.",
    points: ["PIN kilitli profiller", "Çocuk modu", "Kişisel kitaplık"],
  },
];

export const aiAreas = [
  {
    no: "01",
    area: "Altyazı eşleme ve zamanlama",
    text: "Farklı kaynaklardan gelen altyazı dosyaları, videonun sürüm bilgisi ve ses izine göre puanlanır; en uygun dosya seçilir ve kayma varsa zaman ofseti otomatik düzeltilir.",
    metric: "Elle düzeltme talebinde belirgin düşüş",
  },
  {
    no: "02",
    area: "Kişiselleştirilmiş vitrin",
    text: "İzleme geçmişi, profil yaşı ve günün saatine göre ana sayfadaki raflar her profil için yeniden sıralanır. Çocuk profillerinde model yalnızca uygun içerik havuzundan seçim yapabilir.",
    metric: "Profil başına ayrı sıralama",
  },
  {
    no: "03",
    area: "Sesli arama",
    text: "Tarayıcı içinde çalışan ses etkinliği algılama (VAD) konuşmanın başlangıç ve bitişini yakalar; “bu akşam kısa bir komedi” gibi doğal Türkçe istekler arama sorgusuna çevrilir.",
    metric: "Cihaz üzerinde ses algılama",
  },
  {
    no: "04",
    area: "İçerik meta verisi",
    text: "Eksik ya da yabancı dilde gelen özetler Türkçeleştirilir, tür ve ruh hali etiketleri üretilir, yaş sınırı önerileri editör onayına sunulur.",
    metric: "Editör onaylı yayın akışı",
  },
  {
    no: "05",
    area: "Oyun zekâsı",
    text: "Satranç bulmacalarının zorluk derecelendirmesi, sudoku ve kelime oyunlarında tek çözümlü bulmaca üretimi ve Türkçe sözlük doğrulaması yapay zekâ destekli araçlarla hazırlanır.",
    metric: "Her gün yeni bulmaca",
  },
  {
    no: "06",
    area: "Müşteri desteği",
    text: "Ödeme, paket ve oynatma sorunlarına ilk yanıtı veren destek asistanı, çözemediği talepleri bağlamıyla birlikte ekibimize devreder.",
    metric: "İnsan devri her zaman açık",
  },
  {
    no: "07",
    area: "Yazılım geliştirme",
    text: "Kod incelemesi, test yazımı, hata ayıklama ve refaktör işlerinde mühendislerimizin yanında çalışan ajan tabanlı geliştirme araçları kullanıyoruz.",
    metric: "Haftalık sürüm ritmi",
  },
];

export const models = [
  {
    name: "Claude Opus 5.5",
    role: "Mühendislik ve akıl yürütme",
    uses: [
      "Ajan tabanlı kod geliştirme ve kod incelemesi",
      "Uzun bağlamlı mimari analiz ve refaktör",
      "Test senaryosu üretimi",
      "Destek asistanının karmaşık talep çözümlemesi",
    ],
  },
  {
    name: "Fable 5.1",
    role: "Dil ve içerik",
    uses: [
      "Türkçe içerik özetleri ve meta veri üretimi",
      "Tür, ruh hali ve yaş etiketleme önerileri",
      "Doğal dilde sesli arama sorgusu çözümleme",
      "Kelime oyunları için sözlük ve ipucu üretimi",
    ],
  },
];

export const aiPrinciples = [
  {
    q: "Kullanıcı verisi model eğitiminde kullanılıyor mu?",
    a: "Hayır. İzleme geçmişi yalnızca ilgili profilin vitrinini sıralamak için kullanılır; üçüncü taraf modellerin eğitimine veri gönderilmez.",
  },
  {
    q: "Yapay zekâ çıktıları doğrudan yayına giriyor mu?",
    a: "Meta veri ve yaş sınırı önerileri editör onayından geçmeden yayına alınmaz. Altyazı zamanlaması gibi teknik düzeltmeler ise ölçüm eşiklerini geçtiğinde otomatik uygulanır.",
  },
  {
    q: "Sesli aramada ses kaydı saklanıyor mu?",
    a: "Ses etkinliği algılama tarayıcıda çalışır. Yalnızca konuşma bölümü metne çevrilmek üzere işlenir, ses kaydı sunucularımızda saklanmaz.",
  },
  {
    q: "Çocuk profillerinde nasıl bir koruma var?",
    a: "Çocuk profillerinde öneri modeli yalnızca önceden filtrelenmiş, yaşa uygun içerik havuzuna erişebilir; filtre kuralı modelin değil, sistemin kontrolündedir.",
  },
];

export const contactTopics = [
  { label: "Genel bilgi", value: "genel" },
  { label: "Yatırımcı ilişkileri", value: "yatirimci" },
  { label: "İş birliği & içerik ortaklığı", value: "isbirligi" },
  { label: "Basın", value: "basin" },
  { label: "Kariyer", value: "kariyer" },
];
