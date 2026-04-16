import { useState } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { createBooking } from '../lib/api'

export default function BookingPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const venue = location.state?.venue

  const [form, setForm] = useState({
    event_date: '',
    event_time: '18:00',
    guest_count: '',
    event_type: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Get today's date as min
  const today = new Date().toISOString().split('T')[0]

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await createBooking({
        venue_slug: slug,
        event_date: form.event_date,
        event_time: form.event_time,
        guest_count: Number(form.guest_count),
        event_type: form.event_type || undefined,
        notes: form.notes || undefined,
      })
      setSuccess(true)
    } catch (err) {
      const data = err.response?.data
      const msg =
        data?.error?.message ||
        data?.detail ||
        data?.non_field_errors?.[0] ||
        (data?.event_date && data.event_date[0]) ||
        'حدث خطأ أثناء الحجز. يرجى المحاولة مجدداً.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-sm mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">تم الحجز بنجاح</h2>
          <p className="text-gray-500 text-sm mb-8">
            سيتواصل معك فريق القاعة لتأكيد الحجز قريباً
          </p>
          <Link
            to="/home"
            className="btn btn-primary rounded-xl px-8 py-3 font-bold"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-6 pb-20">
        {/* Back */}
        <Link
          to={`/venues/${slug}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary py-2 transition"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {venue?.name || 'القاعة'}
        </Link>

        <h1 className="text-2xl font-black text-gray-900 mt-2 mb-6">تفاصيل الحجز</h1>

        {/* Venue summary */}
        {venue && (
          <div className="card p-4 mb-5 flex items-center gap-3">
            {(venue.cover_image || venue.images?.[0]?.image) ? (
              <img
                src={venue.cover_image || venue.images[0].image}
                alt={venue.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <span className="text-2xl">🏛</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">{venue.name}</p>
              <p className="text-gray-400 text-xs truncate">{venue.city} — {venue.address}</p>
            </div>
          </div>
        )}

        <div className="card p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  تاريخ الفعالية
                </label>
                <input
                  type="date"
                  value={form.event_date}
                  onChange={(e) => set('event_date', e.target.value)}
                  min={today}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  وقت البدء
                </label>
                <input
                  type="time"
                  value={form.event_time}
                  onChange={(e) => set('event_time', e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                عدد الضيوف
              </label>
              <input
                type="number"
                value={form.guest_count}
                onChange={(e) => set('guest_count', e.target.value)}
                placeholder={venue?.capacity ? `الحد الأقصى ${venue.capacity}` : 'أدخل العدد'}
                min={1}
                max={venue?.capacity || undefined}
                required
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                نوع الفعالية
              </label>
              <select
                value={form.event_type}
                onChange={(e) => set('event_type', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition bg-white"
              >
                <option value="">اختر نوع الفعالية</option>
                <option value="wedding">عرس</option>
                <option value="conference">مؤتمر</option>
                <option value="party">حفلة</option>
                <option value="exhibition">معرض</option>
                <option value="graduation">حفل تخرج</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                ملاحظات إضافية
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="أي متطلبات أو ملاحظات خاصة..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary rounded-xl py-3.5 text-base font-bold disabled:opacity-60"
            >
              {loading ? 'جاري إرسال الطلب...' : 'تأكيد الحجز'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
