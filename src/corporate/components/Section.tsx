import type { ReactNode } from "react";

interface SectionHeadProps {
  index: string;
  kicker: string;
  title: ReactNode;
  lead?: ReactNode;
}

// numarali bolum basligi
export function SectionHead({ index, kicker, title, lead }: SectionHeadProps) {
  return (
    <div className="tn-head">
      <div className="tn-head__meta">
        <span className="tn-head__index">{index}</span>
        <span className="tn-head__kicker">{kicker}</span>
      </div>
      <div className="tn-head__body">
        <h2 className="tn-head__title">{title}</h2>
        {lead && <p className="tn-head__lead">{lead}</p>}
      </div>
    </div>
  );
}

interface PageHeroProps {
  crumb: string;
  title: ReactNode;
  lead: ReactNode;
  aside?: ReactNode;
}

// alt sayfa giris alani
export function PageHero({ crumb, title, lead, aside }: PageHeroProps) {
  return (
    <section className="tn-pagehero">
      <div className="tn-wrap tn-pagehero__grid">
        <div>
          <span className="tn-pagehero__crumb">Tenett / {crumb}</span>
          <h1 className="tn-pagehero__title">{title}</h1>
        </div>
        <div className="tn-pagehero__side">
          <p className="tn-pagehero__lead">{lead}</p>
          {aside}
        </div>
      </div>
    </section>
  );
}
