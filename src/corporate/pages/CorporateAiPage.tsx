import { Accordion, Tag } from "rsuite";
import { PageHero, SectionHead } from "../components/Section";
import { aiAreas, aiPrinciples, models } from "../data";

export default function CorporateAiPage() {
  return (
    <>
      <PageHero
        crumb="Yapay Zekâ"
        title={<>Yapay zekâyı nerede, neden ve hangi modelle kullanıyoruz.</>}
        lead="Tenett'te bir model ancak ölçülebilir bir sorunu çözüyorsa üretime alınır. Bu sayfa, bugün kullandığımız her alanı ve arkasındaki modeli açıkça listeler."
        aside={
          <div className="tn-model-pills">
            {models.map((m) => (
              <span key={m.name}>{m.name}</span>
            ))}
          </div>
        }
      />

      <section className="tn-section">
        <div className="tn-wrap">
          <SectionHead index="01" kicker="Modellerimiz" title="İki model, net bir iş bölümü." />
          <div className="tn-models tn-models--wide">
            {models.map((m) => (
              <article key={m.name} className="tn-model tn-model--dark">
                <Tag className="tn-tag">{m.role}</Tag>
                <h3>{m.name}</h3>
                <ul>
                  {m.uses.map((u) => (
                    <li key={u}>{u}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tn-section tn-section--paper">
        <div className="tn-wrap">
          <SectionHead
            index="02"
            kicker="Kullanım alanları"
            title="Yedi alan, yedi somut görev."
          />
          <div className="tn-areas">
            {aiAreas.map((a) => (
              <article key={a.no} className="tn-area">
                <span className="tn-area__no">{a.no}</span>
                <h3>{a.area}</h3>
                <p>{a.text}</p>
                <span className="tn-area__metric">{a.metric}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tn-section">
        <div className="tn-wrap tn-split">
          <SectionHead
            index="03"
            kicker="Sorumlu kullanım"
            title="Sınırlarımız."
            lead="Yapay zekâyı nerede kullanmadığımız, nerede kullandığımız kadar önemli."
          />
          <Accordion className="tn-accordion" defaultActiveKey={0}>
            {aiPrinciples.map((p, i) => (
              <Accordion.Panel key={p.q} header={p.q} eventKey={i}>
                <p>{p.a}</p>
              </Accordion.Panel>
            ))}
          </Accordion>
        </div>
      </section>
    </>
  );
}
