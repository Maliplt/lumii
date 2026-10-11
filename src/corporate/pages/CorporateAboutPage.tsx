import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Divider, Tag, Timeline } from "rsuite";
import { PageHero, SectionHead } from "../components/Section";
import { company, history, investorRounds, investors, values } from "../data";

export default function CorporateAboutPage() {
  const { hash } = useLocation();

  // #yatirimcilar gibi baglantilar icin
  useEffect(() => {
    if (!hash) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash]);

  return (
    <>
      <PageHero
        crumb="Hakkımızda"
        title={<>Eğlenceyi sadeleştirmek için kurulduk.</>}
        lead={`${company.legalName}, ${company.founded} yılında İstanbul'da kuruldu ve ${company.operatingSince}'te ticari faaliyete başladı. Bugün ${company.product} platformunu geliştiren ürün, içerik ve yapay zekâ ekiplerinden oluşuyoruz.`}
      />

      <section className="tn-section">
        <div className="tn-wrap tn-story">
          <p className="tn-story__lead">
            Türkiye'de bir hane, film, dizi, canlı yayın ve oyun için ortalama üç ila dört ayrı
            servise para ödüyor. Her birinin ayrı şifresi, ayrı faturası, ayrı çocuk ayarı var.
          </p>
          <div className="tn-story__body">
            <p>
              Tenett bu dağınıklığı tek bir hesapta toplamak için kuruldu. İlk günden itibaren
              ürünü Türkçe kullanıcı için tasarladık: altyazılar, oyun sözlükleri, içerik özetleri
              ve destek akışları önce Türkçe düşünülerek kuruldu.
            </p>
            <p>
              Mühendislik kültürümüzün merkezinde ölçüm var. Yapay zekâyı da aynı disiplinle
              kullanıyoruz: Claude Opus 5.5 ve Fable 5.1 modelleri, yalnızca etkisini ölçebildiğimiz
              işlerde ve insan denetimi altında üretimde çalışıyor.
            </p>
          </div>
        </div>
      </section>

      <section className="tn-section tn-section--rule">
        <div className="tn-wrap">
          <SectionHead index="01" kicker="Tarihçe" title="Fikirden faaliyete." />
          <Timeline className="tn-timeline" align="left">
            {history.map((h) => (
              <Timeline.Item
                key={h.date}
                time={h.date}
                className={h.date === "Şubat 2026" ? "is-milestone" : undefined}
              >
                <h3>{h.title}</h3>
                <p>{h.text}</p>
              </Timeline.Item>
            ))}
          </Timeline>
        </div>
      </section>

      <section className="tn-section tn-section--paper">
        <div className="tn-wrap">
          <SectionHead index="02" kicker="İlkelerimiz" title="Nasıl çalışıyoruz." />
          <div className="tn-values">
            {values.map((v) => (
              <article key={v.no} className="tn-value">
                <span>{v.no}</span>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tn-section" id="yatirimcilar">
        <div className="tn-wrap">
          <SectionHead
            index="03"
            kicker="Yatırımcılarımız"
            title="Bize güvenen fonlar ve yatırımcı ağları."
            lead="Tenett, Türkiye merkezli girişim sermayesi fonları, kurumsal girişim sermayesi ve melek yatırımcı ağlarının desteğiyle büyüyor."
          />

          <div className="tn-rounds">
            {investorRounds.map((r) => (
              <article key={r.round} className="tn-round">
                <header>
                  <h3>{r.round}</h3>
                  <span>{r.date}</span>
                </header>
                <Divider className="tn-divider" />
                <dl>
                  <dt>Tur lideri</dt>
                  <dd>{r.lead}</dd>
                  <dt>Katılımcılar</dt>
                  <dd className="tn-round__tags">
                    {r.investors.map((name) => (
                      <Tag key={name} className="tn-tag tn-tag--line">
                        {name}
                      </Tag>
                    ))}
                  </dd>
                </dl>
              </article>
            ))}
          </div>

          <table className="tn-table">
            <thead>
              <tr>
                <th>Yatırımcı</th>
                <th>Tür</th>
                <th>Katılım</th>
              </tr>
            </thead>
            <tbody>
              {investors.map((inv) => (
                <tr key={inv.name}>
                  <td>{inv.name}</td>
                  <td>{inv.type}</td>
                  <td>{inv.note}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="tn-footnote">
            Yatırımcı ilişkileri için: <a href={`mailto:${company.investorEmail}`}>{company.investorEmail}</a>
          </p>
        </div>
      </section>
    </>
  );
}
