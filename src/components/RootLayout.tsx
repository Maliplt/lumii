import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Spinner from "./Spinner";

// kabuk
export default function RootLayout() {
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
