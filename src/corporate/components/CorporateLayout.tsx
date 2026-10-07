import { Suspense, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import CorporateHeader from "./CorporateHeader";
import CorporateFooter from "./CorporateFooter";
import "../styles/corporate.scss";

export default function CorporateLayout() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className="corporate-root">
      <CorporateHeader />
      <main style={{ flex: 1 }}>
        <Suspense fallback={<div style={{ padding: "80px", textAlign: "center", color: "#9ca3af" }}>Yükleniyor...</div>}>
          <Outlet />
        </Suspense>
      </main>
      <CorporateFooter />
    </div>
  );
}
