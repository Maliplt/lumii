import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import OverviewPage from './pages/OverviewPage'
import PlayPage from './pages/PlayPage'
import WorkInProgressPage from './pages/WorkInProgressPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<WorkInProgressPage />} />
        <Route path="/tv" element={<WorkInProgressPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="/work-in-progress" element={<WorkInProgressPage />} />
        <Route path="/:type/:id" element={<OverviewPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
