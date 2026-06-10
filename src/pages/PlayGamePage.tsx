import { useEffect, useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from 'rsuite'
import { ArrowLeft, Trophy } from 'lucide-react'
import Spinner from '../components/Spinner'

const SudokuApp = lazy(() => import('../games/sudoku'))
const MinesweeperApp = lazy(() => import('../games/minesweep'))
const Game2048 = lazy(() => import('../games/Game2048'))
const KelimeZinciri = lazy(() => import('../games/KelimeZinciri'))

const SCORE_KEYS: Record<string, string> = {
    sudoku: 'sudoku_best_time',
    minesweeper: 'minesweeper_best_time',
    '2048': 'game2048_best_score',
    kelimezinciri: 'kelimezinciri_best',
}

const SCORE_LABELS: Record<string, string> = {
    sudoku: 'En İyi Süre',
    minesweeper: 'En İyi Süre',
    '2048': 'En İyi Skor',
    kelimezinciri: 'En İyi Skor',
}

const IS_SCORE = new Set(['2048', 'kelimezinciri'])

function readBestScore(gameId: string): string {
    const key = SCORE_KEYS[gameId]
    if (!key) return ''
    const raw = localStorage.getItem(key)
    if (!raw) return 'Henüz skor yok'
    const val = parseInt(raw, 10)
    return IS_SCORE.has(gameId)
        ? `${val.toLocaleString('tr-TR')} puan`
        : `${raw} saniye`
}

export default function PlayGamePage() {
    const { gameId } = useParams<{ gameId: string }>()
    const navigate = useNavigate()
    const [bestScore, setBestScore] = useState(() => readBestScore(gameId ?? ''))

    // skoru tazele
    useEffect(() => {
        const update = () => setBestScore(readBestScore(gameId ?? ''))
        const interval = setInterval(update, 2000)
        window.addEventListener('storage', update)
        return () => {
            clearInterval(interval)
            window.removeEventListener('storage', update)
        }
    }, [gameId])

    const scoreLabel = SCORE_LABELS[gameId ?? ''] ?? 'En İyi Skor'

    return (
        <div className="play-game-page">
            <header className="pg-header">
                <Button className="pg-back-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={18} className="pg-back-icon" />
                    Geri Dön
                </Button>
                <div className="pg-score-card">
                    <Trophy size={18} className="pg-score-icon" />
                    <span>{scoreLabel}: <strong>{bestScore}</strong></span>
                </div>
            </header>
            <main className="pg-main-content">
                <Suspense fallback={<Spinner inline />}>
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
