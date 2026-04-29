import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json', 'Accept-Language': 'ar' },
})

// ─── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response interceptor: auto-refresh on 401 ───────────────────────────────
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

function clearAuthAndRedirect() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  window.location.href = '/login'
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status

    // Only attempt refresh on 401 and only once per request
    if (status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    // If already refreshing, queue this request until refresh completes
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }).catch((err) => Promise.reject(err))
    }

    original._retry = true
    isRefreshing = true

    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
      isRefreshing = false
      processQueue(error)
      clearAuthAndRedirect()
      return Promise.reject(error)
    }

    try {
      // Use a plain axios call to avoid the interceptor loop
      const res = await axios.post(`${BASE_URL}/auth/token/refresh/`, { refresh: refreshToken })
      const data = res.data?.data ?? res.data
      const newAccess = data.access
      const newRefresh = data.refresh

      localStorage.setItem('access_token', newAccess)
      if (newRefresh) localStorage.setItem('refresh_token', newRefresh)

      api.defaults.headers.common.Authorization = `Bearer ${newAccess}`
      processQueue(null, newAccess)

      original.headers.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError)
      clearAuthAndRedirect()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

// ─── Events / RSVP (public) ───────────────────────────────────────────────────

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

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function login(phone, password) {
  const res = await api.post('/auth/login/', { phone_number: phone, password })
  const data = res.data?.data ?? res.data
  // Backend returns: { tokens: { access, refresh }, user }
  const tokens = data.tokens ?? {}
  const access = tokens.access ?? data.access
  const refresh = tokens.refresh ?? data.refresh

  if (!access) throw new Error('No access token in login response')

  localStorage.setItem('access_token', access)
  if (refresh) localStorage.setItem('refresh_token', refresh)
  if (data.user) localStorage.setItem('user', JSON.stringify(data.user))

  return res.data
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

export function isAuthenticated() {
  const token = localStorage.getItem('access_token')
  return !!token && token !== 'undefined' && token !== 'null'
}

export async function register(payload) {
  const { phone, ...rest } = payload
  const res = await api.post('/auth/register/', { ...rest, phone_number: phone })
  return res.data
}

export async function sendOtp(phone) {
  const res = await api.post('/auth/send-otp/', { phone_number: phone })
  return res.data
}

export async function verifyOtp(phone, otp) {
  const res = await api.post('/auth/verify-otp/', { phone_number: phone, otp })
  return res.data
}

export function logout() {
  const refresh = localStorage.getItem('refresh_token')
  if (refresh && refresh !== 'undefined') {
    api.post('/auth/logout/', { refresh }).catch(() => {})
  }
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
}

// ─── Venues ───────────────────────────────────────────────────────────────────

export function searchVenues(params = {}) {
  return api.get('/venues/search/', { params })
}

export function getVenueDetail(slug) {
  return api.get(`/venues/p/${slug}/`)
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export function createBooking(payload) {
  return api.post('/bookings/', payload)
}

export function getMyBookings() {
  return api.get('/bookings/my/')
}

export default api
