import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  MapPinIcon, UsersIcon, BanknotesIcon, CheckCircleIcon,
  ShareIcon, XMarkIcon, QueueListIcon,
  ChevronLeftIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { useTheme } from '../lib/theme'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const SHARE_BASE = import.meta.env.VITE_APP_URL || window.location.origin

const MENU_CATS = [
  { key: 'appetizers', label: 'المقبلات' },
  { key: 'mains', label: 'الأطباق الرئيسية' },
  { key: 'desserts', label: 'الحلويات' },
  { key: 'drinks', label: 'المشروبات' },
]

const VENUE_TYPE_LABELS = {
  wedding_hall: 'قاعة أفراح',
  conference_center: 'مركز مؤتمرات',
  restaurant: 'مطعم',
  garden: 'حديقة',
  hotel_ballroom: 'قاعة فندقية',
  rooftop: 'سطح مفتوح',
  outdoor_venue: 'قاعة خارجية',
  community_hall: 'قاعة مجتمع',
}

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

  useEffect(() => {
    const h = e => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const url = getImageUrl(images[idx])
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <XMarkIcon style={{ width: 22, height: 22 }} />
      </button>
      <button onClick={prev} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronRightIcon style={{ width: 24, height: 24 }} />
      </button>
      {url && <img src={url} alt="" style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 12 }} />}
      <button onClick={next} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeftIcon style={{ width: 24, height: 24 }} />
      </button>
      <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
        {idx + 1} / {images.length}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VenuePublicPage() {
  const { shareToken } = useParams()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const [menuTab, setMenuTab] = useState('appetizers')
  const [copied, setCopied] = useState(false)
  const [copiedMenu, setCopiedMenu] = useState(false)
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
        setVenue(data)
        if (data.menu_items?.length > 0) {
          const first = MENU_CATS.find(c => data.menu_items.some(i => i.category === c.key))
          if (first) setMenuTab(first.key)
        }
      })
      .catch(() => setError('لم يتم العثور على القاعة'))
      .finally(() => setLoading(false))
  }, [shareToken])

  function copyLink() {
    navigator.clipboard.writeText(`${SHARE_BASE}/venue/${shareToken}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500)
    })
  }

  function copyMenuLink() {
    navigator.clipboard.writeText(`${SHARE_BASE}/menu/${shareToken}`).then(() => {
      setCopiedMenu(true); setTimeout(() => setCopiedMenu(false), 2500)
    })
  }

  async function handleBook(e) {
    e.preventDefault()
    setBookingLoading(true); setBookingError('')
    try {
      await axios.post(`${BASE_URL}/venues/share/${shareToken}/book/`, {
        ...bookingForm, num_guests: Number(bookingForm.num_guests) || 1,
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

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const bg      = isDark ? '#0f0a1e' : '#ffffff'
  const bgSec   = isDark ? 'rgba(255,255,255,0.04)' : '#f8f8f8'
  const textP   = isDark ? 'rgba(255,255,255,0.95)' : '#1a1a2e'
  const textS   = isDark ? 'rgba(255,255,255,0.62)' : '#4a4a6a'
  const textM   = isDark ? 'rgba(255,255,255,0.38)' : '#9ca3af'
  const border  = isDark ? 'rgba(255,255,255,0.1)' : '#e5e5e5'
  const cardBg  = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff'
  const shadow  = isDark ? '0 2px 20px rgba(0,0,0,0.3)' : '0 2px 16px rgba(0,0,0,0.08)'

  if (loading) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${border}`, borderTopColor: '#7C3AED', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error || !venue) return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>🏛️</div>
      <div style={{ color: textS, fontSize: 18, fontWeight: 600, fontFamily: 'Cairo, sans-serif' }}>{error || 'القاعة غير متاحة'}</div>
    </div>
  )

  const images          = venue.images || []
  const img1            = images[0] ? getImageUrl(images[0]) : ''
  const img2            = images[1] ? getImageUrl(images[1]) : ''
  const img3            = images[2] ? getImageUrl(images[2]) : ''
  const extra           = images.length - 3
  const includedSvc     = (venue.services || []).filter(s => s.is_included)
  const paidSvc         = (venue.services || []).filter(s => s.is_paid)
  const menuByTab       = cat => (venue.menu_items || []).filter(i => i.category === cat)
  const hasTabs         = MENU_CATS.filter(c => menuByTab(c.key).length > 0)
  const hasMenu         = venue.show_menu_on_page && venue.menu_items?.length > 0
  const venueType       = VENUE_TYPE_LABELS[venue.venue_type] || ''
  const openBooking     = () => { setBookingModal(true); setBookingSuccess(false); setBookingError('') }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: bg, fontFamily: 'Cairo, sans-serif', color: textP }}>

      {/* ═══════════════════════════════════════════════════════════════════════
          PHOTO GRID — Airbnb layout: big left + 2 stacked right
      ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 0', position: 'relative' }}>
        <div className="vpp-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: img2 ? '3fr 2fr' : '1fr',
            gridTemplateRows: img3 ? '1fr 1fr' : '1fr',
            gap: 8,
            height: 'clamp(260px, 42vw, 460px)',
            borderRadius: 18,
            overflow: 'hidden',
          }}
        >
          {/* Main image */}
          <div
            style={{ gridRow: '1 / -1', background: isDark ? '#1a0f3a' : '#ede9fe', overflow: 'hidden', cursor: img1 ? 'pointer' : 'default' }}
            onClick={() => img1 && setLightbox(0)}
          >
            {img1 && <img src={img1} alt={venue.name_ar || venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }} onMouseEnter={e => e.target.style.transform = 'scale(1.03)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'} />}
          </div>

          {/* Top-right image */}
          {img2 && (
            <div style={{ background: isDark ? '#1a0f3a' : '#ede9fe', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setLightbox(1)}>
              <img src={img2} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }} onMouseEnter={e => e.target.style.transform = 'scale(1.03)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
            </div>
          )}

          {/* Bottom-right image */}
          {img3 && (
            <div style={{ background: isDark ? '#1a0f3a' : '#ede9fe', overflow: 'hidden', cursor: 'pointer', position: 'relative' }} onClick={() => setLightbox(2)}>
              <img src={img3} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s' }} onMouseEnter={e => e.target.style.transform = 'scale(1.03)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
              {extra > 0 && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 22 }}>+{extra}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* "عرض كل الصور" overlay button */}
        {images.length > 0 && (
          <button
            onClick={() => setLightbox(0)}
            style={{
              position: 'absolute', bottom: 16, left: 48,
              background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.92)',
              backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: `1px solid ${border}`,
              borderRadius: 10, padding: '8px 16px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              color: textP, fontFamily: 'Cairo, sans-serif',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
            }}
          >
            ⊞ عرض كل الصور ({images.length})
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TITLE SECTION
      ═══════════════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 0' }}>
        <h1 style={{ fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 900, color: textP, margin: '0 0 8px', lineHeight: 1.25 }}>
          {venue.name_ar || venue.name}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {venueType && <span style={{ color: textS, fontSize: 14 }}>{venueType}</span>}
          {venueType && venue.city && <span style={{ color: border }}>·</span>}
          {venue.city && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: textS, fontSize: 14 }}>
              <MapPinIcon style={{ width: 14, height: 14, color: '#7C3AED', flexShrink: 0 }} />
              {venue.city}{(venue.address_ar || venue.address) ? `، ${venue.address_ar || venue.address}` : ''}
            </span>
          )}
        </div>
        <hr style={{ border: 'none', borderTop: `1px solid ${border}`, margin: 0 }} />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          BODY — two-column desktop layout
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="vpp-body"
        style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 120px', display: 'grid', gridTemplateColumns: '1fr', gap: 40, alignItems: 'start' }}
      >

        {/* ─── LEFT COLUMN ────────────────────────────────────────────────── */}
        <div className="vpp-left">

          {/* Capacity + Price badges */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isDark ? 'rgba(124,58,237,0.12)' : '#f3f0ff', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 50, padding: '8px 18px', fontSize: 14, fontWeight: 600, color: '#7C3AED' }}>
              <UsersIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
              {venue.min_capacity} – {venue.max_capacity} شخص
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 50, padding: '8px 18px', fontSize: 14, fontWeight: 700, color: '#059669' }}>
              <BanknotesIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
              {fmtIQD(venue.base_price_iqd)} / يوم
            </span>
          </div>

          {/* Description */}
          {(venue.description_ar || venue.description) && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: textP, margin: '0 0 10px' }}>عن القاعة</h2>
              <p style={{ color: textS, lineHeight: 1.9, fontSize: 15, margin: '0 0 28px' }}>
                {venue.description_ar || venue.description}
              </p>
              <hr style={{ border: 'none', borderTop: `1px solid ${border}`, margin: '0 0 28px' }} />
            </>
          )}

          {/* Services — horizontal chips */}
          {venue.services?.length > 0 && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: textP, margin: '0 0 14px' }}>الخدمات المتاحة</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
                {includedSvc.map(s => (
                  <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isDark ? 'rgba(16,185,129,0.08)' : '#f0fdf4', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 50, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#059669' }}>
                    <CheckCircleIcon style={{ width: 14, height: 14, flexShrink: 0 }} />
                    {s.name}
                  </span>
                ))}
                {paidSvc.map(s => (
                  <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: isDark ? 'rgba(217,119,6,0.08)' : '#fffbeb', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 50, padding: '7px 16px', fontSize: 13, fontWeight: 600, color: '#d97706' }}>
                    <BanknotesIcon style={{ width: 13, height: 13, flexShrink: 0 }} />
                    {s.name} · {fmtIQD(s.price)}
                  </span>
                ))}
              </div>
              <hr style={{ border: 'none', borderTop: `1px solid ${border}`, margin: '0 0 28px' }} />
            </>
          )}

          {/* Menu — tabs + cards */}
          {hasMenu && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: textP, margin: '0 0 14px' }}>قائمة الطعام</h2>
              {hasTabs.length > 1 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
                  {hasTabs.map(c => (
                    <button
                      key={c.key}
                      onClick={() => setMenuTab(c.key)}
                      style={{
                        padding: '8px 20px', borderRadius: 50, cursor: 'pointer',
                        fontFamily: 'Cairo, sans-serif', fontSize: 13, fontWeight: 700,
                        border: menuTab === c.key ? '2px solid #7C3AED' : `1px solid ${border}`,
                        background: menuTab === c.key
                          ? (isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.08)')
                          : (isDark ? 'rgba(255,255,255,0.04)' : '#f7f7f7'),
                        color: menuTab === c.key ? '#7C3AED' : textS,
                        transition: 'all 0.18s',
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14, marginBottom: 28 }}>
                {menuByTab(menuTab).map(item => {
                  const photoUrl = getPhotoUrl(item)
                  return (
                    <div key={item.id} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden', boxShadow: shadow }}>
                      {photoUrl
                        ? <img src={photoUrl} alt={item.name_ar || item.name} style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }} />
                        : <div style={{ height: 70, background: isDark ? 'rgba(124,58,237,0.1)' : '#f3f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🍽️</div>
                      }
                      <div style={{ padding: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: textP, marginBottom: 3 }}>{item.name_ar || item.name}</div>
                        {item.service_price_iqd
                          ? <div style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>{fmtIQD(item.service_price_iqd)}</div>
                          : <div style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>مشمول</div>
                        }
                      </div>
                    </div>
                  )
                })}
              </div>
              <hr style={{ border: 'none', borderTop: `1px solid ${border}`, margin: '0 0 28px' }} />
            </>
          )}

          {/* Photo Gallery */}
          {images.length > 0 && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: textP, margin: '0 0 14px' }}>معرض الصور</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {images.map((img, i) => {
                  const url = getImageUrl(img)
                  return (
                    <div key={img.id || i} style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '4/3', cursor: 'pointer', border: `1px solid ${border}`, background: bgSec }} onClick={() => setLightbox(i)}>
                      {url && <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.25s' }} onMouseEnter={e => e.target.style.transform = 'scale(1.05)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'} />}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Video */}
          {venue.video_url && (
            <div style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: textP, marginBottom: 14 }}>الفيديو</h2>
              <video src={venue.video_url} controls style={{ width: '100%', borderRadius: 16, background: '#000', maxHeight: 400, display: 'block', boxShadow: shadow }} />
            </div>
          )}
        </div>

        {/* ─── RIGHT COLUMN — sticky booking card ─────────────────────────── */}
        <div className="vpp-right">
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 20, padding: '28px 24px', boxShadow: shadow, position: 'sticky', top: 24 }}>

            {/* Price */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: textP, lineHeight: 1 }}>{fmtIQD(venue.base_price_iqd)}</span>
                <span style={{ fontSize: 14, color: textS, fontWeight: 500 }}>/ اليوم</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: textM, fontSize: 13 }}>
                <UsersIcon style={{ width: 13, height: 13, flexShrink: 0 }} />
                يسع {venue.min_capacity} – {venue.max_capacity} شخص
              </div>
            </div>

            {/* احجز الآن CTA */}
            <button
              onClick={openBooking}
              style={{ width: '100%', background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#fff', border: 'none', borderRadius: 50, padding: '15px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 18px rgba(124,58,237,0.45)', transition: 'transform 0.15s, box-shadow 0.15s', marginBottom: 8 }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(124,58,237,0.55)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(124,58,237,0.45)' }}
            >
              احجز الآن
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: textM, margin: '0 0 16px' }}>لا رسوم حجز مسبقة</p>

            <hr style={{ border: 'none', borderTop: `1px solid ${border}`, margin: '0 0 16px' }} />

            {/* Share buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={copyLink}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: copied ? (isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4') : (isDark ? 'rgba(255,255,255,0.04)' : '#f7f7f7'), border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : border}`, borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: copied ? '#059669' : textS, fontFamily: 'Cairo, sans-serif', transition: 'all 0.2s' }}
              >
                <ShareIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
                {copied ? 'تم نسخ الرابط ✓' : 'نسخ رابط القاعة'}
              </button>
              {hasMenu && (
                <button
                  onClick={copyMenuLink}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: copiedMenu ? (isDark ? 'rgba(16,185,129,0.1)' : '#f0fdf4') : (isDark ? 'rgba(255,255,255,0.04)' : '#f7f7f7'), border: `1px solid ${copiedMenu ? 'rgba(16,185,129,0.3)' : border}`, borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: copiedMenu ? '#059669' : textS, fontFamily: 'Cairo, sans-serif', transition: 'all 0.2s' }}
                >
                  <QueueListIcon style={{ width: 15, height: 15, flexShrink: 0 }} />
                  {copiedMenu ? 'تم النسخ ✓' : 'نسخ رابط القائمة'}
                </button>
              )}
            </div>

            <div style={{ marginTop: 18, textAlign: 'center', fontSize: 11, color: textM }}>
              مدعوم من <span style={{ color: '#7C3AED', fontWeight: 700 }}>Evento IQ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MOBILE STICKY BOTTOM BAR
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="vpp-bar"
        style={{ display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, padding: '12px 20px', background: isDark ? 'rgba(12,8,24,0.97)' : 'rgba(255,255,255,0.97)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderTop: `1px solid ${border}`, alignItems: 'center', gap: 16 }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: textP }}>{fmtIQD(venue.base_price_iqd)}</div>
          <div style={{ fontSize: 12, color: textS }}>/ اليوم</div>
        </div>
        <button
          onClick={openBooking}
          style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', border: 'none', borderRadius: 50, padding: '13px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 16px rgba(124,58,237,0.45)', flexShrink: 0 }}
        >
          احجز الآن
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          BOOKING BOTTOM-SHEET MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {bookingModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setBookingModal(false)}
        >
          <div
            style={{ width: '100%', maxWidth: 520, background: isDark ? '#0c081c' : '#fff', borderRadius: '24px 24px 0 0', padding: '28px 24px 40px', boxShadow: '0 -8px 40px rgba(0,0,0,0.35)', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.18)' : '#e0e0e0', margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: textP, marginBottom: 20, textAlign: 'center' }}>احجز القاعة</h3>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#059669', marginBottom: 8 }}>تم إرسال طلب الحجز!</div>
                <div style={{ fontSize: 14, color: textS, marginBottom: 24 }}>سيتواصل معك صاحب القاعة قريباً للتأكيد.</div>
                <button onClick={() => setBookingModal(false)} style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
                  حسناً
                </button>
              </div>
            ) : (
              <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {bookingError && (
                  <div style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fff1f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#fca5a5'}`, borderRadius: 10, padding: '10px 14px', color: '#ef4444', fontSize: 13 }}>
                    {bookingError}
                  </div>
                )}

                <div className="bfg" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textS, marginBottom: 4 }}>الاسم *</label>
                    <input required value={bookingForm.client_name} onChange={e => setBookingForm(f => ({ ...f, client_name: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: textP, fontSize: 14, fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box', outline: 'none' }} placeholder="محمد أحمد" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textS, marginBottom: 4 }}>رقم الهاتف *</label>
                    <input required dir="ltr" value={bookingForm.client_phone} onChange={e => setBookingForm(f => ({ ...f, client_phone: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: textP, fontSize: 14, fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box', outline: 'none' }} placeholder="07xxxxxxxxx" />
                  </div>
                </div>

                <div className="bfg" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textS, marginBottom: 4 }}>تاريخ المناسبة *</label>
                    <input required type="date" dir="ltr" value={bookingForm.event_date} onChange={e => setBookingForm(f => ({ ...f, event_date: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: textP, fontSize: 14, fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textS, marginBottom: 4 }}>عدد الضيوف *</label>
                    <input required type="number" min={venue?.min_capacity || 1} max={venue?.max_capacity || 9999} dir="ltr" value={bookingForm.num_guests} onChange={e => setBookingForm(f => ({ ...f, num_guests: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: textP, fontSize: 14, fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box', outline: 'none' }} placeholder={`${venue?.min_capacity || 1} – ${venue?.max_capacity || 500}`} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textS, marginBottom: 4 }}>نوع المناسبة</label>
                  <select value={bookingForm.event_type} onChange={e => setBookingForm(f => ({ ...f, event_type: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: textP, fontSize: 14, fontFamily: 'Cairo, sans-serif', boxSizing: 'border-box', outline: 'none' }}>
                    <option value="wedding">زفاف</option>
                    <option value="graduation">تخرج</option>
                    <option value="conference">مؤتمر</option>
                    <option value="party">حفلة</option>
                    <option value="birthday">عيد ميلاد</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: textS, marginBottom: 4 }}>طلبات خاصة (اختياري)</label>
                  <textarea value={bookingForm.special_requests} onChange={e => setBookingForm(f => ({ ...f, special_requests: e.target.value }))} placeholder="أي ملاحظات أو طلبات إضافية..." rows={2} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.05)' : '#f9f9f9', color: textP, fontSize: 14, fontFamily: 'Cairo, sans-serif', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 16, fontWeight: 700, cursor: bookingLoading ? 'not-allowed' : 'pointer', fontFamily: 'Cairo, sans-serif', opacity: bookingLoading ? 0.7 : 1, transition: 'opacity 0.2s' }}
                >
                  {bookingLoading ? 'جاري الإرسال...' : 'إرسال طلب الحجز'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {lightbox !== null && (
        <Lightbox images={images} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }

        /* Desktop: 2-column layout + hide mobile bar */
        @media (min-width: 769px) {
          .vpp-body  { grid-template-columns: 1fr 340px !important; }
          .vpp-bar   { display: none !important; }
        }

        /* Mobile: single column + show sticky bar + hide right booking card */
        @media (max-width: 768px) {
          .vpp-right { display: none !important; }
          .vpp-bar   { display: flex !important; }
          .vpp-body  { padding-bottom: 90px !important; }
          .vpp-grid  { height: clamp(200px, 55vw, 320px) !important; }
        }

        /* Narrow phones: stack booking form grids */
        @media (max-width: 380px) {
          .bfg { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
