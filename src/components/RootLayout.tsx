import { Suspense } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Header from "./header/Header";
import Footer from "./Footer";
import ErrorBoundary from "./ErrorBoundary";
import { useAppSelector } from "../store/store";

// kabuk
export default function RootLayout() {
  const location = useLocation();
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const activeProfileId = useAppSelector((s) => s.auth.activeProfileId);

  // kim izliyor
  if (currentUser && !activeProfileId)
    return <Navigate to="/profiles" replace />;

  return (
    <div className="app-shell">
      <Header />
      <ErrorBoundary resetKey={location.pathname}>
        <Suspense fallback={null}>
          <div key={location.pathname} className="route-view">
            <Outlet />
          </div>
        </Suspense>
      </ErrorBoundary>
      <Footer />
    </div>
  );
}
