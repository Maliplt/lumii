import { useState, useEffect } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import CheckoutBody from "./checkout/CheckoutBody";
import SuccessScreen from "./checkout/SuccessScreen";
import { PACKAGES, useProtectedUser } from "../helpers";

export default function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const currentUser = useProtectedUser();
  const pkg = PACKAGES.find((p) => p.id === planId && !p.free);

  // hesaba dönüş
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate("/account"), 3000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  if (!pkg) return <Navigate to="/packages" replace />;

  return (
    <PageLayout className="checkout-page" mainClassName="checkout-main">
      {success ? (
        <div className="checkout-card checkout-card--success">
          <SuccessScreen pkg={pkg} />
        </div>
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
