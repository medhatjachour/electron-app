import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function Home(): JSX.Element {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/dashboard', { replace: true })
  }, [navigate])

  return <LoadingSpinner />
}