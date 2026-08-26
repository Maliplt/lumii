import { useState } from "react";
import { Button, Toggle } from "rsuite";
import ModalHero from "./ModalHero";
import { formatCardNumber, formatCvc, formatExpiry, isValidCardNumber, isValidCvc, isValidExpiry } from "../../services/card";
import { isValidEmail } from "../../lib/utils";
import type { Receipt } from "../../store/store";
import ModalInputField from "./ModalInputField";
import ProfileModalShell from "./ProfileModalShell";

interface Props {
  email: string;
  receipt?: Receipt | null;
  onClose: () => void;
  onSave: (data: {
    paymentMethod: string;
    billingAddress: string;
    email: string;
    marketingConsent: boolean;
  }) => void;
}

export default function PaymentMethodModal({
  email,
  receipt,
  onClose,
  onSave,
}: Props) {
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [billingAddress, setBillingAddress] = useState(receipt?.billingAddress ?? "");
  const [billingEmail, setBillingEmail] = useState(receipt?.email ?? email);
  const [marketingConsent, setMarketingConsent] = useState(!!receipt?.marketingConsent);
  const [error, setError] = useState("");

  const save = () => {
    if (!cardName.trim()) {
      setError("Kart üzerindeki ad soyad gerekli.");
      return;
    }
    if (!isValidCardNumber(cardNumber)) {
      setError("Geçerli bir kart numarası gir.");
      return;
    }
    if (!isValidExpiry(expiry)) {
      setError("Son kullanma tarihini AA/YY formatında gir.");
      return;
    }
    if (!isValidCvc(cvc)) {
      setError("CVC 3 haneli olmalı.");
      return;
    }
    if (!billingAddress.trim()) {
      setError("Fatura adresi gerekli.");
      return;
    }
    if (!isValidEmail(billingEmail)) {
      setError("Geçerli bir fatura e-postası gir.");
      return;
    }

    const last4 = cardNumber.replace(/\D/g, "").slice(-4);
    onSave({
      paymentMethod: `•••• ${last4}`,
      billingAddress: billingAddress.trim(),
      email: billingEmail.trim(),
      marketingConsent,
    });
  };

  return (
    <ProfileModalShell
      className="payment-method-modal"
      size="md"
      onClose={onClose}
      footer={
        <Button appearance="primary" onClick={save} block>
          Ödeme Yöntemini Kaydet
        </Button>
      }
    >
        <ModalHero
          className="email-modal__hero"
          title="Ödeme yöntemi"
          description="Kart ve fatura bilgilerini güncelle."
        />

        {receipt?.paymentMethod && (
          <div className="payment-method-current">
            <span>Mevcut kart</span>
            <strong>{receipt.paymentMethod}</strong>
          </div>
        )}

        <div className="payment-method-grid">
          <ModalInputField
            id="payment-card-name"
            label="Kart sahibi"
            value={cardName}
            placeholder="Ad Soyad"
            onChange={(value) => {
              setCardName(value);
              if (error) setError("");
            }}
          />
          <ModalInputField
            id="payment-card-number"
            label="Kart numarası"
            value={cardNumber}
            placeholder="4242 4242 4242 4242"
            inputMode="numeric"
            maxLength={19}
            onChange={(value) => {
              setCardNumber(formatCardNumber(value));
              if (error) setError("");
            }}
          />
          <ModalInputField
            id="payment-expiry"
            label="Son kullanma"
            value={expiry}
            placeholder="AA/YY"
            inputMode="numeric"
            maxLength={5}
            onChange={(value) => {
              setExpiry(formatExpiry(value));
              if (error) setError("");
            }}
          />
          <ModalInputField
            id="payment-cvc"
            label="CVC"
            value={cvc}
            placeholder="123"
            inputMode="numeric"
            maxLength={3}
            onChange={(value) => {
              setCvc(formatCvc(value));
              if (error) setError("");
            }}
          />
        </div>

        <ModalInputField
          id="payment-address"
          label="Fatura adresi"
          value={billingAddress}
          placeholder="Mahalle, cadde, şehir"
          onChange={(value) => {
            setBillingAddress(value);
            if (error) setError("");
          }}
        />

        <ModalInputField
          id="payment-email"
          label="Fatura e-postası"
          value={billingEmail}
          type="email"
          onChange={(value) => {
            setBillingEmail(value);
            if (error) setError("");
          }}
        />

        <div className="profile-edit__kid-toggle payment-method-toggle">
          <div>
            <strong>Yeniliklerden haberdar olmak istiyorum</strong>
            <span>Yeni içerikler, kampanyalar ve üyelik bildirimleri gönderilsin.</span>
          </div>
          <Toggle
            checked={marketingConsent}
            onChange={setMarketingConsent}
            className="profile-rsuite-toggle"
            aria-label="Yeniliklerden haberdar olmak istiyorum"
          />
        </div>

        {error && <small className="lock-modal__error">{error}</small>}
    </ProfileModalShell>
  );
}
