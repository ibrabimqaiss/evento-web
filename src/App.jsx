import { BrowserRouter, Routes, Route } from 'react-router-dom'
import InvitationPage from './pages/InvitationPage.jsx'
import VenuePage from './pages/VenuePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/e/:slug" element={<InvitationPage />} />
        <Route path="/venues/:slug" element={<VenuePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
