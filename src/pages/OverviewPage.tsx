import { useParams } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function OverviewPage() {
  const { type: _type, id: _id } = useParams<{ type: 'movie' | 'tv'; id: string }>()

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
      </main>
      <Footer />
    </div>
  )
}
