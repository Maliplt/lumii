import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MoviesPage from './pages/MoviesPage'
import TVShowsPage from './pages/TVShowsPage'
import OverviewPage from './pages/OverviewPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/tv" element={<TVShowsPage />} />
        <Route path="/:type/:id" element={<OverviewPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
