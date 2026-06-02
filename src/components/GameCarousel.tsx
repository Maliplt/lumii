import { Link } from 'react-router-dom'
import sudokuImg from '../images/sudoku.svg'
import minesweepImg from '../images/minesweep.svg'
import game2048Img from '../images/2048.svg'
import kelimezinciriImg from '../images/kelimezinciri.svg'

const GAMES = [
  {
    id: 'sudoku',
    name: 'Sudoku',
    path: '/play/sudoku',
    image: sudokuImg,
    description: 'Zeka ve Mantık Oyunu'
  },
  {
    id: 'minesweeper',
    name: 'Mayın Tarlası',
    path: '/play/minesweeper',
    image: minesweepImg,
    description: 'Klasik Mayın Bulma Oyunu'
  },
  {
    id: '2048',
    name: '2048',
    path: '/play/2048',
    image: game2048Img,
    description: 'Sayıları Birleştir'
  },
  {
    id: 'kelimezinciri',
    name: 'Kelime Zinciri',
    path: '/play/kelimezinciri',
    image: kelimezinciriImg,
    description: 'Zeka ve Hafıza Oyunu'
  }
]

export default function GameCarousel() {
  return (
    <div className="game-carousel">
      <div className="gc-header">
        <div className="gc-header__left">
          <h3>M-Smart Oyunlar</h3>
        </div>
      </div>

      <div className="gc-wrapper">
        <div className="gc-track">
          {GAMES.map((game) => (
            <div key={game.id} className="gc-item">
              <Link to={game.path}>
                <div className="gc-card">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="gc-card__image"
                    loading="lazy"
                  />
                  <div className="gc-card__overlay">
                    <div className="gc-card__details">
                      <h4 className="gc-card__name">{game.name}</h4>
                      <p className="gc-card__desc">{game.description}</p>
                      <span className="gc-card__badge">OYNA</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
