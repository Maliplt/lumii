import { Panel } from 'rsuite'
import { Link } from 'react-router-dom'
import { getImageUrl } from '../services/tmdb'

interface ContentCardProps {
  id: number
  type: 'movie' | 'tv'
  title: string
  posterPath: string | null
  rating: number
  date: string
  overview?: string
}

export default function ContentCard({
  id,
  type,
  title,
  posterPath,
  rating,
  date,
  overview,
}: ContentCardProps) {
  return (
    <Link to={`/${type}/${id}`}>
      <Panel bordered>
        <img
          src={getImageUrl(posterPath, 'w300')}
          alt={title}
          width={300}
        />
        <div>
          <strong>{title}</strong>
          <p>* {rating.toFixed(1)}</p>
          <p>{date}</p>
          {overview && <p>{overview}</p>}
        </div>
      </Panel>
    </Link>
  )
}
