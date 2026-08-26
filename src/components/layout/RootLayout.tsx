import { Suspense } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Header from "../header/Header";
import Footer from "./Footer";
import ErrorBoundary from "../feedback/ErrorBoundary";
import Spinner from "../ui/Spinner";
import { useAppSelector } from "../../store/store";

// kabuk
export default function RootLayout() {
  const location = useLocation();
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const activeProfileId = useAppSelector((s) => s.auth.activeProfileId);

  // kim izliyor
  if (currentUser && !activeProfileId) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/profiles" replace state={{ returnTo }} />;
  }

  return (
    <div className="app-shell">
      <Header />
      <ErrorBoundary resetKey={location.pathname}>
        <Suspense
          fallback={
            <div className="route-view">
              <Spinner inline />
            </div>
          }
        >
          <div key={location.pathname} className="route-view">
            <Outlet />
          </div>
        </Suspense>
      </ErrorBoundary>
      <Footer />
    </div>
  );
}
