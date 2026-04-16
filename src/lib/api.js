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

export default api
