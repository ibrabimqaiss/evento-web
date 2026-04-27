import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  MapPinIcon, UsersIcon, BanknotesIcon, CheckCircleIcon,
  ShareIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon,
} from '@heroicons/react/24/outline'

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

const getImageUrl = (img) =>
  img?.full_url || img?.image_url || img?.card_url || img?.thumbnail_url || img?.url || img?.image || ''

const getPhotoUrl = (item) =>
  item?.photo_url || item?.photo || item?.image_url || item?.image || ''

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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <XMarkIcon style={{ width: 22, height: 22 }} />
      </button>
      <button onClick={prev} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronRightIcon style={{ width: 24, height: 24 }} />
      </button>
      {getImageUrl(img) && (
        <img src={getImageUrl(img)} alt="" style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: '12px' }} />
      )}
      <button onClick={next} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 48, height: 48, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeftIcon style={{ width: 24, height: 24 }} />
      </button>
      <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>{idx + 1} / {images.length}</div>
    </div>
  )
}

export default function VenuePublicPage() {
  const { shareToken } = useParams()
  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const [menuTab, setMenuTab] = useState('appetizers')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/venues/share/${shareToken}/`)
      .then(res => {
        const data = res.data?.data ?? res.data
        console.log('[VenuePublicPage] raw:', res.data)
        console.log('[VenuePublicPage] venue:', data)
        console.log('[VenuePublicPage] first image:', JSON.stringify(data.images?.[0]))
        setVenue(data)
        // Set default menu tab to first tab that has items
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0a1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7C3AED', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0a1e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🏛️</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px', fontWeight: 600, fontFamily: 'Cairo, sans-serif' }}>{error || 'القاعة غير متاحة'}</div>
      </div>
    )
  }

  const heroImg = venue.images?.[0]
  const heroUrl = heroImg ? getImageUrl(heroImg) : ''
  const includedServices = (venue.services || []).filter(s => s.is_included)
  const paidServices = (venue.services || []).filter(s => s.is_paid)
  const menuByTab = (cat) => (venue.menu_items || []).filter(i => i.category === cat)

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#0f0a1e', fontFamily: 'Cairo, sans-serif', color: '#fff', paddingBottom: '60px' }}>

      {/* ── Hero Image ──────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', width: '100%', height: 'clamp(280px, 45vw, 520px)', overflow: 'hidden' }}>
        {heroUrl ? (
          <img
            src={heroUrl}
            alt={venue.name_ar || venue.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,rgba(124,58,237,0.5),rgba(59,130,246,0.4))' }} />
        )}

        {/* Dark gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,10,30,0.97) 0%, rgba(15,10,30,0.45) 40%, rgba(15,10,30,0.15) 70%, transparent 100%)' }} />

        {/* Share button — top right */}
        <button
          onClick={copyLink}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: copied ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${copied ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.25)'}`,
            borderRadius: '22px', padding: '9px 18px', cursor: 'pointer',
            color: copied ? '#34D399' : '#fff', fontSize: '13px', fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: '7px', fontFamily: 'Cairo, sans-serif',
            transition: 'all 0.2s',
          }}
        >
          <ShareIcon style={{ width: 15, height: 15 }} />
          {copied ? 'تم نسخ الرابط!' : 'مشاركة'}
        </button>

        {/* Venue name overlaid at bottom left */}
        <div style={{ position: 'absolute', bottom: 28, right: 0, left: 0, padding: '0 24px' }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 900, textShadow: '0 2px 16px rgba(0,0,0,0.9)', lineHeight: 1.2 }}>
            {venue.name_ar || venue.name}
          </h1>
        </div>
      </div>

      {/* ── Venue Info Bar ───────────────────────────────────────────────────── */}
      <div style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px 24px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>
            <MapPinIcon style={{ width: 16, height: 16, color: '#A78BFA', flexShrink: 0 }} />
            <span>{venue.city}{venue.address ? ` · ${venue.address_ar || venue.address}` : ''}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>
            <UsersIcon style={{ width: 16, height: 16, color: '#A78BFA', flexShrink: 0 }} />
            <span>{venue.min_capacity} – {venue.max_capacity} شخص</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '15px', fontWeight: 700, color: '#34D399' }}>
            <BanknotesIcon style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{fmtIQD(venue.base_price_iqd)} / اليوم</span>
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>

        {/* Description */}
        {(venue.description_ar || venue.description) && (
          <div style={{ marginTop: '32px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '12px', color: 'rgba(255,255,255,0.95)', margin: '0 0 12px' }}>عن القاعة</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.9, fontSize: '14px', margin: 0 }}>
              {venue.description_ar || venue.description}
            </p>
          </div>
        )}

        {/* Photo Gallery */}
        {venue.images?.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px', color: 'rgba(255,255,255,0.95)' }}>معرض الصور</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {venue.images.map((img, i) => {
                const url = getImageUrl(img)
                return (
                  <div
                    key={img.id || i}
                    style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/3', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.05)' }}
                    onClick={() => setLightbox(i)}
                  >
                    {url && <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.25s', display: 'block' }} onMouseEnter={e => e.target.style.transform='scale(1.04)'} onMouseLeave={e => e.target.style.transform='scale(1)'} />}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Video */}
        {venue.video_url && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px', color: 'rgba(255,255,255,0.95)' }}>الفيديو</h2>
            <video
              src={venue.video_url}
              controls
              style={{ width: '100%', borderRadius: '16px', background: '#000', maxHeight: '400px', display: 'block' }}
            />
          </div>
        )}

        {/* Services */}
        {venue.services?.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px', color: 'rgba(255,255,255,0.95)' }}>الخدمات المتاحة</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {includedServices.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: '12px', padding: '13px 18px' }}>
                  <CheckCircleIcon style={{ width: 19, height: 19, color: '#34D399', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#34D399', background: 'rgba(52,211,153,0.15)', padding: '3px 12px', borderRadius: '20px' }}>مشمول</span>
                </div>
              ))}
              {paidServices.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: '12px', padding: '13px 18px' }}>
                  <div style={{ width: 19, height: 19, borderRadius: '50%', border: '2px solid rgba(251,191,36,0.6)', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#FBBF24' }}>{fmtIQD(s.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu */}
        {venue.menu_items?.length > 0 && (
          <div style={{ marginTop: '36px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '16px', color: 'rgba(255,255,255,0.95)' }}>قائمة الطعام</h2>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {MENU_CATS.filter(c => menuByTab(c.key).length > 0).map(c => (
                <button
                  key={c.key}
                  onClick={() => setMenuTab(c.key)}
                  style={{
                    padding: '9px 20px', borderRadius: '22px', cursor: 'pointer',
                    fontFamily: 'Cairo, sans-serif', fontSize: '13px', fontWeight: 700,
                    transition: 'all 0.2s',
                    background: menuTab === c.key ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)',
                    color: menuTab === c.key ? '#A78BFA' : 'rgba(255,255,255,0.55)',
                    border: `1px solid ${menuTab === c.key ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  {c.label}
                  <span style={{ marginRight: '6px', fontSize: '11px', opacity: 0.7 }}>({menuByTab(c.key).length})</span>
                </button>
              ))}
            </div>

            {/* Items grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {menuByTab(menuTab).map(item => {
                const photoUrl = getPhotoUrl(item)
                return (
                  <div key={item.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
                    {photoUrl ? (
                      <img src={photoUrl} alt={item.name_ar || item.name} style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '80px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '24px' }}>🍽️</span>
                      </div>
                    )}
                    <div style={{ padding: '14px' }}>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'rgba(255,255,255,0.92)', marginBottom: '4px' }}>{item.name_ar || item.name}</div>
                      {(item.description_ar || item.description) && (
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '10px', lineHeight: 1.5 }}>
                          {item.description_ar || item.description}
                        </div>
                      )}
                      {item.service_price_iqd && (
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#A78BFA' }}>{fmtIQD(item.service_price_iqd)}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '56px', textAlign: 'center', color: 'rgba(255,255,255,0.22)', fontSize: '12px', paddingBottom: '20px' }}>
          مدعوم من <span style={{ color: 'rgba(167,139,250,0.55)', fontWeight: 700 }}>Evento IQ</span>
        </div>
      </div>

      {lightbox !== null && (
        <Lightbox images={venue.images} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
