import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', 'Accept-Language': 'ar' },
})

// Attach JWT token from localStorage if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export function getPublicEvent(slug) {
  return api.get(`/p/events/${slug}/`)
}

export function submitRSVP(slug, { rsvpStatus, plusOnes }) {
  return api.post(`/p/events/${slug}/rsvp/`, {
    rsvp_status: rsvpStatus,
    plus_ones: plusOnes,
  })
}

export function getPublicVenue(slug) {
  return api.get(`/venues/p/${slug}/`)
}

export function isAuthenticated() {
  return !!localStorage.getItem('access_token')
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(phone, password) {
  const res = await api.post('/auth/login/', { phone, password })
  const { access, refresh } = res.data?.data ?? res.data
  localStorage.setItem('access_token', access)
  if (refresh) localStorage.setItem('refresh_token', refresh)
  return res.data
}

export async function register(payload) {
  const res = await api.post('/auth/register/', payload)
  return res.data
}

export async function sendOtp(phone) {
  const res = await api.post('/auth/send-otp/', { phone })
  return res.data
}

export async function verifyOtp(phone, otp) {
  const res = await api.post('/auth/verify-otp/', { phone, otp })
  return res.data
}

export function logout() {
  const refresh = localStorage.getItem('refresh_token')
  if (refresh) api.post('/auth/logout/', { refresh }).catch(() => {})
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
}

// ─── Venues ───────────────────────────────────────────────────────────────────

export function searchVenues(params = {}) {
  return api.get('/venues/', { params })
}

export function getVenueDetail(slug) {
  return api.get(`/venues/${slug}/`)
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export function createBooking(payload) {
  return api.post('/bookings/', payload)
}

export function getMyBookings() {
  return api.get('/bookings/my/')
}

export default api
