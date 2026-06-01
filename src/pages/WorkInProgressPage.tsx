import { useNavigate } from 'react-router-dom'
import { Button } from 'rsuite'
import { ArrowLeft } from 'lucide-react'

export default function WorkInProgressPage() {
  const navigate = useNavigate()

  return (
    <div className="wip-container">
      <h1 className="wip-title">
        Work in Progress
      </h1>
      <Button 
        className="btn-play" 
        size="lg" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={18} className="wip-icon" />
        Geri Dön
      </Button>
    </div>
  )
}
