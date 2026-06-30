import { useState } from "react";
import { Button, Input, Modal, Toggle } from "rsuite";
import { X } from "lucide-react";
import {
  formatCardNumber,
  formatCvc,
  formatExpiry,
  isValidCardNumber,
  isValidCvc,
  isValidExpiry,
} from "../../services/card";
import type { Receipt } from "../../store/store";

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

    const last4 = cardNumber.replace(/\D/g, "").slice(-4);
    onSave({
      paymentMethod: `•••• ${last4}`,
      billingAddress: billingAddress.trim(),
      email: billingEmail.trim(),
      marketingConsent,
    });
  };

  return (
    <Modal open onClose={onClose} size="md" className="profile-modal payment-method-modal">
      <div className="profile-modal__head">
        <button
          type="button"
          className="profile-modal__close"
          onClick={onClose}
          aria-label="Kapat"
        >
          <X size={22} />
        </button>
      </div>

      <Modal.Body>
        <div className="email-modal__hero">
          <h2>Ödeme yöntemi</h2>
          <p>Kart ve fatura bilgilerini güncelle.</p>
        </div>

        {receipt?.paymentMethod && (
          <div className="payment-method-current">
            <span>Mevcut kart</span>
            <strong>{receipt.paymentMethod}</strong>
          </div>
        )}

        <div className="payment-method-grid">
          <label className="profile-edit__field" htmlFor="payment-card-name">
            <span>Kart sahibi</span>
            <Input
              id="payment-card-name"
              value={cardName}
              placeholder="Ad Soyad"
              onChange={(value) => {
                setCardName(value);
                if (error) setError("");
              }}
            />
          </label>
          <label className="profile-edit__field" htmlFor="payment-card-number">
            <span>Kart numarası</span>
            <Input
              id="payment-card-number"
              value={cardNumber}
              placeholder="4242 4242 4242 4242"
              inputMode="numeric"
              maxLength={19}
              onChange={(value) => {
                setCardNumber(formatCardNumber(value));
                if (error) setError("");
              }}
            />
          </label>
          <label className="profile-edit__field" htmlFor="payment-expiry">
            <span>Son kullanma</span>
            <Input
              id="payment-expiry"
              value={expiry}
              placeholder="AA/YY"
              inputMode="numeric"
              maxLength={5}
              onChange={(value) => {
                setExpiry(formatExpiry(value));
                if (error) setError("");
              }}
            />
          </label>
          <label className="profile-edit__field" htmlFor="payment-cvc">
            <span>CVC</span>
            <Input
              id="payment-cvc"
              value={cvc}
              placeholder="123"
              inputMode="numeric"
              maxLength={3}
              onChange={(value) => {
                setCvc(formatCvc(value));
                if (error) setError("");
              }}
            />
          </label>
        </div>

        <label className="profile-edit__field" htmlFor="payment-address">
          <span>Fatura adresi</span>
          <Input
            id="payment-address"
            value={billingAddress}
            placeholder="Mahalle, cadde, şehir"
            onChange={(value) => {
              setBillingAddress(value);
              if (error) setError("");
            }}
          />
        </label>

        <label className="profile-edit__field" htmlFor="payment-email">
          <span>Fatura e-postası</span>
          <Input
            id="payment-email"
            value={billingEmail}
            type="email"
            onChange={(value) => {
              setBillingEmail(value);
              if (error) setError("");
            }}
          />
        </label>

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
      </Modal.Body>

      <Modal.Footer>
        <div className="profile-edit__footer">
          <Button appearance="primary" onClick={save} block>
            Ödeme Yöntemini Kaydet
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
