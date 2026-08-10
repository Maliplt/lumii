import { useState } from "react";
import { Button } from "rsuite";
import { Check, Lock, ShieldCheck } from "lucide-react";
import { isValidCardNumber, isValidExpiry, isValidCvc, formatCardNumber, formatExpiry, formatCvc } from "../../services/card";
import { processPayment } from "../../services/payment";
import { useAppDispatch, setPlan, setReceipt } from "../../store/store";
import type { PackageDef } from "../../types/types";
import Field from "./Field";

type FieldKey =
  | "cardName"
  | "cardNumber"
  | "expiry"
  | "cvc"
  | "address"
  | "district"
  | "city"
  | "postalCode";

type FormState = Record<FieldKey, string>;
type Errors = Partial<Record<FieldKey | "terms", string>>;

const EMPTY_FORM: FormState = {
  cardName: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
  address: "",
  district: "",
  city: "",
  postalCode: "",
};

export default function CheckoutBody({
  pkg,
  email,
  onSuccess,
}: {
  pkg: PackageDef;
  email: string;
  onSuccess: () => void;
}) {
  const dispatch = useAppDispatch();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [summary, setSummary] = useState("");
  const [paying, setPaying] = useState(false);

  const setField =
    (field: FieldKey, format?: (value: string) => string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = format ? format(e.target.value) : e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
      if (summary) setSummary("");
    };

  const validate = (): Errors => {
    const next: Errors = {};
    if (!form.cardName.trim()) next.cardName = "Kart sahibinin adını girin.";
    if (!isValidCardNumber(form.cardNumber)) next.cardNumber = "Geçerli bir kart numarası girin.";
    if (!isValidExpiry(form.expiry)) next.expiry = "AA/YY formatında girin.";
    if (!isValidCvc(form.cvc)) next.cvc = "3 haneli CVC girin.";
    if (!form.address.trim()) next.address = "Açık adres gerekli.";
    if (!form.city.trim()) next.city = "Şehir gerekli.";
    if (!terms) next.terms = "Kullanıcı sözleşmesini onaylamalısın.";
    return next;
  };

  const handlePay = async () => {
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setSummary("Lütfen belirtilen alanları doldurun.");
      return;
    }
    setErrors({});
    setSummary("");
    setPaying(true);
    const receipt = await processPayment(pkg, email, form, marketing);
    dispatch(setPlan(pkg.id));
    dispatch(setReceipt(receipt));
    onSuccess();
  };

  return (
    <div className="checkout-shell">
      <header className="checkout-head">
        <h1>Ödeme</h1>
        <p>
          <ShieldCheck size={15} />
          Güvenli ödeme
        </p>
      </header>

      <div className="checkout-cols">
        <section className="checkout-form-col">
          <div className="checkout-block">
            <h2 className="checkout-block__title">Kart bilgileri</h2>
            <div className="checkout-grid">
              <Field
                label="Kart sahibi"
                className="checkout-field--full"
                placeholder="Ad Soyad"
                value={form.cardName}
                error={errors.cardName}
                onChange={setField("cardName")}
                autoComplete="cc-name"
              />
              <Field
                label="Kart numarası"
                className="checkout-field--full"
                placeholder="4242 4242 4242 4242"
                value={form.cardNumber}
                error={errors.cardNumber}
                onChange={setField("cardNumber", formatCardNumber)}
                autoComplete="cc-number"
                inputMode="numeric"
                maxLength={19}
              />
              <Field
                label="Son kullanma"
                placeholder="AA/YY"
                value={form.expiry}
                error={errors.expiry}
                onChange={setField("expiry", formatExpiry)}
                autoComplete="cc-exp"
                inputMode="numeric"
                maxLength={5}
              />
              <Field
                label="CVC"
                placeholder="123"
                value={form.cvc}
                error={errors.cvc}
                onChange={setField("cvc", formatCvc)}
                autoComplete="cc-csc"
                inputMode="numeric"
                maxLength={3}
              />
            </div>
          </div>

          <div className="checkout-block">
            <h2 className="checkout-block__title">Fatura adresi</h2>
            <div className="checkout-grid">
              <Field
                label="Açık adres"
                className="checkout-field--full"
                placeholder="Mahalle, cadde, sokak, no"
                value={form.address}
                error={errors.address}
                onChange={setField("address")}
                autoComplete="street-address"
              />
              <Field
                label="İlçe"
                placeholder="İlçe"
                value={form.district}
                onChange={setField("district")}
              />
              <Field
                label="Şehir"
                placeholder="İstanbul"
                value={form.city}
                error={errors.city}
                onChange={setField("city")}
                autoComplete="address-level2"
              />
              <Field
                label="Posta kodu"
                placeholder="34000"
                value={form.postalCode}
                onChange={setField("postalCode")}
                autoComplete="postal-code"
                inputMode="numeric"
                maxLength={5}
              />
              <Field label="Ülke" value="Türkiye" readOnly />
            </div>
          </div>
        </section>

        <aside className="checkout-aside">
          <div className="checkout-summary">
            <span className="checkout-summary__label">Sipariş özeti</span>
            <div className="checkout-summary__plan">
              <strong>{pkg.name} planı</strong>
              {pkg.summary && <p>{pkg.summary}</p>}
            </div>

            <ul className="checkout-summary__features">
              {pkg.features.slice(0, 5).map((f) => (
                <li key={f}>
                  <Check size={14} /> {f}
                </li>
              ))}
            </ul>

            <div className="checkout-summary__total">
              <span>Aylık toplam</span>
              <strong>
                {pkg.price}
                <em>{pkg.period}</em>
              </strong>
            </div>
          </div>

          <div className="checkout-consents">
            <label className="checkout-consent">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => {
                  setTerms(e.target.checked);
                  if (errors.terms) setErrors((p) => ({ ...p, terms: undefined }));
                  if (summary) setSummary("");
                }}
              />
              <span>
                <strong>Kullanıcı sözleşmesini</strong> ve gizlilik politikasını
                okudum, kabul ediyorum.
              </span>
            </label>
            {errors.terms && (
              <small className="checkout-field__error">{errors.terms}</small>
            )}

            <label className="checkout-consent">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
              <span>
                <strong>Yeniliklerden haberdar olmak istiyorum.</strong> Yeni
                içerikler ve kampanyalar e-posta ile gönderilsin.
              </span>
            </label>
          </div>

          <Button
            appearance="primary"
            block
            loading={paying}
            className="checkout-pay"
            onClick={handlePay}
          >
            <Lock size={16} />
            {pkg.price}
            {pkg.period} Öde
          </Button>

          {summary && <p className="checkout-pay-error">{summary}</p>}
        </aside>
      </div>
    </div>
  );
}
