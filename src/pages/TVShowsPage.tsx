import Header from '../components/Header'
import Footer from '../components/Footer'

export default function TVShowsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <p style={{ color: '#888', fontSize: '1.25rem', letterSpacing: '0.05em' }}>
          Work in Progress
        </p>
      </main>
      <Footer />
    </div>
  )
}
