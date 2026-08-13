import { useMemo, useState } from "react";
import { Button } from "rsuite";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CreditCard } from "lucide-react";
import { schedulePlanChange, setPlan, setReceipt, useAppDispatch } from "../../store/store";
import type { CurrentUser, Receipt } from "../../store/authSlice";
import type { PackageDef } from "../../types/types";

function nextBillingDate(): Date {
  const date = new Date();
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  date.setHours(0, 0, 0, 0);
  return date;
}

export default function PlanChangeBody({
  currentUser,
  currentPlan,
  nextPlan,
  onSuccess,
  onCancel,
}: {
  currentUser: CurrentUser;
  currentPlan: PackageDef;
  nextPlan: PackageDef;
  onSuccess: (effectiveAt?: string) => void;
  onCancel: () => void;
}) {
  const dispatch = useAppDispatch();
  const [submitting, setSubmitting] = useState(false);
  const isDowngrade = currentPlan.id === "premium" && nextPlan.id === "standard";
  const effectiveDate = useMemo(() => nextBillingDate(), []);
  const effectiveAt = effectiveDate.toISOString();
  const effectiveLabel = isDowngrade
    ? `${effectiveDate.toLocaleDateString("tr-TR")} tarihinde`
    : "onaydan hemen sonra";

  const confirm = () => {
    setSubmitting(true);
    if (isDowngrade) {
      dispatch(schedulePlanChange({
        planId: nextPlan.id,
        planName: nextPlan.name,
        amount: nextPlan.price,
        period: nextPlan.period,
        effectiveAt,
      }));
      onSuccess(effectiveAt);
      return;
    }

    dispatch(setPlan(nextPlan.id));
    if (currentUser.receipt) {
      const nextReceipt: Receipt = {
        ...currentUser.receipt,
        planId: nextPlan.id,
        planName: nextPlan.name,
        amount: nextPlan.price,
        period: nextPlan.period,
        date: new Date().toLocaleDateString("tr-TR"),
      };
      dispatch(setReceipt(nextReceipt));
    }
    onSuccess();
  };

  return (
    <div className="checkout-card checkout-plan-change">
      <span className="checkout-plan-change__icon" aria-hidden="true">
        <AlertTriangle size={28} />
      </span>
      <p className="checkout-plan-change__eyebrow">Plan değişikliği</p>
      <h1>Değişikliği onayla</h1>
      <div className="checkout-plan-change__route" aria-label="Plan değişikliği özeti">
        <strong>{currentPlan.name}</strong>
        <ArrowRight size={20} />
        <strong>{nextPlan.name}</strong>
      </div>
      <p className="checkout-plan-change__notice">
        {nextPlan.name} planın <strong>{effectiveLabel}</strong> yürürlüğe girecek.
        {isDowngrade
          ? " O tarihe kadar Premium avantajlarını kullanmaya devam edebilirsin."
          : ` Yeni aylık ücretin ${nextPlan.price}${nextPlan.period} olacak.`}
      </p>
      <div className="checkout-plan-change__payment">
        <CreditCard size={18} />
        <span>
          {currentUser.receipt?.paymentMethod
            ? `${currentUser.receipt.paymentMethod} kayıtlı ödeme yöntemin kullanılacak.`
            : "Mevcut aboneliğindeki ödeme yöntemi kullanılacak."}
        </span>
      </div>
      <ul>
        {nextPlan.features.slice(0, 4).map((feature) => (
          <li key={feature}><Check size={15} /> {feature}</li>
        ))}
      </ul>
      <div className="checkout-plan-change__actions">
        <Button appearance="primary" block loading={submitting} onClick={confirm}>
          Plan değişikliğini onayla
        </Button>
        <Button appearance="ghost" block disabled={submitting} onClick={onCancel}>
          <ArrowLeft size={17} /> Vazgeç ve paketlere dön
        </Button>
      </div>
    </div>
  );
}
