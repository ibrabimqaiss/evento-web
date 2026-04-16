import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import VenueCard from '../components/VenueCard'
import { searchVenues } from '../lib/api'

const CITIES = ['بغداد', 'البصرة', 'الموصل', 'أربيل', 'النجف', 'كربلاء', 'السليمانية']
const EVENT_TYPES = [
  { label: 'أعراس', value: 'wedding' },
  { label: 'مؤتمرات', value: 'conference' },
  { label: 'حفلات', value: 'party' },
  { label: 'معارض', value: 'exhibition' },
  { label: 'تخرج', value: 'graduation' },
]

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '')
  const [selectedType, setSelectedType] = useState(searchParams.get('event_type') || '')

  const fetchVenues = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = {}
      if (query) params.search = query
      if (selectedCity) params.city = selectedCity
      if (selectedType) params.event_type = selectedType
      const res = await searchVenues(params)
      const results = res.data?.results ?? res.data?.data ?? res.data ?? []
      setVenues(Array.isArray(results) ? results : [])
    } catch {
      setError('تعذّر تحميل القاعات. يرجى المحاولة مجدداً.')
    } finally {
      setLoading(false)
    }
  }, [query, selectedCity, selectedType])

  useEffect(() => {
    fetchVenues()
  }, [fetchVenues])

  function handleSearch(e) {
    e.preventDefault()
    const params = {}
    if (query) params.q = query
    if (selectedCity) params.city = selectedCity
    if (selectedType) params.event_type = selectedType
    setSearchParams(params)
  }

  function setCity(city) {
    setSelectedCity((prev) => (prev === city ? '' : city))
  }

  function setType(type) {
    setSelectedType((prev) => (prev === type ? '' : type))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero search */}
      <div className="bg-gradient-to-br from-primary to-purple-800 px-4 pt-10 pb-8">
        <div className="max-w-2xl mx-auto text-center mb-6">
          <h1 className="text-white text-3xl font-black mb-2">ابحث عن قاعتك المثالية</h1>
          <p className="text-white/70 text-sm">آلاف القاعات في جميع أنحاء العراق</p>
        </div>
        <form onSubmit={handleSearch} className="max-w-xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم القاعة أو المنطقة..."
              className="flex-1 px-4 py-3 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              className="bg-white text-primary font-bold px-5 py-3 rounded-xl hover:bg-gray-50 transition"
            >
              بحث
            </button>
          </div>
        </form>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* City filter */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 mb-2">المدينة</p>
          <div className="flex flex-wrap gap-2">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => setCity(city)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                  selectedCity === city
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Event type filter */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 mb-2">نوع الفعالية</p>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                  selectedType === t.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="spinner" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-gray-500">{error}</div>
        ) : venues.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">لا توجد قاعات مطابقة للبحث</p>
            <p className="text-gray-300 text-sm mt-1">جرّب تعديل معايير البحث</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">{venues.length} نتيجة</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {venues.map((v) => (
                <VenueCard key={v.id ?? v.slug} venue={v} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
