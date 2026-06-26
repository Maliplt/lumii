import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Spinner from "./components/Spinner";
import RootLayout from "./components/RootLayout";

const HomePage = lazy(() => import("./pages/HomePage"));
const ExplorePage = lazy(() => import("./pages/ExplorePage"));
const PlayGamePage = lazy(() => import("./pages/PlayGamePage"));
const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const WorkInProgressPage = lazy(() => import("./pages/WorkInProgressPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ProfilesPage = lazy(() => import("./pages/ProfilesPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const PackagesPage = lazy(() => import("./pages/PackagesPage"));
const PlayerPage = lazy(() => import("./pages/PlayerPage"));
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

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
            <Route path="/account" element={<AccountPage />} />
            <Route path="/checkout/:planId" element={<CheckoutPage />} />
            <Route path="/work-in-progress" element={<WorkInProgressPage />} />
            <Route path="/:type/:id" element={<OverviewPage />} />
            <Route path="*" element={<WorkInProgressPage />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profiles" element={<ProfilesPage />} />
          <Route path="/play/:gameId" element={<PlayGamePage />} />
          <Route path="/:type/:id/player" element={<PlayerPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
