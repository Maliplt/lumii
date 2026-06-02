import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import PlayGamePage from './pages/PlayGamePage'
import OverviewPage from './pages/OverviewPage'
import WorkInProgressPage from './pages/WorkInProgressPage'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/tv" element={<WorkInProgressPage />} />
                <Route path="/play/:gameId" element={<PlayGamePage />} />
                <Route path="/work-in-progress" element={<WorkInProgressPage />} />
                <Route path="/:type/:id" element={<OverviewPage />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
