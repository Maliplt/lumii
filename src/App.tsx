import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Spinner from "./components/ui/Spinner";
import RootLayout from "./components/layout/RootLayout";
import ErrorBoundary from "./components/feedback/ErrorBoundary";
import ProtectedRoute from "./components/access/ProtectedRoute";
import TrailerPreviewProvider from "./components/media/TrailerPreviewProvider";

const HomePage = lazy(() => import("./pages/HomePage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const PlayGamePage = lazy(() => import("./pages/PlayGamePage"));
const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ProfilesPage = lazy(() => import("./pages/ProfilesPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const PackagesPage = lazy(() => import("./pages/PackagesPage"));
const TvPage = lazy(() => import("./pages/TvPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const PlayerPage = lazy(() => import("./pages/PlayerPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// tenett kurumsal site
const CorporateLayout = lazy(() => import("./corporate/components/CorporateLayout"));
const CorporateHomePage = lazy(() => import("./corporate/pages/CorporateHomePage"));
const CorporateAboutPage = lazy(() => import("./corporate/pages/CorporateAboutPage"));
const CorporateProjectPage = lazy(() => import("./corporate/pages/CorporateProjectPage"));
const CorporateAiPage = lazy(() => import("./corporate/pages/CorporateAiPage"));
const CorporateContactPage = lazy(() => import("./corporate/pages/CorporateContactPage"));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const { pathname } = useLocation();
  const isPlayerRoute = /^\/(movie|tv)\/\d+\/player\/?$/.test(pathname);
  return (
    <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={isPlayerRoute ? null : <Spinner />}>
        <Routes>
          {/* Tenett Kurumsal Şirket Web Sitesi (Ana Sayfa) */}
          <Route element={<CorporateLayout />}>
            <Route path="/" element={<CorporateHomePage />} />
            <Route path="/hakkimizda" element={<CorporateAboutPage />} />
            <Route path="/tenet" element={<CorporateProjectPage />} />
            <Route path="/yapay-zeka" element={<CorporateAiPage />} />
            <Route path="/iletisim" element={<CorporateContactPage />} />

            {/* Alternatif / İngilizce / Eski alias rotalar */}
            <Route path="/about" element={<CorporateAboutPage />} />
            <Route path="/products" element={<CorporateProjectPage />} />
            <Route path="/investors" element={<CorporateAboutPage />} />
            <Route path="/ai" element={<CorporateAiPage />} />
            <Route path="/contact" element={<CorporateContactPage />} />
            <Route path="/kurumsal" element={<Navigate to="/" replace />} />
            <Route path="/kurumsal/*" element={<Navigate to="/" replace />} />
          </Route>

          {/* Tenet Medya & Eğlence Platformu */}
          <Route element={<RootLayout />}>
            <Route path="/app" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/packages" element={<PackagesPage />} />
            <Route path="/tv" element={<TvPage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/legal/:section" element={<LegalPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/account" element={<AccountPage />} />
              <Route path="/checkout/:planId" element={<CheckoutPage />} />
            </Route>
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="/:type/:id" element={<OverviewPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/profiles" element={<ProfilesPage />} />
          </Route>
          <Route path="/play/:gameId" element={<PlayGamePage />} />
          <Route path="/:type/:id/player" element={<PlayerPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}


function App() {
  return (
    <TrailerPreviewProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppRoutes />
      </BrowserRouter>
    </TrailerPreviewProvider>
  );
}

export default App;
