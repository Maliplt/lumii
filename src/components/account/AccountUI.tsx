import type { ReactNode } from "react";
import MediaCard from "../MediaCard";
import StateView from "../StateView";
import type { SavedItem } from "../../store/store";

export function SectionIntro({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="acct-section__intro">{children}</p>;
}

export function SummaryBlock({ children }: { children: ReactNode }) {
  return <div className="acct-summary">{children}</div>;
}

export function SummaryRow({
  label,
  value,
  action,
  children,
}: {
  label: string;
  value: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="acct-row">
      <div className="acct-row__copy">
        <span>{label}</span>
        <strong>{value}</strong>
        {children}
      </div>
      {action && <div className="acct-row__action">{action}</div>}
    </div>
  );
}

export function MediaGrid({ items, empty }: { items: SavedItem[]; empty: string }) {
  if (!items.length) {
    return (
      <StateView
        title={empty}
        description="İçerik eklediğinde burada düzenli bir liste olarak görünür."
      />
    );
  }

  return (
    <div className="acct-media-grid">
      {items.map((item) => (
        <MediaCard
          key={`${item.media_type}-${item.id}`}
          item={item}
          type={item.media_type}
        />
      ))}
    </div>
  );
}
