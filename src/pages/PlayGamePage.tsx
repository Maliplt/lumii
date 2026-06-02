import { useEffect, useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from 'rsuite'
import { ArrowLeft, Trophy } from 'lucide-react'
import Spinner from '../components/Spinner'

const SudokuApp = lazy(() => import('../games/sudoku'))
const MinesweeperApp = lazy(() => import('../games/minesweep'))
const Game2048 = lazy(() => import('../games/Game2048'))
const KelimeZinciri = lazy(() => import('../games/KelimeZinciri'))

export default function PlayGamePage() {
    const { gameId } = useParams<{ gameId: string }>()
    const navigate = useNavigate()
    const [bestScore, setBestScore] = useState<string | null>(null)

    useEffect(() => {
        const updateScore = () => {
            if (gameId === 'sudoku') {
                const score = localStorage.getItem('sudoku_best_time')
                setBestScore(score ? `${score} saniye` : 'Henüz skor yok')
            } else if (gameId === 'minesweeper') {
                const score = localStorage.getItem('minesweeper_best_time')
                setBestScore(score ? `${score} saniye` : 'Henüz skor yok')
            } else if (gameId === '2048') {
                const score = localStorage.getItem('game2048_best_score')
                setBestScore(score ? `${parseInt(score, 10).toLocaleString('tr-TR')} puan` : 'Henüz skor yok')
            } else if (gameId === 'kelimezinciri') {
                const score = localStorage.getItem('kelimezinciri_best')
                setBestScore(score ? `${parseInt(score, 10).toLocaleString('tr-TR')} puan` : 'Henüz skor yok')
            }
        }
        updateScore()
        const interval = setInterval(updateScore, 1000)
        return () => clearInterval(interval)
    }, [gameId])

    return (
        <div className="play-game-page">
            <header className="pg-header">
                <Button className="pg-back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={18} className="pg-back-icon" />
                    Geri Dön
                </Button>
                <div className="pg-score-card">
                    <Trophy size={18} className="pg-score-icon" />
                    <span>{['2048', 'kelimezinciri'].includes(gameId ?? '') ? 'En İyi Skor' : 'En İyi Süre'}: <strong>{bestScore}</strong></span>
                </div>
            </header>
            <main className="pg-main-content">
                <Suspense fallback={<Spinner />}>
                    {gameId === 'sudoku' ? (
                        <SudokuApp />
                    ) : gameId === 'minesweeper' ? (
                        <MinesweeperApp />
                    ) : gameId === '2048' ? (
                        <Game2048 />
                    ) : gameId === 'kelimezinciri' ? (
                        <KelimeZinciri />
                    ) : (
                        <div className="pg-error">Oyun bulunamadı.</div>
                    )}
                </Suspense>
            </main>
        </div>
    )
}
