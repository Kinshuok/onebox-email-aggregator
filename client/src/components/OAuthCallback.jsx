import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export default function OAuthCallback() {
  const [params] = useSearchParams()
  useEffect(() => {
    // simply redirect to server endpoint
    window.location.href = '/oauth2callback?' + params.toString()
  }, [params])

  return <p>Connecting...</p>
}
