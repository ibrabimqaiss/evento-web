import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  BuildingOffice2Icon, UsersIcon, BanknotesIcon, TagIcon,
  MapPinIcon, MapIcon, CalendarDaysIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { getPublicVenue } from '../lib/api.js'

// ─── OG meta helper ───────────────────────────────────────────────────────────
function setOGMeta({ title, description, image, url }) {
  const set = (prop, content) => {
    let el = document.querySelector(`meta[property="${prop}"]`)
    if (!el) { el = document.createElement('meta'); el.setAttribute('property', prop); document.head.appendChild(el) }
    el.setAttribute('content', content)
  }
  if (title)       { document.title = title; set('og:title', title) }
  if (description) set('og:description', description)
  if (image)       set('og:image', image)
  if (url)         set('og:url', url)
  set('og:type', 'website')
}

// ─── Price formatter ──────────────────────────────────────────────────────────
function formatIQD(amount) {
  return Number(amount).toLocaleString('en-US') + ' د.ع'
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function VenuePage() {
  const { slug } = useParams()

  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activePhoto, setActivePhoto] = useState(null)
  const [calendarData, setCalendarData] = useState({})

  const appUrl = import.meta.env.VITE_APP_URL || 'https://app.evento.iq'

  useEffect(() => {
    setLoading(true)
    getPublicVenue(slug)
      .then(res => {
        const v = res.data?.data
        setVenue(v)
        if (v) {
          const photo = v.approved_photos?.[0]?.url || ''
          setOGMeta({
            title: v.name_ar || v.name,
            description: `${v.location_ar || v.location || ''} — ${v.capacity ? `سعة ${v.capacity} شخص` : ''}`,
            image: photo,
            url: window.location.href,
          })
          if (v.approved_photos?.length) setActivePhoto(v.approved_photos[0].url)
          // Firebase calendar data may be embedded in response
          if (v.calendar) setCalendarData(v.calendar)
        }
      })
      .catch(() => setError('القاعة غير موجودة أو غير متاحة'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="spinner" />
  if (error || !venue) return (
    <div className="page-wrap center p-6">
      <MagnifyingGlassIcon style={{ width: 60, height: 60, marginBottom: 12, opacity: 0.4 }} />
      <h2 className="h2">القاعة غير موجودة</h2>
      <p className="small mt-4">{error}</p>
    </div>
  )

  const v = venue
  const photos = v.approved_photos || []
  const menuItems = v.menu_items?.filter(m => m.is_approved) || []
  const pricingRules = v.pricing_rules?.filter(r => r.is_approved) || []
  const approvedVideo = v.videos?.find(vid => vid.is_approved)
  const bookUrl = `${appUrl}/login?redirect=/venues/${slug}`

  return (
    <div className="page-wrap">
      {/* Photo gallery / hero */}
      {photos.length > 0 ? (
        <div>
          <img
            src={activePhoto || photos[0].url}
            alt={v.name_ar || v.name}
            className="hero"
            style={{ objectFit: 'cover' }}
          />
          {photos.length > 1 && (
            <div className="gallery" style={{ padding: '4px 0' }}>
              {photos.map((p, i) => (
                <img
                  key={i}
                  src={p.url}
                  alt=""
                  style={{
                    width: '100%', aspectRatio: '1', objectFit: 'cover', cursor: 'pointer',
                    border: activePhoto === p.url ? '2px solid var(--primary)' : '2px solid transparent',
                  }}
                  onClick={() => setActivePhoto(p.url)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="hero-gradient">
          <BuildingOffice2Icon style={{ width: 52, height: 52, marginBottom: 12, color: 'white', opacity: 0.85 }} />
          <h1 className="h1" style={{ color: 'white' }}>{v.name_ar || v.name}</h1>
        </div>
      )}

      {/* Venue header */}
      <div className="section center">
        <h1 className="h1">{v.name_ar || v.name}</h1>
        {(v.location_ar || v.location) && (
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 15 }}>
            <MapPinIcon style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle' }} /> {v.location_ar || v.location}
          </p>
        )}
        {v.capacity && (
          <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
            <UsersIcon style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle' }} /> سعة {v.capacity} شخص
          </p>
        )}
      </div>

      {/* Venue details */}
      <div className="section card" style={{ margin: '0 16px 12px', borderRadius: 'var(--radius)' }}>
        {v.base_price_iqd && (
          <DetailRow Icon={BanknotesIcon} label="السعر الأساسي" value={formatIQD(v.base_price_iqd)} />
        )}
        {v.venue_type && (
          <DetailRow Icon={TagIcon} label="نوع القاعة" value={v.venue_type} />
        )}
        {(v.city_ar || v.city) && (
          <DetailRow Icon={MapPinIcon} label="المدينة" value={v.city_ar || v.city} />
        )}
        {v.address && (
          <DetailRow Icon={MapIcon} label="العنوان" value={v.address} />
        )}
        {v.lat && v.lng && (
          <a
            href={`https://maps.google.com/?q=${v.lat},${v.lng}`}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'block', marginTop: 10 }}
          >
            <button className="btn btn-outline w-full" style={{ marginTop: 0 }}>
              فتح على خرائط Google
            </button>
          </a>
        )}
      </div>

      {/* Description */}
      {(v.description_ar || v.description) && (
        <div className="section card" style={{ margin: '0 16px 12px', borderRadius: 'var(--radius)', padding: 20 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>عن القاعة</p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            {v.description_ar || v.description}
          </p>
        </div>
      )}

      {/* Video */}
      {approvedVideo && (
        <div style={{ margin: '0 16px 12px' }}>
          <p style={{ fontWeight: 600, marginBottom: 8, padding: '0 4px' }}>فيديو القاعة</p>
          <video
            src={approvedVideo.url}
            controls
            style={{ width: '100%', borderRadius: 'var(--radius)', display: 'block', maxHeight: 260, background: '#000' }}
          />
        </div>
      )}

      {/* Menu items */}
      {menuItems.length > 0 && (
        <div className="section card" style={{ margin: '0 16px 12px', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
          <p style={{ fontWeight: 600, marginBottom: 12 }}>قائمة الخدمات</p>
          {menuItems.map((item, i) => (
            <div key={i} className="menu-item">
              <div>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{item.name_ar || item.name}</div>
                {item.description_ar || item.description
                  ? <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
                      {item.description_ar || item.description}
                    </div>
                  : null
                }
              </div>
              {item.price_iqd && Number(item.price_iqd) > 0 ? (
                <span className="badge badge-amber">{`رسوم الخدمة: ${formatIQD(item.price_iqd)}`}</span>
              ) : (
                <span className="badge badge-green">مشمول مع القاعة</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pricing rules */}
      {pricingRules.length > 0 && (
        <div className="section card" style={{ margin: '0 16px 12px', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
          <p style={{ fontWeight: 600, marginBottom: 12 }}>باقات التسعير</p>
          {pricingRules.map((rule, i) => (
            <div key={i} className="menu-item">
              <div>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{rule.name_ar || rule.name}</div>
                {rule.description && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{rule.description}</div>
                )}
              </div>
              <div style={{ textAlign: 'left' }}>
                {rule.flat_price_iqd
                  ? <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>{formatIQD(rule.flat_price_iqd)}</span>
                  : rule.price_multiplier
                  ? <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15 }}>×{rule.price_multiplier}</span>
                  : null
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Availability calendar (read-only) */}
      {Object.keys(calendarData).length > 0 && (
        <div className="section card" style={{ margin: '0 16px 12px', borderRadius: 'var(--radius)', padding: '16px 20px' }}>
          <p style={{ fontWeight: 600, marginBottom: 12 }}>التقويم والتوفر</p>
          <CalendarLegend />
          <AvailabilityCalendar data={calendarData} />
        </div>
      )}

      {/* Book now CTA */}
      <div style={{ padding: '20px 16px' }}>
        <a href={bookUrl}>
          <button className="btn btn-primary w-full" style={{ fontSize: 17, padding: '16px 24px' }}>
            احجز الآن
          </button>
        </a>
        <p className="small mt-4" style={{ textAlign: 'center' }}>
          سيتم تحويلك لتسجيل الدخول ثم إتمام الحجز
        </p>
      </div>

      <div style={{ height: 40 }} />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({ Icon, label, value }) {
  return (
    <div className="detail-row">
      <span className="detail-icon">
        {Icon && <Icon style={{ width: 18, height: 18 }} />}
      </span>
      <div>
        <div className="detail-label">{label}</div>
        <div className="detail-value">{value}</div>
      </div>
    </div>
  )
}

function CalendarLegend() {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12, fontSize: 12 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: '#D1FAE5', display: 'inline-block' }} />
        متاح
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: '#FEF3C7', display: 'inline-block' }} />
        قيد المراجعة
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: '#FEE2E2', display: 'inline-block' }} />
        محجوز
      </span>
    </div>
  )
}

function AvailabilityCalendar({ data }) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun

  const monthName = today.toLocaleDateString('ar-IQ-u-nu-latn', { month: 'long', year: 'numeric' })

  const statusColor = (status) => {
    if (status === 'booked') return '#FEE2E2'
    if (status === 'pending') return '#FEF3C7'
    return '#D1FAE5'
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const dateKey = (d) => {
    const m = String(month + 1).padStart(2, '0')
    const day = String(d).padStart(2, '0')
    return `${year}-${m}-${day}`
  }

  return (
    <div>
      <p style={{ textAlign: 'center', fontWeight: 600, marginBottom: 10 }}>{monthName}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
        {['أح','إث','ثل','أر','خم','جم','سب'].map(d => (
          <div key={d} style={{ fontSize: 11, color: 'var(--text-hint)', paddingBottom: 4 }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />
          const key = dateKey(d)
          const status = data[key] || 'available'
          const isPast = new Date(key) < new Date(today.toDateString())
          return (
            <div
              key={key}
              style={{
                padding: '6px 2px',
                borderRadius: 6,
                background: isPast ? 'transparent' : statusColor(status),
                color: isPast ? 'var(--text-hint)' : 'var(--text-primary)',
                fontSize: 13,
                fontWeight: d === today.getDate() ? 700 : 400,
                border: d === today.getDate() ? '2px solid var(--primary)' : '2px solid transparent',
              }}
            >
              {d}
            </div>
          )
        })}
      </div>
    </div>
  )
}
