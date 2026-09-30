import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="notfound-wrap">
      <p className="code">404</p>
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist or has moved.</p>
      <Link to="/">
        <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Home size={16} /> Back to home
        </button>
      </Link>
    </div>
  )
}
