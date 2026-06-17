import { Suspense } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Spinner from "./Spinner";
import { useAppSelector } from "../store/store";

// kabuk
export default function RootLayout() {
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const activeProfileId = useAppSelector((s) => s.auth.activeProfileId);

  // girisli ama profil secilmemis -> kim izliyor
  if (currentUser && !activeProfileId)
    return <Navigate to="/profiles" replace />;

  return (
    <div className="app-shell">
      <Header />
      <Suspense fallback={<Spinner inline />}>
        <Outlet />
      </Suspense>
      <Footer />
    </div>
  );
}
