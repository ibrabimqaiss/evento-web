import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import {
  MapPinIcon, UsersIcon, BanknotesIcon, CheckCircleIcon,
  ShareIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon,
  PlayIcon,
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

const imgSrc = (img) => img?.card_url || img?.full_url || img?.thumbnail_url || img?.image_url || img?.image || null

// ── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex)
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length)
  const next = () => setIdx(i => (i + 1) % images.length)
  const img = images[idx]

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); if (e.key === 'ArrowLeft') next(); if (e.key === 'ArrowRight') prev() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <XMarkIcon style={{ width: 20, height: 20 }} />
      </button>
      <button onClick={prev} style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronRightIcon style={{ width: 22, height: 22 }} />
      </button>
      <img src={imgSrc(img)} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: '12px' }} />
      <button onClick={next} style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ChevronLeftIcon style={{ width: 22, height: 22 }} />
      </button>
      <div style={{ position: 'absolute', bottom: 20, color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{idx + 1} / {images.length}</div>
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
        console.log('[VenuePublicPage] raw response:', res.data)
        const data = res.data?.data ?? res.data
        console.log('[VenuePublicPage] venue:', data)
        console.log('[VenuePublicPage] images:', data?.images)
        setVenue(data)
      })
      .catch(() => setError('لم يتم العثور على القاعة'))
      .finally(() => setLoading(false))
  }, [shareToken])

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0818 0%,#1a0f3a 35%,#0f1a2e 65%,#0a1628 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7C3AED', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0818,#1a0f3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
        <div style={{ fontSize: '48px' }}>🏛️</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px', fontWeight: 600, fontFamily: 'Cairo, sans-serif' }}>{error || 'القاعة غير متاحة'}</div>
      </div>
    )
  }

  const cover = venue.images?.[0]
  const includedServices = (venue.services || []).filter(s => s.is_included)
  const paidServices = (venue.services || []).filter(s => s.is_paid)
  const menuByTab = (cat) => (venue.menu_items || []).filter(i => i.category === cat)

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0a0818 0%,#1a0f3a 35%,#0f1a2e 65%,#0a1628 100%)', fontFamily: 'Cairo, sans-serif', color: '#fff', paddingBottom: '60px' }}>

      {/* Hero cover */}
      <div style={{ position: 'relative', height: '320px', overflow: 'hidden' }}>
        {cover ? (
          <img src={imgSrc(cover)} alt={venue.name_ar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,rgba(124,58,237,0.4),rgba(59,130,246,0.3))' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,24,0.95) 0%, rgba(10,8,24,0.3) 50%, transparent 100%)' }} />

        {/* Share button */}
        <button
          onClick={copyLink}
          style={{ position: 'absolute', top: 16, left: 16, background: copied ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: `1px solid ${copied ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.2)'}`, borderRadius: '20px', padding: '8px 16px', cursor: 'pointer', color: copied ? '#34D399' : '#fff', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Cairo, sans-serif' }}
        >
          <ShareIcon style={{ width: 15, height: 15 }} />
          {copied ? 'تم نسخ الرابط!' : 'مشاركة'}
        </button>

        {/* Venue name over hero */}
        <div style={{ position: 'absolute', bottom: 24, right: 0, left: 0, padding: '0 24px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>{venue.name_ar || venue.name}</h1>
          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
              <MapPinIcon style={{ width: 14, height: 14 }} /> {venue.city}{venue.location ? ` · ${venue.location}` : ''}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
              <UsersIcon style={{ width: 14, height: 14 }} /> {venue.min_capacity} – {venue.max_capacity} شخص
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>
              <BanknotesIcon style={{ width: 14, height: 14 }} /> {fmtIQD(venue.base_price_iqd)} / اليوم
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 20px' }}>

        {/* Description */}
        {(venue.description_ar || venue.description) && (
          <div style={{ marginTop: '28px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px', color: 'rgba(255,255,255,0.9)' }}>عن القاعة</h2>
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, fontSize: '14px', margin: 0 }}>{venue.description_ar || venue.description}</p>
          </div>
        )}

        {/* Photo gallery */}
        {venue.images?.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px', color: 'rgba(255,255,255,0.9)' }}>معرض الصور</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
              {venue.images.map((img, i) => (
                <div key={img.id || i} style={{ borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/3', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.08)' }} onClick={() => setLightbox(i)}>
                  {imgSrc(img) && <img src={imgSrc(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.2s' }} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Video */}
        {venue.video_url && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px', color: 'rgba(255,255,255,0.9)' }}>فيديو القاعة</h2>
            <video
              src={venue.video_url}
              controls
              style={{ width: '100%', borderRadius: '16px', background: '#000', maxHeight: '360px' }}
            />
          </div>
        )}

        {/* Services */}
        {(venue.services?.length > 0) && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px', color: 'rgba(255,255,255,0.9)' }}>الخدمات المتاحة</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {includedServices.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '12px', padding: '12px 16px' }}>
                  <CheckCircleIcon style={{ width: 18, height: 18, color: '#34D399', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#34D399', background: 'rgba(52,211,153,0.15)', padding: '2px 10px', borderRadius: '20px' }}>مشمول</span>
                </div>
              ))}
              {paidServices.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: '12px', padding: '12px 16px' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(251,191,36,0.5)', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#FBBF24' }}>{fmtIQD(s.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu */}
        {venue.menu_items?.length > 0 && (
          <div style={{ marginTop: '36px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '14px', color: 'rgba(255,255,255,0.9)' }}>قائمة الطعام</h2>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px', overflowX: 'auto' }}>
              {MENU_CATS.filter(c => menuByTab(c.key).length > 0).map(c => (
                <button
                  key={c.key}
                  onClick={() => setMenuTab(c.key)}
                  style={{
                    padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
                    background: menuTab === c.key ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)',
                    color: menuTab === c.key ? '#A78BFA' : 'rgba(255,255,255,0.6)',
                    border: `1px solid ${menuTab === c.key ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Items */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {menuByTab(menuTab).map(item => (
                <div key={item.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
                  {item.photo_url && (
                    <img src={item.photo_url} alt={item.name} style={{ width: '100%', height: '130px', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>{item.name_ar || item.name}</div>
                    {item.description_ar && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px', lineHeight: 1.5 }}>{item.description_ar}</div>}
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#A78BFA' }}>{fmtIQD(item.service_price_iqd)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>
          مدعوم من <span style={{ color: 'rgba(167,139,250,0.6)', fontWeight: 700 }}>Evento IQ</span>
        </div>
      </div>

      {lightbox !== null && (
        <Lightbox images={venue.images} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
