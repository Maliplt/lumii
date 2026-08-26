import { Button } from "rsuite";
import { SectionIntro, SummaryBlock, SummaryRow } from "../AccountUI";
import type { BasicUser } from "./accountTabTypes";

export default function BillingTab({
  user,
  paymentMethod,
  billingAddress,
  billingEmail,
  lastAmount,
  lastDate,
  marketingConsent,
  onUpdatePayment,
}: {
  user: BasicUser;
  paymentMethod?: string;
  billingAddress?: string;
  billingEmail?: string;
  lastAmount?: string;
  lastDate?: string;
  marketingConsent?: boolean;
  onUpdatePayment: () => void;
}) {
  const hasReceipt = !!(paymentMethod || lastAmount || billingAddress);
  return (
    <section className="acct-section">
      <SectionIntro>Ödeme yöntemi ve fatura bilgileri.</SectionIntro>

      <SummaryBlock>
        <SummaryRow
          label="Ödeme yöntemi"
          value={paymentMethod ?? (hasReceipt ? "Kart ile ödeme" : "Ödeme yöntemi yok")}
          action={
            <Button appearance="primary" size="sm" onClick={onUpdatePayment}>
              {paymentMethod ? "Güncelle" : "Kart Ekle"}
            </Button>
          }
        />
        <SummaryRow label="Fatura adresi" value={billingAddress ?? "Eklenmedi"} />
        <SummaryRow
          label="Son işlem"
          value={lastAmount ? lastAmount : "Kayıt yok"}
        >
          {lastDate && <small className="acct-row__note">{lastDate}</small>}
        </SummaryRow>
        <SummaryRow label="Fatura e-postası" value={billingEmail ?? user.email} />
        <SummaryRow
          label="Pazarlama bildirimleri"
          value={marketingConsent ? "Açık" : "Kapalı"}
        />
      </SummaryBlock>
    </section>
  );
}
