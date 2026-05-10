import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { ShareIcon, CheckIcon, SunIcon, MoonIcon, QueueListIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../../lib/theme'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const MENU_CATS = [
  { key: 'appetizers', label: 'المقبلات' },
  { key: 'mains', label: 'الأطباق الرئيسية' },
  { key: 'desserts', label: 'الحلويات' },
  { key: 'drinks', label: 'المشروبات' },
]

function fmtIQD(n) {
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(n || 0) + ' د.ع'
}

const getPhotoUrl = (item) => {
  const url = item?.photo_url || item?.photo || item?.image_url || item?.image || ''
  if (url && !url.startsWith('http')) return `https://evento-media-iq.s3.eu-north-1.amazonaws.com/${url}`
  return url
}

export default function VenueMenuPublicPage() {
  const { shareToken } = useParams()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuTab, setMenuTab] = useState('appetizers')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    axios.get(`${BASE_URL}/venues/share/${shareToken}/`)
      .then(res => {
        const data = res.data?.data ?? res.data
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
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const bg = isDark ? '#0f0a1e' : '#ffffff'
  const textPrimary = isDark ? 'rgba(255,255,255,0.95)' : '#1a1a2e'
  const textSecondary = isDark ? 'rgba(255,255,255,0.6)' : '#666666'
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#e5e5e5'
  const cardBg = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff'
  const cardShadow = isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.07)'
  const headerBg = isDark ? 'rgba(15,10,30,0.92)' : 'rgba(255,255,255,0.96)'
  const tabActiveBg = isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.08)'
  const tabInactiveBg = isDark ? 'rgba(255,255,255,0.05)' : '#f7f7f7'
  const menuItemFallbackBg = isDark ? 'rgba(124,58,237,0.1)' : '#f3f0ff'

  const menuByTab = (cat) => (venue?.menu_items || []).filter(i => i.category === cat)
  const hasTabs = MENU_CATS.filter(c => menuByTab(c.key).length > 0)

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${borderColor}`, borderTopColor: '#7C3AED', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: 'Cairo, sans-serif' }}>
        <QueueListIcon style={{ width: 48, height: 48, opacity: 0.4 }} />
        <div style={{ color: textSecondary, fontSize: 18, fontWeight: 600 }}>{error || 'القاعة غير متاحة'}</div>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: bg, fontFamily: 'Cairo, sans-serif', color: textPrimary, paddingBottom: 60 }}>

      {/* ── Sticky Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: headerBg,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${borderColor}`,
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: textPrimary }}>{venue.name_ar || venue.name}</div>
          <div style={{ fontSize: 12, color: textSecondary }}>قائمة الطعام</div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={toggleTheme}
            style={{
              background: isDark ? 'rgba(255,255,255,0.08)' : '#f7f7f7',
              border: `1px solid ${borderColor}`,
              borderRadius: '50%', width: 36, height: 36,
              cursor: 'pointer', color: textSecondary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {isDark ? <SunIcon style={{ width: 16, height: 16 }} /> : <MoonIcon style={{ width: 16, height: 16 }} />}
          </button>
          <button
            onClick={copyLink}
            style={{
              background: copied ? (isDark ? 'rgba(52,211,153,0.15)' : '#f0fdf9') : (isDark ? 'rgba(255,255,255,0.08)' : '#f7f7f7'),
              border: `1px solid ${copied ? (isDark ? 'rgba(52,211,153,0.4)' : '#a7f3d0') : borderColor}`,
              borderRadius: 22, padding: '7px 14px', cursor: 'pointer',
              color: copied ? '#059669' : textSecondary, fontSize: 13, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 6,
              fontFamily: 'Cairo, sans-serif',
            }}
          >
            {copied ? <CheckIcon style={{ width: 14, height: 14 }} /> : <ShareIcon style={{ width: 14, height: 14 }} />}
            {copied ? 'تم النسخ!' : 'مشاركة'}
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 16px' }}>

        {/* Venue name + city */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 900, color: textPrimary, margin: '0 0 4px' }}>
            {venue.name_ar || venue.name}
          </h1>
          {venue.city && <div style={{ fontSize: 14, color: textSecondary }}>{venue.city}</div>}
        </div>

        {/* Category tabs */}
        {hasTabs.length > 0 && (
          <div style={{
            display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24,
            borderBottom: `1px solid ${borderColor}`, paddingBottom: 16,
          }}>
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

        {/* Items grid */}
        {menuByTab(menuTab).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: textSecondary }}>
            لا توجد أصناف في هذا القسم
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {menuByTab(menuTab).map(item => {
              const photoUrl = getPhotoUrl(item)
              return (
                <div key={item.id} style={{
                  background: cardBg, border: `1px solid ${borderColor}`,
                  borderRadius: 16, overflow: 'hidden', boxShadow: cardShadow,
                }}>
                  {photoUrl ? (
                    <img src={photoUrl} alt={item.name_ar || item.name} style={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: 80, background: menuItemFallbackBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <QueueListIcon style={{ width: 24, height: 24, opacity: 0.4 }} />
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
        )}

        {/* Footer */}
        <div style={{ marginTop: 56, textAlign: 'center', color: isDark ? 'rgba(255,255,255,0.2)' : '#ccc', fontSize: 12 }}>
          مدعوم من <span style={{ color: isDark ? 'rgba(167,139,250,0.6)' : '#7C3AED', fontWeight: 700 }}>Evento IQ</span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
