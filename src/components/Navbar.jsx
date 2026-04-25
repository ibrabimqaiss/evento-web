import { Link, useNavigate } from 'react-router-dom'
import { isAuthenticated, logout } from '../lib/api'

export default function Navbar() {
  const navigate = useNavigate()
  const authed = isAuthenticated()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/home" className="flex items-center">
          <img src="/evento_logo_color.svg" alt="Evento" style={{ height: 28 }} />
        </Link>
        <div className="flex items-center gap-3">
          {authed ? (
            <>
              <Link
                to="/home"
                className="text-sm text-gray-600 hover:text-primary transition-colors"
              >
                الرئيسية
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                خروج
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-gray-600 hover:text-primary transition-colors"
              >
                دخول
              </Link>
              <Link
                to="/register"
                className="btn btn-primary text-sm py-2 px-4 rounded-lg"
              >
                تسجيل
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
