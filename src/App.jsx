import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import InvitationPage from './pages/InvitationPage.jsx'
import VenuePage from './pages/VenuePage.jsx'
import VenuePublicPage from './pages/VenuePublicPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import HomePage from './pages/HomePage.jsx'
import VenueDetailPage from './pages/VenueDetailPage.jsx'
import BookingPage from './pages/BookingPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import OwnerProtectedRoute from './components/owner/OwnerProtectedRoute.jsx'
import OwnerLayout from './layouts/OwnerLayout.jsx'

const OwnerDashboard  = lazy(() => import('./pages/owner/OwnerDashboard.jsx'))
const OwnerVenues     = lazy(() => import('./pages/owner/OwnerVenues.jsx'))
const VenueForm       = lazy(() => import('./pages/owner/VenueForm.jsx'))
const CreateVenuePage = lazy(() => import('./pages/owner/CreateVenuePage.jsx'))
const EditVenuePage   = lazy(() => import('./pages/owner/EditVenuePage.jsx'))
const VenueMenuPage   = lazy(() => import('./pages/owner/VenueMenuPage.jsx'))
const OwnerBookings   = lazy(() => import('./pages/owner/OwnerBookings.jsx'))
const BookingDetail   = lazy(() => import('./pages/owner/BookingDetail.jsx'))
const OwnerFinance    = lazy(() => import('./pages/owner/OwnerFinance.jsx'))
const OwnerInventory  = lazy(() => import('./pages/owner/OwnerInventory.jsx'))
const OwnerHR         = lazy(() => import('./pages/owner/OwnerHR.jsx'))
const OwnerAnalytics  = lazy(() => import('./pages/owner/OwnerAnalytics.jsx'))

function OwnerFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0818' }}>
      <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7C3AED', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}

function OwnerRoute({ children }) {
  return (
    <OwnerProtectedRoute>
      <OwnerLayout>
        <Suspense fallback={<OwnerFallback />}>{children}</Suspense>
      </OwnerLayout>
    </OwnerProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer app */}
        <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/venues/:slug" element={<ProtectedRoute><VenueDetailPage /></ProtectedRoute>} />
        <Route path="/venues/:slug/book" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />

        {/* Public shareable pages */}
        <Route path="/e/:slug" element={<InvitationPage />} />
        <Route path="/p/venues/:slug" element={<VenuePage />} />
        <Route path="/venue/:shareToken" element={<VenuePublicPage />} />

        {/* Owner ERP */}
        <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="/owner/dashboard" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
        <Route path="/owner/venues" element={<OwnerRoute><OwnerVenues /></OwnerRoute>} />
        <Route path="/owner/venues/create" element={<OwnerRoute><CreateVenuePage /></OwnerRoute>} />
        <Route path="/owner/venues/new" element={<OwnerRoute><VenueForm /></OwnerRoute>} />
        <Route path="/owner/venues/:slug/edit" element={<OwnerRoute><EditVenuePage /></OwnerRoute>} />
        <Route path="/owner/venues/:slug/menu" element={<OwnerRoute><VenueMenuPage /></OwnerRoute>} />
        <Route path="/owner/bookings" element={<OwnerRoute><OwnerBookings /></OwnerRoute>} />
        <Route path="/owner/bookings/:id" element={<OwnerRoute><BookingDetail /></OwnerRoute>} />
        <Route path="/owner/finance" element={<OwnerRoute><OwnerFinance /></OwnerRoute>} />
        <Route path="/owner/inventory" element={<OwnerRoute><OwnerInventory /></OwnerRoute>} />
        <Route path="/owner/hr" element={<OwnerRoute><OwnerHR /></OwnerRoute>} />
        <Route path="/owner/analytics" element={<OwnerRoute><OwnerAnalytics /></OwnerRoute>} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
