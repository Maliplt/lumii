import { CheckCircle } from "lucide-react";
import type { PackageDef } from "../../types/types";

export default function SuccessScreen({
  pkg,
  effectiveAt,
  planChange = false,
}: {
  pkg: PackageDef;
  effectiveAt?: string;
  planChange?: boolean;
}) {
  return (
    <div className="checkout-success">
      <div className="checkout-success__icon">
        <CheckCircle size={64} strokeWidth={1.5} />
      </div>
      <h2 className="checkout-success__title">
        {planChange ? "Plan değişikliği onaylandı" : "Ödeme Başarılı!"}
      </h2>
      <p className="checkout-success__plan">
        {effectiveAt
          ? `${pkg.name} planın ${new Date(effectiveAt).toLocaleDateString("tr-TR")} tarihinde başlayacak.`
          : `${pkg.name} planın aktif edildi.`}
      </p>
      <p className="checkout-success__redirect">Hesabına yönlendiriliyorsun…</p>
      <div className="checkout-success__dots">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
