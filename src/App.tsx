import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Routes, Route, useLocation } from "react-router-dom";
import Spinner from "./components/Spinner";
import RootLayout from "./components/RootLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import PlayerPage from "./pages/PlayerPage";
import NotFoundPage from "./pages/NotFoundPage";

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

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppRoutes() {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary resetKey={pathname}>
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<HomePage />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
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
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
