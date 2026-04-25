import { Navigate } from 'react-router-dom'
import { isAuthenticated, getStoredUser } from '../../lib/api'

function canAccessOwnerERP(user) {
  if (!user) return false
  return (
    user.role === 'business_owner' ||
    user.role === 'admin' ||
    user.role === 'superuser' ||
    user.is_staff === true
  )
}

export default function OwnerProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  const user = getStoredUser()
  if (!canAccessOwnerERP(user)) return <Navigate to="/home" replace />
  return children
}
