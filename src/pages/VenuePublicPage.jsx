import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  MapPinIcon, UsersIcon, BanknotesIcon, CheckCircleIcon,
  ShareIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon,
  SunIcon, MoonIcon, QueueListIcon,
} from '@heroicons/react/24/outline'
import { useTheme } from '../lib/theme'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const MENU_CATS = [
  { key: 'appetizers', label: 'المقبلات' },
  { key: 'mains', label: 'الأطباق الرئيسية' },
  { key: 'desserts', label: 'الحلويات' },
  { key: 'drinks', label: 'المشروبات' },
]

function fmtIQD(n) {
  return new Intl.NumberFormat('ar-IQ', { style: 'decimal', maximumFractionDigits: 0 }).format(n || 0) + ' د.ع'
}

const getImageUrl = (img) => {
  if (!img) return ''
  if (typeof img === 'string') return img
  const url = img.full_url || img.image_url || img.card_url || img.thumbnail_url || img.url || img.image || ''
  if (url && !url.startsWith('http')) return `https://evento-media-iq.s3.eu-north-1.amazonaws.com/${url}`
  return url
}

const getPhotoUrl = (item) => {
  const url = item?.photo_url || item?.photo || item?.image_url || item?.image || ''
  if (url && !url.startsWith('http')) return `https://evento-media-iq.s3.eu-north-1.amazonaws.com/${url}`
  return url
}

// ── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length)
  const next = () => setIdx(i => (i + 1) % images.length)
  const img = images[idx]

  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <XMarkIcon style={{ width: 22, height: 22 }} />
      </button>
      <button onClick={prev} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronRightIcon style={{ width: 24, height: 24 }} />
      </button>
      {getImageUrl(img) && (
        <img src={getImageUrl(img)} alt="" style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 12 }} />
      )}
      <button onClick={next} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeftIcon style={{ width: 24, height: 24 }} />
      </button>
      <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{idx + 1} / {images.length}</div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function VenuePublicPage() {
  const { shareToken } = useParams()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const [menuTab, setMenuTab] = useState('appetizers')
  const [copied, setCopied] = useState(false)
  const [bookingModal, setBookingModal] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    client_name: '', client_phone: '', event_date: '',
    start_time: '18:00', num_guests: '', event_type: 'wedding', special_requests: '',
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/venues/share/${shareToken}/`)
      .then(res => {
        const data = res.data?.data ?? res.data
        console.log('[VenuePublicPage] raw:', res.data)
        console.log('[VenuePublicPage] venue:', data)
        console.log('[VenuePublicPage] first image:', JSON.stringify(data.images?.[0]))
        setVenue(data)
        if (data.menu_items?.length > 0) {
          const firstCat = MENU_CATS.find(c => data.menu_items.some(i => i.category === c.key))
          if (firstCat) setMenuTab(firstCat.key)
        }
      })
      .catch(() => setError('لم يتم العثور على القاعة'))
      .finally(() => setLoading(false))
  }, [shareToken])

  function copyLink() {
    const url = `https://evento-iq.com/venue/${shareToken}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  async function handleBook(e) {
    e.preventDefault()
    setBookingLoading(true)
    setBookingError('')
    try {
      await axios.post(`${BASE_URL}/venues/share/${shareToken}/book/`, {
        ...bookingForm,
        num_guests: Number(bookingForm.num_guests) || 1,
      })
      setBookingSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.error?.message
      if (typeof msg === 'object') {
        const first = Object.values(msg)[0]
        setBookingError(Array.isArray(first) ? first[0] : String(first))
      } else {
        setBookingError(msg || 'حدث خطأ، يرجى المحاولة مرة أخرى.')
      }
    } finally {
      setBookingLoading(false)
    }
  }

  // Theme-derived values for styles that can't use pure CSS variables
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#e5e5e5'
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff'
  const cardShadow = isDark ? 'none' : '0 2px 16px rgba(0,0,0,0.07)'
  const infoBarBg = isDark ? 'rgba(255,255,255,0.03)' : '#ffffff'
  const tabActiveBg = isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.08)'
  const tabInactiveBg = isDark ? 'rgba(255,255,255,0.05)' : '#f7f7f7'
  const successBg = isDark ? 'rgba(52,211,153,0.06)' : '#f0fdf9'
  const successBorder = isDark ? 'rgba(52,211,153,0.2)' : '#a7f3d0'
  const paidBg = isDark ? 'rgba(251,191,36,0.06)' : '#fffbeb'
  const paidBorder = isDark ? 'rgba(251,191,36,0.2)' : '#fde68a'
  const menuItemFallbackBg = isDark ? 'rgba(124,58,237,0.1)' : '#f3f0ff'
  const stickyBarBg = isDark ? 'rgba(15,10,30,0.94)' : 'rgba(255,255,255,0.97)'
  const textPrimary = isDark ? 'rgba(255,255,255,0.95)' : '#1a1a2e'
  const textSecondary = isDark ? 'rgba(255,255,255,0.62)' : '#666666'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: isDark ? '#0f0a1e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${borderColor}`, borderTopColor: '#7C3AED', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div style={{ minHeight: '100vh', background: isDark ? '#0f0a1e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 48 }}>🏛️</div>
        <div style={{ color: textSecondary, fontSize: 18, fontWeight: 600, fontFamily: 'Cairo, sans-serif' }}>{error || 'القاعة غير متاحة'}</div>
      </div>
    )
  }

  const heroImg = venue.images?.[0]
  const heroUrl = heroImg ? getImageUrl(heroImg) : ''
  const includedServices = (venue.services || []).filter(s => s.is_included)
  const paidServices = (venue.services || []).filter(s => s.is_paid)
  const menuByTab = (cat) => (venue.menu_items || []).filter(i => i.category === cat)
  const hasTabs = MENU_CATS.filter(c => menuByTab(c.key).length > 0)
  const menuLink = `/menu/${shareToken}`

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      background: isDark ? '#0f0a1e' : '#ffffff',
      fontFamily: 'Cairo, sans-serif',
      color: textPrimary,
      paddingBottom: 80,
    }}>

      {/* ── Hero Image ── */}
      <div style={{ position: 'relative', width: '100%', height: 'clamp(280px, 45vw, 520px)', overflow: 'hidden', background: isDark ? '#1a0f3a' : '#f3f0ff' }}>
        {heroUrl && (
          <img
            src={heroUrl}
            alt={venue.name_ar || venue.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        {/* Dark gradient at bottom so text is always readable */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)' }} />

        {/* Top controls: theme toggle + share */}
        <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
          <button
            onClick={toggleTheme}
            style={{
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%',
              width: 40, height: 40, cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isDark ? <SunIcon style={{ width: 18, height: 18 }} /> : <MoonIcon style={{ width: 18, height: 18 }} />}
          </button>
          <button
            onClick={copyLink}
            style={{
              background: copied ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${copied ? 'rgba(52,211,153,0.55)' : 'rgba(255,255,255,0.3)'}`,
              borderRadius: 22, padding: '9px 18px', cursor: 'pointer',
              color: copied ? '#34D399' : '#fff', fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Cairo, sans-serif',
              transition: 'all 0.2s',
            }}
          >
            <ShareIcon style={{ width: 15, height: 15 }} />
            {copied ? 'تم نسخ الرابط!' : 'مشاركة'}
          </button>
        </div>

        {/* Venue name — bottom left */}
        <div style={{ position: 'absolute', bottom: 28, right: 0, left: 0, padding: '0 24px' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 900, color: '#ffffff', textShadow: '0 2px 18px rgba(0,0,0,0.9)', lineHeight: 1.2 }}>
            {venue.name_ar || venue.name}
          </h1>
        </div>
      </div>

      {/* ── Info Bar ── */}
      <div style={{ background: infoBarBg, borderBottom: `1px solid ${borderColor}`, boxShadow: isDark ? 'none' : '0 1px 0 #f3f3f3' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 20px', display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {venue.city && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: textSecondary, fontSize: 14 }}>
              <MapPinIcon style={{ width: 15, height: 15, color: '#7C3AED', flexShrink: 0 }} />
              <span>{venue.city}{(venue.address_ar || venue.address) ? ` · ${venue.address_ar || venue.address}` : ''}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: textSecondary, fontSize: 14 }}>
            <UsersIcon style={{ width: 15, height: 15, color: '#7C3AED', flexShrink: 0 }} />
            <span>{venue.min_capacity} – {venue.max_capacity} شخص</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, fontWeight: 700, color: '#059669' }}>
            <BanknotesIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
            <span>{fmtIQD(venue.base_price_iqd)} / اليوم</span>
          </div>
        </div>
      </div>

      {/* ── Sections ── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>

        {/* Description */}
        {(venue.description_ar || venue.description) && (
          <section style={{ marginTop: 32, background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 18, padding: 24, boxShadow: cardShadow }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, margin: '0 0 12px' }}>عن القاعة</h2>
            <p style={{ color: textSecondary, lineHeight: 1.9, fontSize: 14, margin: 0 }}>
              {venue.description_ar || venue.description}
            </p>
          </section>
        )}

        {/* Photo Gallery */}
        {venue.images?.length > 0 && (
          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>معرض الصور</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {venue.images.map((img, i) => {
                const url = getImageUrl(img)
                return (
                  <div
                    key={img.id || i}
                    style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '4/3', cursor: 'pointer', border: `1px solid ${borderColor}`, background: isDark ? 'rgba(255,255,255,0.03)' : '#f7f7f7', boxShadow: cardShadow }}
                    onClick={() => setLightbox(i)}
                  >
                    {url && (
                      <img
                        src={url} alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.25s' }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Video */}
        {venue.video_url && (
          <section style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, marginBottom: 14 }}>الفيديو</h2>
            <video src={venue.video_url} controls style={{ width: '100%', borderRadius: 16, background: '#000', maxHeight: 400, display: 'block', boxShadow: cardShadow }} />
          </section>
        )}

        {/* Services */}
        {venue.services?.length > 0 && (
          <section style={{ marginTop: 32, background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 18, padding: 24, boxShadow: cardShadow }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, margin: '0 0 16px' }}>الخدمات المتاحة</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {includedServices.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: successBg, border: `1px solid ${successBorder}`, borderRadius: 12, padding: '12px 16px' }}>
                  <CheckCircleIcon style={{ width: 18, height: 18, color: '#059669', flexShrink: 0 }} />
                  <span style={{ color: textPrimary, fontSize: 14, flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: isDark ? 'rgba(52,211,153,0.12)' : '#dcfce7', padding: '2px 10px', borderRadius: 20 }}>مشمول</span>
                </div>
              ))}
              {paidServices.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: paidBg, border: `1px solid ${paidBorder}`, borderRadius: 12, padding: '12px 16px' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #d97706', flexShrink: 0 }} />
                  <span style={{ color: textPrimary, fontSize: 14, flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#d97706' }}>{fmtIQD(s.price)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Menu — only if show_menu_on_page is true */}
        {venue.show_menu_on_page && venue.menu_items?.length > 0 && (
          <section style={{ marginTop: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>قائمة الطعام</h2>
            {hasTabs.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {hasTabs.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setMenuTab(c.key)}
                    style={{
                      padding: '8px 18px', borderRadius: 22, cursor: 'pointer',
                      fontFamily: 'Cairo, sans-serif', fontSize: 13, fontWeight: 700,
                      border: menuTab === c.key ? '2px solid #7C3AED' : `1px solid ${borderColor}`,
                      background: menuTab === c.key ? tabActiveBg : tabInactiveBg,
                      color: menuTab === c.key ? '#7C3AED' : textSecondary,
                      transition: 'all 0.2s',
                    }}
                  >
                    {c.label}
                    <span style={{ marginRight: 6, fontSize: 11, opacity: 0.7 }}>({menuByTab(c.key).length})</span>
                  </button>
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {menuByTab(menuTab).map(item => {
                const photoUrl = getPhotoUrl(item)
                return (
                  <div key={item.id} style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 16, overflow: 'hidden', boxShadow: cardShadow }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt={item.name_ar || item.name} style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: 80, background: menuItemFallbackBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 24 }}>🍽️</span>
                      </div>
                    )}
                    <div style={{ padding: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: textPrimary, marginBottom: 4 }}>{item.name_ar || item.name}</div>
                      {(item.description_ar || item.description) && (
                        <div style={{ fontSize: 12, color: textSecondary, marginBottom: 8, lineHeight: 1.5 }}>
                          {item.description_ar || item.description}
                        </div>
                      )}
                      {item.service_price_iqd && (
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#7C3AED' }}>{fmtIQD(item.service_price_iqd)}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Menu link button — always visible */}
        <section style={{ marginTop: 28, paddingBottom: 4 }}>
          <a
            href={menuLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: isDark ? 'rgba(124,58,237,0.12)' : '#f3f0ff',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: 12, padding: '12px 22px',
              color: '#7C3AED', fontSize: 14, fontWeight: 700,
              textDecoration: 'none', fontFamily: 'Cairo, sans-serif',
              transition: 'all 0.2s',
            }}
          >
            <QueueListIcon style={{ width: 18, height: 18 }} />
            عرض قائمة الطعام كاملة
          </a>
        </section>

        {/* Footer */}
        <div style={{ marginTop: 48, textAlign: 'center', color: isDark ? 'rgba(255,255,255,0.2)' : '#ccc', fontSize: 12, paddingBottom: 20 }}>
          مدعوم من <span style={{ color: isDark ? 'rgba(167,139,250,0.55)' : '#7C3AED', fontWeight: 700 }}>Evento IQ</span>
        </div>
      </div>

      {/* ── Sticky Reserve Bar ── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        padding: '12px 20px',
        background: stickyBarBg,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1px solid ${borderColor}`,
        display: 'flex', gap: 16, alignItems: 'center',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: textPrimary }}>{fmtIQD(venue.base_price_iqd)}</div>
          <div style={{ fontSize: 12, color: textSecondary }}>/ اليوم</div>
        </div>
        <button
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            color: '#fff', border: 'none', borderRadius: 14,
            padding: '13px 32px', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Cairo, sans-serif',
            boxShadow: '0 4px 18px rgba(124,58,237,0.45)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 22px rgba(124,58,237,0.55)' }}
          onMouseLeave={e => { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 18px rgba(124,58,237,0.45)' }}
          onClick={() => { setBookingModal(true); setBookingSuccess(false); setBookingError('') }}
        >
          احجز الآن
        </button>
      </div>

      {/* ── Booking Modal ── */}
      {bookingModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setBookingModal(false)}
        >
          <div
            style={{ width: '100%', maxWidth: 520, background: isDark ? 'rgba(12,8,28,0.98)' : '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', boxShadow: '0 -8px 40px rgba(0,0,0,0.35)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.18)' : '#e0e0e0', margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, marginBottom: 20, textAlign: 'center' }}>احجز القاعة</h3>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: isDark ? '#34D399' : '#059669', marginBottom: 8 }}>تم إرسال طلب الحجز!</div>
                <div style={{ fontSize: 14, color: textSecondary, marginBottom: 24 }}>سيتواصل معك صاحب القاعة قريباً للتأكيد.</div>
                <button onClick={() => setBookingModal(false)} style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                  حسناً
                </button>
              </div>
            ) : (
              <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {bookingError && (
                  <div style={{ background: isDark ? 'rgba(248,113,113,0.12)' : '#fff1f2', border: `1px solid ${isDark ? 'rgba(248,113,113,0.3)' : '#fca5a5'}`, borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13 }}>
                    {bookingError}
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textSecondary, marginBottom: 4 }}>الاسم *</label>
                    <input required value={bookingForm.client_name} onChange={e => setBookingForm(f => ({ ...f, client_name: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${borderColor}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: textPrimary, fontSize: 14, fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }} placeholder="محمد أحمد" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textSecondary, marginBottom: 4 }}>رقم الهاتف *</label>
                    <input required dir="ltr" value={bookingForm.client_phone} onChange={e => setBookingForm(f => ({ ...f, client_phone: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${borderColor}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: textPrimary, fontSize: 14, fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }} placeholder="07xxxxxxxxx" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textSecondary, marginBottom: 4 }}>تاريخ المناسبة *</label>
                    <input required type="date" dir="ltr" value={bookingForm.event_date} onChange={e => setBookingForm(f => ({ ...f, event_date: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${borderColor}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: textPrimary, fontSize: 14, fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textSecondary, marginBottom: 4 }}>عدد الضيوف *</label>
                    <input required type="number" min={venue?.min_capacity || 1} max={venue?.max_capacity || 9999} dir="ltr" value={bookingForm.num_guests} onChange={e => setBookingForm(f => ({ ...f, num_guests: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${borderColor}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: textPrimary, fontSize: 14, fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }} placeholder={`${venue?.min_capacity || 1} – ${venue?.max_capacity || 500}`} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textSecondary, marginBottom: 4 }}>نوع المناسبة</label>
                  <select value={bookingForm.event_type} onChange={e => setBookingForm(f => ({ ...f, event_type: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${borderColor}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: textPrimary, fontSize: 14, fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box' }}>
                    <option value="wedding">زفاف</option>
                    <option value="graduation">تخرج</option>
                    <option value="conference">مؤتمر</option>
                    <option value="party">حفلة</option>
                    <option value="birthday">عيد ميلاد</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textSecondary, marginBottom: 4 }}>طلبات خاصة (اختياري)</label>
                  <textarea value={bookingForm.special_requests} onChange={e => setBookingForm(f => ({ ...f, special_requests: e.target.value }))} placeholder="أي ملاحظات أو طلبات إضافية..." rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${borderColor}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: textPrimary, fontSize: 14, fontFamily: 'Cairo, sans-serif', resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={bookingLoading} style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 16, fontWeight: 700, cursor: bookingLoading ? 'not-allowed' : 'pointer', fontFamily: 'Cairo, sans-serif', opacity: bookingLoading ? 0.7 : 1, transition: 'opacity 0.2s', marginTop: 4 }}>
                  {bookingLoading ? 'جاري الإرسال...' : 'إرسال طلب الحجز'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {lightbox !== null && (
        <Lightbox images={venue.images} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
