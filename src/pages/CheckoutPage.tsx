import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from 'rsuite'
import { Check, Lock, CheckCircle } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/Toast'
import { isValidCardNumber, isValidExpiry, isValidCvc, formatCardNumber, formatExpiry, formatCvc } from '../services/card'
import { useAppSelector, useAppDispatch, setPlan, setReceipt } from '../store/store'
import { PACKAGES } from '../helpers'
import type { PackageDef } from '../types/types'

const PAYMENT_DELAY = 1500

interface CheckoutFormState {
  cardName: string
  cardNumber: string
  expiry: string
  cvc: string
  address: string
  district: string
  city: string
  postalCode: string
}

const EMPTY_FORM: CheckoutFormState = {
  cardName: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
  address: '',
  district: '',
  city: '',
  postalCode: '',
}

function CheckoutForm({ pkg, email, onSuccess }: { pkg: PackageDef; email: string; onSuccess: () => void }) {
  const toast = useToast()
  const dispatch = useAppDispatch()

  const [form, setForm] = useState<CheckoutFormState>(EMPTY_FORM)
  const [paying, setPaying] = useState(false)

  const setField = (field: keyof CheckoutFormState, format?: (value: string) => string) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: format ? format(e.target.value) : e.target.value }))

  const handlePay = () => {
    if (!form.cardName.trim()) { toast('Lütfen kart üzerindeki adı ve soyadı girin.', 'warning'); return }
    if (!isValidCardNumber(form.cardNumber)) { toast('Lütfen geçerli bir kart numarası girin.', 'error'); return }
    if (!isValidExpiry(form.expiry)) { toast('Lütfen geçerli bir son kullanma tarihi girin.', 'error'); return }
    if (!isValidCvc(form.cvc)) { toast('Lütfen geçerli bir güvenlik kodu (CVC) girin.', 'error'); return }

    setPaying(true)
    setTimeout(() => {
      dispatch(setPlan(pkg.id))
      dispatch(setReceipt({
        planName: pkg.name,
        planId: pkg.id,
        amount: pkg.price,
        period: pkg.period,
        date: new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }),
        email,
      }))
      onSuccess()
    }, PAYMENT_DELAY)
  }

  return (
    <>
      {/* kart bilgileri */}
      <div className="checkout-field">
        <label>Kart Sahibi Adı Soyadı</label>
        <input
          type="text"
          className="checkout-text-input"
          placeholder="Ad Soyad"
          value={form.cardName}
          onChange={setField('cardName')}
          autoComplete="cc-name"
        />
      </div>

      <div className="checkout-field">
        <label>Kart Numarası</label>
        <input
          type="text"
          className="checkout-text-input"
          placeholder="1234 5678 9012 3456"
          value={form.cardNumber}
          onChange={setField('cardNumber', formatCardNumber)}
          autoComplete="cc-number"
          inputMode="numeric"
          maxLength={19}
        />
      </div>

      <div className="checkout-field-row">
        <div className="checkout-field">
          <label>Son Kullanma</label>
          <input
            type="text"
            className="checkout-text-input"
            placeholder="AA/YY"
            value={form.expiry}
            onChange={setField('expiry', formatExpiry)}
            autoComplete="cc-exp"
            inputMode="numeric"
            maxLength={5}
          />
        </div>
        <div className="checkout-field">
          <label>CVC</label>
          <input
            type="text"
            className="checkout-text-input"
            placeholder="123"
            value={form.cvc}
            onChange={setField('cvc', formatCvc)}
            autoComplete="cc-csc"
            inputMode="numeric"
            maxLength={3}
          />
        </div>
      </div>

      {/* fatura adresi */}
      <div className="checkout-billing-section">
        <h4 className="checkout-billing-title">Fatura Adresi</h4>

        <div className="checkout-field">
          <label>Açık Adres</label>
          <input
            type="text"
            className="checkout-text-input"
            placeholder="Mahalle, Cadde, Sokak, No"
            value={form.address}
            onChange={setField('address')}
            autoComplete="street-address"
          />
        </div>

        <div className="checkout-field-row">
          <div className="checkout-field">
            <label>İlçe</label>
            <input
              type="text"
              className="checkout-text-input"
              placeholder="İlçe"
              value={form.district}
              onChange={setField('district')}
            />
          </div>
          <div className="checkout-field">
            <label>Şehir</label>
            <input
              type="text"
              className="checkout-text-input"
              placeholder="İstanbul"
              value={form.city}
              onChange={setField('city')}
              autoComplete="address-level2"
            />
          </div>
        </div>

        <div className="checkout-field-row">
          <div className="checkout-field">
            <label>Posta Kodu</label>
            <input
              type="text"
              className="checkout-text-input"
              placeholder="34000"
              value={form.postalCode}
              onChange={setField('postalCode')}
              autoComplete="postal-code"
              maxLength={5}
            />
          </div>
          <div className="checkout-field">
            <label>Ülke</label>
            <input
              type="text"
              className="checkout-text-input checkout-text-input--readonly"
              value="Türkiye"
              readOnly
            />
          </div>
        </div>
      </div>

      <Button appearance="primary" block loading={paying} className="checkout-pay" onClick={handlePay}>
        <Lock size={15} /> {pkg.price}{pkg.period} Öde
      </Button>
      <p className="checkout-note">test kartı: 4242 4242 4242 4242 · gelecek tarih · 3 haneli CVC</p>
    </>
  )
}

function SuccessScreen({ pkg }: { pkg: PackageDef }) {
  return (
    <div className="checkout-success">
      <div className="checkout-success__icon">
        <CheckCircle size={64} strokeWidth={1.5} />
      </div>
      <h2 className="checkout-success__title">Ödeme Başarılı!</h2>
      <p className="checkout-success__plan">{pkg.name} planın aktif edildi.</p>
      <p className="checkout-success__redirect">Hesabına yönlendiriliyorsun…</p>
      <div className="checkout-success__dots">
        <span /><span /><span />
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const [success, setSuccess] = useState(false)

  // redux
  const currentUser = useAppSelector((s) => s.auth.currentUser)
  const pkg = PACKAGES.find((p) => p.id === planId && !p.free)

  // korumali sayfa
  useEffect(() => {
    if (!currentUser) navigate('/login')
    else if (!pkg) navigate('/packages')
  }, [currentUser, pkg, navigate])

  // odeme sonrasi hesaba don
  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => navigate('/account'), 3000)
    return () => clearTimeout(timer)
  }, [success, navigate])

  if (!currentUser || !pkg) return null

  return (
    <PageLayout className="checkout-page" mainClassName="checkout-main">
      <div className={`checkout-card${success ? ' checkout-card--success' : ''}`}>
        {success ? (
          <SuccessScreen pkg={pkg} />
        ) : (
          <>
            <h1 className="checkout-title">Ödeme</h1>
            <p className="checkout-sub">{currentUser.email} hesabı için</p>

            <div className="checkout-plan">
              <div className="checkout-plan__row">
                <strong>{pkg.name} Plan</strong>
                <span className="checkout-plan__price">{pkg.price}<em>{pkg.period}</em></span>
              </div>
              <ul>
                {pkg.features.map((f) => (
                  <li key={f}><Check size={14} /> {f}</li>
                ))}
              </ul>
            </div>

            <CheckoutForm pkg={pkg} email={currentUser.email} onSuccess={() => setSuccess(true)} />
          </>
        )}
      </div>
    </PageLayout>
  )
}
