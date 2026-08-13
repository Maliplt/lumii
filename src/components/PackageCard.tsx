import { Button } from "rsuite";
import { Check } from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import type { PackageDef } from "../types/types";

function packageSpecs(pkg: PackageDef) {
  return [
    { label: "Görüntü", value: pkg.quality },
    { label: "Eş zamanlı", value: pkg.screens },
    { label: "İndirme", value: pkg.downloads },
    { label: "Destek", value: pkg.support },
  ].filter((s) => s.value);
}

interface PackageCardProps {
  pkg: PackageDef;
  isActive: boolean;
  onSelect: (pkg: PackageDef) => void;
}

export default function PackageCard({
  pkg,
  isActive,
  onSelect,
}: PackageCardProps) {
  const specs = packageSpecs(pkg);

  return (
    <div
      className={`package-card${isActive ? " package-card--active" : ""}`}
    >
      <div className="package-card__top">
        <div className="package-card__header">
          <MotionIcon
            name={pkg.icon}
            size={20}
            className="package-icon"
            trigger="hover"
            animation="pop"
          />
          <h3 className="package-name">{pkg.name}</h3>
        </div>
        {isActive ? (
          <span className="package-badge package-badge--active">Mevcut Plan</span>
        ) : (
          pkg.badge && <span className="package-badge">{pkg.badge}</span>
        )}
      </div>

      {pkg.summary && <p className="package-summary">{pkg.summary}</p>}

      <div className="package-price-row">
        <span className="package-price">{pkg.price}</span>
        {pkg.period && <span className="package-period">{pkg.period}</span>}
      </div>

      {specs.length > 0 && (
        <dl className="package-specs">
          {specs.map((s) => (
            <div className="package-spec" key={s.label}>
              <dt>{s.label}</dt>
              <dd>{s.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <ul className="package-features">
        {pkg.features.map((f) => (
          <li key={f}>
            <Check size={15} />
            {f}
          </li>
        ))}
      </ul>

      <Button
        appearance="primary"
        className={`package-cta package-cta--accent${isActive ? " package-cta--active" : ""}`}
        onClick={() => !isActive && onSelect(pkg)}
        disabled={isActive}
        block
      >
        {isActive ? "Aktif Planın" : pkg.cta}
      </Button>
    </div>
  );
}
