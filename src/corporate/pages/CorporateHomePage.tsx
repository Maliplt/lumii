import { Link } from "react-router-dom";
import { Button, Tag } from "rsuite";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SectionHead } from "../components/Section";
import { aiAreas, company, investors, keyFigures, models, productModules } from "../data";
import satranc from "../../assets/images/satranc.jpg";
import sudoku from "../../assets/images/sudoku.jpg";
import prizma from "../../assets/images/prizma.jpg";
import denge from "../../assets/images/denge.jpg";
import orgu from "../../assets/images/orgu.jpg";
import katman from "../../assets/images/katman.jpg";
import fuzyon from "../../assets/images/fuzyon.jpg";
import renk from "../../assets/images/renk-renk.jpg";

const tiles = [satranc, prizma, sudoku, denge, orgu, katman, fuzyon, renk];

export default function CorporateHomePage() {
  return (
    <>
      <section className="tn-hero">
        <div className="tn-wrap tn-hero__grid">
          <div className="tn-hero__copy">
            <span className="tn-eyebrow">
              <i /> {company.legalName} · {company.city}
            </span>
            <h1 className="tn-hero__title">
              Film, dizi, canlı yayın ve oyunu
              <em> tek ekranda</em> buluşturan teknoloji şirketi.
            </h1>
            <p className="tn-hero__lead">
              Tenett, {company.operatingSince}'ten bu yana {company.product} platformunu geliştiriyor
              ve işletiyor. Ürünümüzün her katmanında ölçtüğümüz, denetlediğimiz yapay zekâ
              çalışıyor.
            </p>
            <div className="tn-hero__cta">
              <Button as={Link} to="/tenet" className="tn-btn tn-btn--solid">
                Projeyi inceleyin <ArrowRight size={16} />
              </Button>
              <Button as={Link} to="/hakkimizda" className="tn-btn tn-btn--line">
                Hakkımızda
              </Button>
            </div>
          </div>

          <aside className="tn-hero__screen" aria-hidden="true">
            <div className="tn-screen">
              <div className="tn-screen__bar">
                <span>TENET</span>
                <span>Film</span>
                <span>Dizi</span>
                <span>Canlı TV</span>
                <span className="is-on">Oyun</span>
              </div>
              <div className="tn-screen__grid">
                {tiles.map((src, i) => (
                  <img key={src} src={src} alt="" loading={i < 4 ? "eager" : "lazy"} />
                ))}
              </div>
            </div>
            <div className="tn-hero__stamp">
              <span>Faaliyette</span>
              <strong>{company.operatingSince}</strong>
            </div>
          </aside>
        </div>

        <div className="tn-hero__ghost" aria-hidden="true">
          TENETT
        </div>
      </section>

      <section className="tn-figures">
        <div className="tn-wrap tn-figures__row">
          {keyFigures.map((f) => (
            <div key={f.label} className="tn-figure">
              <strong>{f.value}</strong>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tn-section">
        <div className="tn-wrap">
          <SectionHead
            index="01"
            kicker="Ne yapıyoruz"
            title={<>Dört abonelik yerine <span className="tn-mark">tek hesap.</span></>}
            lead="TENET; sinema oynatıcısı, canlı TV, tarayıcıda çalışan yerli oyunlar ve aile profillerini tek bir üründe birleştirir."
          />
          <div className="tn-modules">
            {productModules.map((m, i) => (
              <Link key={m.key} to="/tenet" className="tn-module">
                <span className="tn-module__no">{String(i + 1).padStart(2, "0")}</span>
                <h3>{m.label}</h3>
                <p>{m.title}</p>
                <ArrowUpRight className="tn-module__arrow" size={18} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="tn-section tn-section--paper">
        <div className="tn-wrap">
          <SectionHead
            index="02"
            kicker="Yapay zekâ"
            title="Yapay zekâyı süs olarak değil, iş aracı olarak kullanıyoruz."
            lead="Üretimde iki öncü model çalıştırıyoruz. Her birinin görevi tanımlı, çıktısı ölçülü."
          />
          <div className="tn-ai-split">
            <div className="tn-models">
              {models.map((m) => (
                <article key={m.name} className="tn-model">
                  <Tag className="tn-tag">{m.role}</Tag>
                  <h3>{m.name}</h3>
                  <ul>
                    {m.uses.slice(0, 3).map((u) => (
                      <li key={u}>{u}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <ol className="tn-ai-index">
              {aiAreas.map((a) => (
                <li key={a.no}>
                  <span>{a.no}</span>
                  {a.area}
                </li>
              ))}
              <li className="tn-ai-index__more">
                <Link to="/yapay-zeka">
                  Tüm kullanım alanları <ArrowRight size={15} />
                </Link>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="tn-section">
        <div className="tn-wrap">
          <SectionHead
            index="03"
            kicker="Yatırımcılar"
            title="Türkiye'nin önde gelen fonlarıyla büyüyoruz."
          />
          <ul className="tn-investor-wall">
            {investors.map((inv) => (
              <li key={inv.name}>
                <strong>{inv.name}</strong>
                <span>{inv.type}</span>
              </li>
            ))}
          </ul>
          <Link to="/hakkimizda#yatirimcilar" className="tn-textlink">
            Yatırım turları <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="tn-band">
        <div className="tn-wrap tn-band__row">
          <h2>Ortaklık, yatırım ya da basın için doğrudan bize yazın.</h2>
          <Button as={Link} to="/iletisim" className="tn-btn tn-btn--paper">
            İletişime geçin <ArrowRight size={16} />
          </Button>
        </div>
      </section>
    </>
  );
}
