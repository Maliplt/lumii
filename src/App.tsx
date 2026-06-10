import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Spinner from './components/Spinner'
import RootLayout from './components/RootLayout'

const HomePage = lazy(() => import('./pages/HomePage'))
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const PlayGamePage = lazy(() => import('./pages/PlayGamePage'))
const OverviewPage = lazy(() => import('./pages/OverviewPage'))
const SearchPage = lazy(() => import('./pages/SearchPage'))
const WorkInProgressPage = lazy(() => import('./pages/WorkInProgressPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const AccountPage = lazy(() => import('./pages/AccountPage'))
const PackagesPage = lazy(() => import('./pages/PackagesPage'))
const PlayerPage = lazy(() => import('./pages/PlayerPage'))
const TvPage = lazy(() => import('./pages/TvPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))

function App() {
    return (
        <BrowserRouter>
            <Suspense fallback={<Spinner />}>
                <Routes>
                    {/* kabuk */}
                    <Route element={<RootLayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/explore" element={<ExplorePage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/packages" element={<PackagesPage />} />
                        <Route path="/tv" element={<TvPage />} />
                        <Route path="/legal" element={<LegalPage />} />
                        <Route path="/legal/:section" element={<LegalPage />} />
                        <Route path="/account" element={<AccountPage />} />
                        <Route path="/work-in-progress" element={<WorkInProgressPage />} />
                        <Route path="/:type/:id" element={<OverviewPage />} />
                        <Route path="*" element={<WorkInProgressPage />} />
                    </Route>

                    {/* bagimsiz sayfalar */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/play/:gameId" element={<PlayGamePage />} />
                    <Route path="/:type/:id/player" element={<PlayerPage />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    )
}

export default App
