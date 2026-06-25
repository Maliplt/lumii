import { Suspense } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import { useAppSelector } from "../store/store";

// kabuk
export default function RootLayout() {
  const location = useLocation();
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const activeProfileId = useAppSelector((s) => s.auth.activeProfileId);

  //  kim izliyor
  if (currentUser && !activeProfileId)
    return <Navigate to="/profiles" replace />;

  return (
    <div className="app-shell">
      <Header />
      <Suspense fallback={null}>
        <div key={location.pathname} className="route-view">
          <Outlet />
        </div>
      </Suspense>
      <Footer />
    </div>
  );
}
