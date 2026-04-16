import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import InvitationPage from './pages/InvitationPage.jsx'
import VenuePage from './pages/VenuePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import HomePage from './pages/HomePage.jsx'
import VenueDetailPage from './pages/VenueDetailPage.jsx'
import BookingPage from './pages/BookingPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected app */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/venues/:slug"
          element={
            <ProtectedRoute>
              <VenueDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/venues/:slug/book"
          element={
            <ProtectedRoute>
              <BookingPage />
            </ProtectedRoute>
          }
        />

        {/* Public shareable pages */}
        <Route path="/e/:slug" element={<InvitationPage />} />
        <Route path="/p/venues/:slug" element={<VenuePage />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
