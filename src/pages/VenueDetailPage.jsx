import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getVenueDetail, isAuthenticated } from '../lib/api'

export default function VenueDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeImg, setActiveImg] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const res = await getVenueDetail(slug)
        setVenue(res.data?.data ?? res.data)
      } catch (err) {
        if (err.response?.status === 404) {
          setError('هذه القاعة غير موجودة.')
        } else {
          setError('تعذّر تحميل بيانات القاعة.')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="spinner" />
        </div>
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20 text-gray-500">{error || 'حدث خطأ'}</div>
      </div>
    )
  }

  const images = venue.images?.length > 0
    ? venue.images.map((i) => i.image ?? i)
    : venue.cover_image ? [venue.cover_image] : []

  function handleBook() {
    if (!isAuthenticated()) {
      navigate('/login', { state: { from: { pathname: `/venues/${slug}/book` } } })
      return
    }
    navigate(`/venues/${slug}/book`, { state: { venue } })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 pb-20">
        {/* Back */}
        <Link to="/home" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary py-4 transition">
          <svg className="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          العودة للقائمة
        </Link>

        {/* Gallery */}
        {images.length > 0 ? (
          <div className="rounded-2xl overflow-hidden mb-5">
            <img
              src={images[activeImg]}
              alt={venue.name}
              className="w-full h-64 sm:h-80 object-cover"
            />
            {images.length > 1 && (
              <div className="flex gap-2 p-3 bg-white overflow-x-auto">
                {images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 object-cover rounded-lg cursor-pointer flex-shrink-0 transition ${
                      activeImg === i ? 'ring-2 ring-primary' : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden mb-5 w-full h-48 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <span className="text-white text-5xl">🏛</span>
          </div>
        )}

        {/* Title & quick info */}
        <div className="card p-5 mb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h1 className="text-xl font-black text-gray-900">{venue.name}</h1>
              {venue.city && (
                <p className="text-gray-500 text-sm mt-0.5">{venue.city} — {venue.address}</p>
              )}
            </div>
            {venue.min_price != null && (
              <div className="text-left shrink-0">
                <p className="text-xs text-gray-400">يبدأ من</p>
                <p className="text-primary font-black text-lg">
                  {Number(venue.min_price).toLocaleString('ar-IQ')}
                </p>
                <p className="text-xs text-gray-400">دينار عراقي</p>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {venue.capacity && (
              <span className="badge badge-amber">
                حتى {venue.capacity} شخص
              </span>
            )}
            {venue.event_types?.map((et) => (
              <span key={et} className="badge badge-green">{et}</span>
            ))}
          </div>
        </div>

        {/* Description */}
        {venue.description && (
          <div className="card p-5 mb-4">
            <h2 className="h3 mb-2">عن القاعة</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{venue.description}</p>
          </div>
        )}

        {/* Packages */}
        {venue.packages?.length > 0 && (
          <div className="card p-5 mb-4">
            <h2 className="h3 mb-3">الباقات والأسعار</h2>
            <div className="space-y-3">
              {venue.packages.map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-semibold text-sm">{pkg.name}</p>
                    {pkg.description && (
                      <p className="text-gray-400 text-xs mt-0.5">{pkg.description}</p>
                    )}
                  </div>
                  <span className="text-primary font-bold text-sm shrink-0 mr-4">
                    {Number(pkg.price).toLocaleString('ar-IQ')} د.ع
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amenities */}
        {venue.amenities?.length > 0 && (
          <div className="card p-5 mb-4">
            <h2 className="h3 mb-3">المميزات والخدمات</h2>
            <div className="grid grid-cols-2 gap-2">
              {venue.amenities.map((a) => (
                <div key={a.id ?? a} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">✓</span>
                  {a.name ?? a}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-100 px-4 py-3 z-40">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={handleBook}
              className="w-full btn btn-primary rounded-xl py-3.5 text-base font-bold"
            >
              احجز الآن
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
