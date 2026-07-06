import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import CheckoutBody from "./checkout/CheckoutBody";
import SuccessScreen from "./checkout/SuccessScreen";
import { PACKAGES } from "../helpers";
import { useAppSelector } from "../store/store";

export default function CheckoutPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  //redux
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const pkg = PACKAGES.find((p) => p.id === planId && !p.free);

  // yönlendirme
  useEffect(() => {
    if (!currentUser) navigate("/login");
    else if (!pkg) navigate("/packages");
  }, [currentUser, pkg, navigate]);

  // hesaba dönüş
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => navigate("/account"), 3000);
    return () => clearTimeout(timer);
  }, [success, navigate]);

  if (!currentUser || !pkg) return null;

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
