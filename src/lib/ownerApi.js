import api from './api'

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats = () => api.get('/owner/dashboard/stats/')

// ─── Venues ───────────────────────────────────────────────────────────────────
export const getOwnerVenues = () => api.get('/owner/venues/')
export const createVenue = (data) => api.post('/venues/', data)
export const updateVenue = (slug, data) => api.patch(`/venues/${slug}/`, data)

// ─── Bookings ────────────────────────────────────────────────────────────────
export const getOwnerBookings = (params = {}) => api.get('/owner/bookings/', { params })
export const getOwnerBookingDetail = (id) => api.get(`/owner/bookings/${id}/`)
export const confirmBooking = (id) => api.put(`/owner/bookings/${id}/confirm/`)
export const rejectBooking = (id, reason) => api.put(`/owner/bookings/${id}/reject/`, { reason })
export const completeBooking = (id) => api.put(`/owner/bookings/${id}/complete/`)
export const cancelBooking = (id, reason) => api.put(`/owner/bookings/${id}/cancel/`, { reason })

// ─── Finance ─────────────────────────────────────────────────────────────────
export const getFinanceSummary = () => api.get('/owner/finance/summary/')
export const getFinanceTransactions = (params = {}) => api.get('/owner/finance/transactions/', { params })
export const getExpenses = () => api.get('/owner/finance/expenses/')
export const createExpense = (data) => api.post('/owner/finance/expenses/', data)
export const updateExpense = (id, data) => api.patch(`/owner/finance/expenses/${id}/`, data)
export const deleteExpense = (id) => api.delete(`/owner/finance/expenses/${id}/`)

// ─── Inventory ───────────────────────────────────────────────────────────────
export const getInventory = (params = {}) => api.get('/owner/inventory/', { params })
export const createInventoryItem = (data) => api.post('/owner/inventory/', data)
export const updateInventoryItem = (id, data) => api.patch(`/owner/inventory/${id}/`, data)
export const deleteInventoryItem = (id) => api.delete(`/owner/inventory/${id}/`)

// ─── Staff ───────────────────────────────────────────────────────────────────
export const getStaff = (params = {}) => api.get('/owner/staff/', { params })
export const createStaffMember = (data) => api.post('/owner/staff/', data)
export const updateStaffMember = (id, data) => api.patch(`/owner/staff/${id}/`, data)
export const deleteStaffMember = (id) => api.delete(`/owner/staff/${id}/`)

// ─── Analytics ───────────────────────────────────────────────────────────────
export const getAnalytics = () => api.get('/owner/analytics/')

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function fmtIQD(n) {
  return (
    new Intl.NumberFormat('ar-IQ', { style: 'decimal', maximumFractionDigits: 0 }).format(n || 0) +
    ' د.ع'
  )
}

export function fmtDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export const BOOKING_STATUS_LABELS = {
  pending: 'معلق',
  confirmed: 'مؤكد',
  completed: 'مكتمل',
  rejected: 'مرفوض',
  cancelled_by_owner: 'ملغي (المالك)',
  cancelled_by_customer: 'ملغي (العميل)',
  no_show: 'لم يحضر',
}

export const BOOKING_STATUS_CLASS = {
  pending: 'status-badge status-pending',
  confirmed: 'status-badge status-confirmed',
  completed: 'status-badge status-completed',
  rejected: 'status-badge status-cancelled',
  cancelled_by_owner: 'status-badge status-cancelled',
  cancelled_by_customer: 'status-badge status-cancelled',
  no_show: 'status-badge status-cancelled',
}

export const VENUE_TYPE_LABELS = {
  wedding_hall: 'قاعة أفراح',
  conference_center: 'مركز مؤتمرات',
  restaurant: 'مطعم',
  garden: 'حديقة',
  hotel_ballroom: 'قاعة فندقية',
  rooftop: 'سطح مفتوح',
  outdoor_venue: 'قاعة خارجية',
  community_hall: 'قاعة مجتمع',
  sports_facility: 'منشأة رياضية',
  other: 'أخرى',
}

export const EVENT_TYPE_LABELS = {
  wedding: 'حفل زفاف',
  graduation: 'تخرج',
  conference: 'مؤتمر',
  party: 'حفلة',
  birthday: 'عيد ميلاد',
  other: 'أخرى',
}
