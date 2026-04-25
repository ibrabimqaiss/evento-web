import { Navigate } from 'react-router-dom'
import { isAuthenticated, getStoredUser } from '../../lib/api'

export default function OwnerProtectedRoute({ children }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />
  const user = getStoredUser()
  if (!user || user.role !== 'business_owner') return <Navigate to="/home" replace />
  return children
}
