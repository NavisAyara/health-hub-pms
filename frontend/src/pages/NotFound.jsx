import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-yellow-800 mb-2">404 — Not Found</h1>
        <p className="text-gray-700 mb-4">The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-block bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">Go to Login</Link>
      </div>
    </div>
  )
}
