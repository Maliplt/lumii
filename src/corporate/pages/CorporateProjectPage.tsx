import { Link } from "react-router-dom";
import { Button, Tabs } from "rsuite";
import { ArrowRight, Check } from "lucide-react";
import { PageHero, SectionHead } from "../components/Section";
import { company, productModules } from "../data";
import satranc from "../../assets/images/satranc.jpg";
import sudoku from "../../assets/images/sudoku.jpg";
import kelime from "../../assets/images/kelimezinciri.webp";
import mahjong from "../../assets/images/mahjong.webp";
import prizma from "../../assets/images/prizma.jpg";
import onluk from "../../assets/images/onluk.jpg";

const journey = [
  { step: "Profil seçimi", text: "PIN kilitli, yaşa göre ayarlı profiller.", ai: false },
  { step: "Kişisel vitrin", text: "Raflar her profil için yeniden sıralanır.", ai: true },
  { step: "Arama", text: "Yazarak ya da sesle, doğal Türkçe ile.", ai: true },
  { step: "Oynatma", text: "Uyarlanabilir akış ve otomatik eşlenen altyazı.", ai: true },
  { step: "Oyun & TV", text: "Aynı hesapla, indirmeden, kaldığın yerden.", ai: false },
  { step: "Destek", text: "İlk yanıt asistandan, çözüm ekipten.", ai: true },
];

const shelf = [
  { src: satranc, name: "Satranç" },
  { src: kelime, name: "Kelime Zinciri" },
  { src: sudoku, name: "Sudoku" },
  { src: mahjong, name: "Mahjong" },
  { src: prizma, name: "Prizma" },
  { src: onluk, name: "Onluk" },
];

const stack = [
  ["Arayüz", "React 19, TypeScript, RSuite"],
  ["Durum yönetimi", "Redux Toolkit"],
  ["Video", "HLS uyarlanabilir akış"],
  ["Ses", "Tarayıcı içi ses etkinliği algılama (VAD)"],
  ["Yapay zekâ", "Claude Opus 5.5, Fable 5.1"],
  ["Sürüm ritmi", "Haftalık"],
];

export default function CorporateProjectPage() {
  return (
    <>
      <PageHero
        crumb="TENET Projesi"
        title={<>TENET: tek hesapla film, dizi, canlı TV ve oyun.</>}
        lead={`${company.product}, Tenett'in ilk ve ana ürünüdür. ${company.operatingSince}'ten beri ücretli paketlerle hizmet veriyor; web ve mobil tarayıcılarda çalışıyor.`}
        aside={
          <Button as={Link} to="/" className="tn-btn tn-btn--solid">
            Platformu açın <ArrowRight size={16} />
          </Button>
        }
      />

      <section className="tn-section">
        <div className="tn-wrap">
          <SectionHead index="01" kicker="Modüller" title="Dört dikey, tek ürün." />
          <Tabs defaultActiveKey={productModules[0].key} appearance="subtle" className="tn-tabs">
            {productModules.map((m) => (
              <Tabs.Tab key={m.key} eventKey={m.key} title={m.label}>
                <div className="tn-tabpanel">
                  <div>
                    <h3>{m.title}</h3>
                    <p>{m.text}</p>
                  </div>
                  <ul>
                    {m.points.map((p) => (
                      <li key={p}>
                        <Check size={16} /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Tabs.Tab>
            ))}
          </Tabs>
        </div>
      </section>

      <section className="tn-section tn-section--paper">
        <div className="tn-wrap">
          <SectionHead
            index="02"
            kicker="Kullanıcı yolculuğu"
            title="Bir oturumda yapay zekâ nerede devreye giriyor?"
            lead="Kırmızı işaretli adımlarda bir model çalışır. Diğer adımlar kural tabanlıdır ve bilinçli olarak öyle kalır."
          />
          <ol className="tn-journey">
            {journey.map((j, i) => (
              <li key={j.step} className={j.ai ? "is-ai" : undefined}>
                <span className="tn-journey__no">{String(i + 1).padStart(2, "0")}</span>
                <h3>{j.step}</h3>
                <p>{j.text}</p>
                {j.ai && <span className="tn-journey__flag">Yapay zekâ</span>}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="tn-section">
        <div className="tn-wrap">
          <SectionHead
            index="03"
            kicker="Oyun kütüphanesi"
            title="Yirmi altı oyun, sıfır indirme."
            lead="Kütüphanenin büyük bölümü ekibimiz tarafından Türkçe için geliştirildi; kelime oyunları kendi sözlüğümüzle doğrulanıyor."
          />
          <div className="tn-shelf">
            {shelf.map((g) => (
              <figure key={g.name}>
                <img src={g.src} alt={g.name} loading="lazy" />
                <figcaption>{g.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="tn-section tn-section--rule">
        <div className="tn-wrap tn-stack">
          <SectionHead index="04" kicker="Teknoloji" title="Altyapı." />
          <dl className="tn-spec">
            {stack.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="tn-band">
        <div className="tn-wrap tn-band__row">
          <h2>Yapay zekâyı hangi işlerde, hangi modelle kullandığımızı ayrıntılı anlattık.</h2>
          <Button as={Link} to="/kurumsal/yapay-zeka" className="tn-btn tn-btn--paper">
            Yapay zekâ sayfası <ArrowRight size={16} />
          </Button>
        </div>
      </section>
    </>
  );
}
