import { Outlet, useLocation, useNavigate } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isAuthRoute = location.pathname === '/' || location.pathname === '/signup'

  function handleLogout() {
    // TODO: clear auth state / tokens
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-yellow-50 text-yellow-900">
      {!isAuthRoute && (
        <header className="bg-yellow-200 border-b border-yellow-300">
          <div className="max-w-6xl mx-auto px-4 py-3 flex justify-end">
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded"
            >
              Logout
            </button>
          </div>
        </header>
      )}

      <main className="max-w-6xl mx-auto p-4">
        <Outlet />
      </main>
    </div>
  )
}
