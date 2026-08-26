import { useState, useEffect } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import CheckoutBody from "./checkout/CheckoutBody";
import SuccessScreen from "./checkout/SuccessScreen";
import PlanChangeBody from "./checkout/PlanChangeBody";
import { effectivePlanId, PACKAGES, useProtectedUser } from "../helpers";

export default function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string>();

  const currentUser = useProtectedUser();
  const pkg = PACKAGES.find((p) => p.id === planId && !p.free);
  const currentPlan = PACKAGES.find(
    (item) => item.id === effectivePlanId(currentUser.plan),
  ) ?? PACKAGES[0];
  const isExistingSubscriber = !currentPlan.free;
  const [initialPlanChange] = useState(isExistingSubscriber);

  // hesaba dönüş
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate("/account"), 3000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  if (!pkg) return <Navigate to="/packages" replace />;
  if (currentPlan.id === pkg.id && !success) return <Navigate to="/packages" replace />;

  return (
    <PageLayout className="checkout-page" mainClassName="checkout-main">
      {success ? (
        <div className="checkout-card checkout-card--success">
          <SuccessScreen pkg={pkg} effectiveAt={scheduledFor} planChange={initialPlanChange} />
        </div>
      ) : isExistingSubscriber ? (
        <PlanChangeBody
          currentUser={currentUser}
          currentPlan={currentPlan}
          nextPlan={pkg}
          onCancel={() => navigate("/packages")}
          onSuccess={(effectiveAt) => {
            setScheduledFor(effectiveAt);
            setSuccess(true);
          }}
        />
      ) : (
        <CheckoutBody
          pkg={pkg}
          email={currentUser.email}
          onSuccess={() => setSuccess(true)}
        />
      )}
    </PageLayout>
  );
}
