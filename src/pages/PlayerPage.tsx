import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import MediaPlayer from '../components/MediaPlayer'
import { getStreamSource } from '../services/player'
import { tmdbApi } from '../services/tmdb'
import { useAppDispatch, useAppSelector, startWatching, type SavedItem } from '../store/store'
import type { MovieDetail, TVShowDetail } from '../types/types'

export default function PlayerPage() {
  const { type, id } = useParams<{ type: string; id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  // redux
  const dispatch = useAppDispatch()
  const isLoggedIn = useAppSelector((s) => !!s.auth.currentUser)
  const autoplay = useAppSelector((s) => s.settings.autoplay)

  const [title, setTitle] = useState((location.state as { title?: string } | null)?.title ?? '')

  // baslik + izlemeye devam et kaydi
  useEffect(() => {
    if (!type || !id) return
    const numId = Number(id)
    const fetcher = type === 'movie' ? tmdbApi.getMovieDetail(numId) : tmdbApi.getTVShowDetail(numId)
    fetcher.then((d) => {
      setTitle(type === 'movie' ? (d as MovieDetail).title : (d as TVShowDetail).name)
      if (isLoggedIn) {
        dispatch(startWatching({ ...d, media_type: type as 'movie' | 'tv' } as SavedItem))
      }
    }).catch(() => {})
  }, [type, id, isLoggedIn, dispatch])

  return (
    <div className="player-page">
      <MediaPlayer
        src={getStreamSource(type, id)}
        title={title}
        autoPlay={autoplay}
        onBack={() => navigate(-1)}
      />
    </div>
  )
}
