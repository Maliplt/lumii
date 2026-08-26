import { Button } from "rsuite";
import { Check } from "lucide-react";
import { SectionIntro, SummaryBlock, SummaryRow } from "../AccountUI";
import { formatPlan } from "../accountData";
import type { BasicUser, Plan } from "./accountTabTypes";

export default function MembershipTab({
  user,
  plan,
  paymentMethod,
  billingAddress,
  billingEmail,
  onSeePlans,
  onUpdatePayment,
}: {
  user: BasicUser;
  plan: Plan;
  paymentMethod?: string;
  billingAddress?: string;
  billingEmail?: string;
  onSeePlans: () => void;
  onUpdatePayment: () => void;
}) {
  const renewal = plan.free
    ? "Ücretsiz - yenileme yok"
    : `${plan.price}${plan.period} · otomatik yenilenir`;
  return (
    <section className="acct-section">
      <SectionIntro>Abonelik, faturalandırma ve erişim bilgileri.</SectionIntro>

      <div className="acct-overview-grid">
        <SummaryBlock>
          <SummaryRow
            label="Aktif plan"
            value={formatPlan(plan)}
            action={
              <Button appearance="primary" size="sm" onClick={onSeePlans}>
                Planları Gör
              </Button>
            }
          />
          <SummaryRow label="Üyelik başlangıcı" value={user.createdAt ?? "Bugün"} />
          <SummaryRow label="Sonraki yenileme" value={renewal} />
          {user.pendingPlanChange && (
            <SummaryRow
              label="Plan değişikliği"
              value={`${user.pendingPlanChange.planName} · ${new Date(user.pendingPlanChange.effectiveAt).toLocaleDateString("tr-TR")} tarihinde`}
            />
          )}
          <SummaryRow label="Görüntü kalitesi" value={plan.quality ?? "SD 480p"} />
          <SummaryRow label="Eş zamanlı ekran" value={plan.screens ?? "1 ekran"} />
        </SummaryBlock>

        <SummaryBlock>
          <SummaryRow
            label="Ödeme yöntemi"
            value={paymentMethod ?? "Tanımlı değil"}
            action={
              <Button appearance="ghost" size="sm" onClick={onUpdatePayment}>
                {paymentMethod ? "Güncelle" : "Ekle"}
              </Button>
            }
          />
          <SummaryRow label="Fatura adresi" value={billingAddress ?? "Eklenmedi"} />
          <SummaryRow label="Fatura e-postası" value={billingEmail ?? user.email} />
        </SummaryBlock>
      </div>

      <div className="acct-feature-block">
        <h3>Plan kapsamı</h3>
        <ul>
          {plan.features.map((feature) => (
            <li key={feature}>
              <Check size={16} />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
