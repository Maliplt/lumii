import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from 'rsuite'
import { Check, Lock, CheckCircle } from 'lucide-react'
import axios from 'axios'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'
import PageLayout from '../components/PageLayout'
import { useToast } from '../components/Toast'
import { useAppSelector, useAppDispatch, setPlan, setReceipt } from '../store/store'
import { PACKAGES } from '../helpers'
import type { PackageDef } from '../types/types'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

async function createIntent(amount: number): Promise<string> {
  const body = new URLSearchParams({ amount: String(amount), currency: 'try' })
  const res = await axios.post('https://api.stripe.com/v1/payment_intents', body, {
    headers: { Authorization: `Bearer ${import.meta.env.VITE_STRIPE_SECRET_KEY}` },
  })
  return res.data.client_secret
}

const CARD_STYLE = {
  style: {
    base: {
      color: '#ffffff',
      fontSize: '15px',
      fontFamily: 'Inter, sans-serif',
      '::placeholder': { color: 'rgba(255,255,255,0.3)' },
    },
    invalid: { color: '#ff8a8a' },
  },
}

interface BillingInfo {
  cardName: string
  address: string
  district: string
  city: string
  postalCode: string
}

function CheckoutForm({ pkg, email, onSuccess }: { pkg: PackageDef; email: string; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const toast = useToast()
  const dispatch = useAppDispatch()
  const [paying, setPaying] = useState(false)

  const [billing, setBilling] = useState<BillingInfo>({
    cardName: '',
    address: '',
    district: '',
    city: '',
    postalCode: '',
  })

  const set = (field: keyof BillingInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setBilling((prev) => ({ ...prev, [field]: e.target.value }))

  const amount = Number(pkg.price.replace(/\D/g, '')) * 100

  const handlePay = async () => {
    if (!stripe || !elements) return
    if (!billing.cardName.trim()) {
      toast('Kart sahibi adını girin.', 'warning')
      return
    }
    setPaying(true)
    try {
      const clientSecret = await createIntent(amount)
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement)!,
          billing_details: {
            name: billing.cardName,
            email,
            address: {
              line1: billing.address,
              city: billing.city,
              postal_code: billing.postalCode,
              country: 'TR',
            },
          },
        },
      })
      if (result.error) {
        toast(result.error.message ?? 'Ödeme başarısız.', 'error')
      } else {
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
      }
    } catch {
      toast('Ödeme başlatılamadı, tekrar dene.', 'error')
    }
    setPaying(false)
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
          value={billing.cardName}
          onChange={set('cardName')}
          autoComplete="cc-name"
        />
      </div>

      <div className="checkout-field">
        <label>Kart Numarası</label>
        <div className="checkout-card-input">
          <CardNumberElement options={{ ...CARD_STYLE, showIcon: true }} />
        </div>
      </div>

      <div className="checkout-field-row">
        <div className="checkout-field">
          <label>Son Kullanma</label>
          <div className="checkout-card-input">
            <CardExpiryElement options={CARD_STYLE} />
          </div>
        </div>
        <div className="checkout-field">
          <label>CVC</label>
          <div className="checkout-card-input">
            <CardCvcElement options={CARD_STYLE} />
          </div>
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
            value={billing.address}
            onChange={set('address')}
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
              value={billing.district}
              onChange={set('district')}
            />
          </div>
          <div className="checkout-field">
            <label>Şehir</label>
            <input
              type="text"
              className="checkout-text-input"
              placeholder="İstanbul"
              value={billing.city}
              onChange={set('city')}
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
              value={billing.postalCode}
              onChange={set('postalCode')}
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
      <p className="checkout-note">stripe test: 4242 4242 4242 4242 · gelecek tarih · herhangi CVC</p>
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

  const currentUser = useAppSelector((s) => s.auth.currentUser)
  const pkg = PACKAGES.find((p) => p.id === planId && !p.free)

  useEffect(() => {
    if (!currentUser) navigate('/login')
    else if (!pkg) navigate('/packages')
  }, [currentUser, pkg, navigate])

  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => navigate('/account'), 3000)
    return () => clearTimeout(t)
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

            <Elements stripe={stripePromise}>
              <CheckoutForm pkg={pkg} email={currentUser.email} onSuccess={() => setSuccess(true)} />
            </Elements>
          </>
        )}
      </div>
    </PageLayout>
  )
}
