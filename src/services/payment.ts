import { formatLongDate } from "../lib/utils";
import type { PackageDef } from "../types/types";
import type { Receipt } from "../store/store";

const PAYMENT_DELAY = 1500;

export interface PaymentForm {
  cardNumber: string;
  address: string;
  district: string;
  city: string;
  postalCode: string;
}
// ödeme simülasyonu
export function processPayment(
  pkg: PackageDef,
  email: string,
  form: PaymentForm,
  marketingConsent: boolean,
): Promise<Receipt> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const last4 = form.cardNumber.replace(/\D/g, "").slice(-4);
      const billingAddress = [form.address, form.district, form.city, form.postalCode]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(", ");
      resolve({
        planName: pkg.name,
        planId: pkg.id,
        amount: pkg.price,
        period: pkg.period,
        date: formatLongDate(new Date()),
        email,
        paymentMethod: `•••• ${last4}`,
        billingAddress,
        marketingConsent,
        termsAccepted: true,
      });
    }, PAYMENT_DELAY);
  });
}
