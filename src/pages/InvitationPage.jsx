import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  CalendarDaysIcon, ClockIcon, MapPinIcon, MapIcon,
  UserGroupIcon, ShieldCheckIcon, NoSymbolIcon,
  CheckCircleIcon, XCircleIcon, LockClosedIcon,
} from '@heroicons/react/24/outline'
import { getPublicEvent, submitRSVP, isAuthenticated } from '../lib/api.js'

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

// ─── Arabic date/time formatter ───────────────────────────────────────────────
function formatArabicDate(dateStr) {
  if (!dateStr) return ''
  try {
    const dt = new Date(dateStr + 'T00:00:00')
    return dt.toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return dateStr }
}

function formatTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'مساءً' : 'صباحاً'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padLeft ? String(m).padStart(2, '0') : m} ${period}`
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InvitationPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loggedIn] = useState(isAuthenticated)
  const [rsvpDone, setRsvpDone] = useState(null) // 'accepted' | 'declined'
  const [plusOnes, setPlusOnes] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [rsvpError, setRsvpError] = useState(null)

  useEffect(() => {
    setLoading(true)
    getPublicEvent(slug)
      .then(res => {
        const e = res.data?.data
        setEvent(e)
        if (e) {
          const hosts = (e.host_names || []).join(' & ')
          const title = e.title_ar || e.title
          setOGMeta({
            title: `${title} — ${hosts}`,
            description: `أنت مدعو! ${e.event_date} | ${e.venue_display_name || e.venue_name_ar || e.venue_name || ''}`,
            image: e.cover_image_url || '',
            url: window.location.href,
          })
        }
      })
      .catch(() => setError('الدعوة غير موجودة أو انتهت صلاحيتها'))
      .finally(() => setLoading(false))
  }, [slug])

  async function handleRSVP(status) {
    if (!loggedIn) {
      navigate(`/login?redirect=/e/${slug}`)
      return
    }
    setSubmitting(true)
    setRsvpError(null)
    try {
      await submitRSVP(slug, { rsvpStatus: status, plusOnes })
      setRsvpDone(status)
    } catch (err) {
      const errData = err.response?.data
      if (err.response?.status === 401) {
        setRsvpError('يجب تسجيل الدخول للرد على الدعوة')
      } else {
        setRsvpError(errData?.error?.message || 'حدث خطأ، يرجى المحاولة لاحقاً')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="spinner" />
  if (error || !event) return (
    <div className="page-wrap center p-6">
      <div style={{ fontSize: 60, marginBottom: 12 }}>🔍</div>
      <h2 className="h2">الدعوة غير موجودة</h2>
      <p className="small mt-4">{error}</p>
    </div>
  )

  const e = event
  const hosts = (e.host_names || []).join(' & ')
  const rsvpEnabled = e.rsvp_enabled
  const dressCode = e.dress_code_ar || e.dress_code
  const instructions = e.custom_instructions_ar || e.custom_instructions
  const venueName = e.venue_display_name || e.venue_name_ar || e.venue_name
  const venueAddress = e.venue_display_address || e.venue_address
  const deadlinePassed = e.rsvp_deadline && new Date(e.rsvp_deadline) < new Date()

  return (
    <div className="page-wrap">
      {/* Cover */}
      {e.cover_image_url
        ? <img src={e.cover_image_url} alt="غلاف الدعوة" className="hero" />
        : <div className="hero-gradient">
            <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 8 }}>{e.event_type || 'دعوة'}</div>
            <h1 className="h1" style={{ color: 'white' }}>{e.title_ar || e.title}</h1>
            {hosts && <p style={{ color: 'rgba(255,255,255,0.85)', marginTop: 8, fontSize: 18, fontWeight: 700 }}>{hosts}</p>}
          </div>
      }

      <div className="section center">
        {e.event_type && <div className="badge badge-amber" style={{ marginBottom: 8 }}>{e.event_type}</div>}
        <h1 className="h1">{e.title_ar || e.title}</h1>
        {hosts && <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--primary)', marginTop: 8 }}>{hosts}</p>}
      </div>

      {/* Date & time */}
      <div className="section card" style={{ margin: '0 16px 12px', borderRadius: 'var(--radius)' }}>
        <DetailRow Icon={CalendarDaysIcon} label="التاريخ" value={formatArabicDate(e.event_date)} />
        {e.start_time && <DetailRow Icon={ClockIcon} label="الوقت" value={formatTime(e.start_time)} />}
      </div>

      {/* Venue */}
      {venueName && (
        <div className="section card" style={{ margin: '0 16px 12px', borderRadius: 'var(--radius)' }}>
          <DetailRow Icon={MapPinIcon} label="القاعة" value={venueName} />
          {venueAddress && <DetailRow Icon={MapIcon} label="العنوان" value={venueAddress} />}
          {e.venue_lat && e.venue_lng && (
            <a
              href={`https://maps.google.com/?q=${e.venue_lat},${e.venue_lng}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', marginTop: 10, textAlign: 'center' }}
            >
              <button className="btn btn-outline w-full" style={{ marginTop: 0 }}>
                فتح على خرائط Google
              </button>
            </a>
          )}
        </div>
      )}

      {/* Dress code */}
      {dressCode && (
        <div className="section card" style={{ margin: '0 16px 12px', borderRadius: 'var(--radius)' }}>
          <DetailRow Icon={UserGroupIcon} label="كود الأزياء" value={dressCode} />
        </div>
      )}

      {/* Kids policy */}
      <div className="section card" style={{ margin: '0 16px 12px', borderRadius: 'var(--radius)' }}>
        <DetailRow
          Icon={e.allow_kids ? ShieldCheckIcon : NoSymbolIcon}
          label="سياسة الأطفال"
          value={e.allow_kids ? 'الأطفال مرحب بهم' : 'للكبار فقط'}
        />
      </div>

      {/* Custom instructions */}
      {instructions && (
        <div className="section card" style={{ margin: '0 16px 12px', borderRadius: 'var(--radius)', padding: 20 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>تعليمات خاصة</p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{instructions}</p>
        </div>
      )}

      {/* RSVP section */}
      {rsvpEnabled && (
        <div style={{ padding: '0 16px', marginTop: 20 }}>
          {rsvpDone ? (
            <ThankYou status={rsvpDone} />
          ) : deadlinePassed ? (
            <div className="calendar-note">انتهت مهلة الرد على الدعوة</div>
          ) : !loggedIn ? (
            <LoginPrompt slug={slug} />
          ) : (
            <RSVPForm
              plusOnes={plusOnes}
              onPlusOnesChange={setPlusOnes}
              onAccept={() => handleRSVP('accepted')}
              onDecline={() => handleRSVP('declined')}
              submitting={submitting}
              error={rsvpError}
            />
          )}
        </div>
      )}

      <div style={{ height: 60 }} />
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

function RSVPForm({ plusOnes, onPlusOnesChange, onAccept, onDecline, submitting, error }) {
  return (
    <div className="rsvp-box">
      <h3 className="h3">ردّك على الدعوة</h3>
      <p className="small mt-4">هل ستحضر الحفل؟</p>

      <div className="plus-ones-row" style={{ marginTop: 16 }}>
        <span style={{ fontSize: 14 }}>مرافقون إضافيون:</span>
        <button className="plus-ones-btn" onClick={() => plusOnes > 0 && onPlusOnesChange(plusOnes - 1)}>−</button>
        <span style={{ fontWeight: 700, fontSize: 18, minWidth: 24, textAlign: 'center' }}>{plusOnes}</span>
        <button className="plus-ones-btn" onClick={() => plusOnes < 10 && onPlusOnesChange(plusOnes + 1)}>+</button>
      </div>

      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 14 }}>
          {error}
        </div>
      )}

      <div className="rsvp-buttons">
        <button
          className="btn btn-success"
          onClick={onAccept}
          disabled={submitting}
          style={{ opacity: submitting ? 0.7 : 1 }}
        >
          <CheckCircleIcon style={{ width: 18, height: 18, display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /> سأحضر
        </button>
        <button
          className="btn btn-danger-outline"
          onClick={onDecline}
          disabled={submitting}
          style={{ opacity: submitting ? 0.7 : 1 }}
        >
          <XCircleIcon style={{ width: 18, height: 18, display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /> لن أحضر
        </button>
      </div>

      {submitting && <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-secondary)' }}>جاري الإرسال...</div>}
    </div>
  )
}

function LoginPrompt({ slug }) {
  const loginUrl = `${import.meta.env.VITE_APP_URL || 'https://app.evento.iq'}/login?redirect=/e/${slug}`

  return (
    <div className="login-prompt">
      <LockClosedIcon style={{ width: 36, height: 36, marginBottom: 12, color: 'var(--primary, #7C3AED)' }} />
      <h3 className="h3">سجّل الدخول للرد</h3>
      <p className="small mt-4">للرد على الدعوة، يرجى تسجيل الدخول</p>
      <div className="login-prompt-buttons">
        <a href={loginUrl}>
          <button className="btn btn-primary w-full">تسجيل الدخول</button>
        </a>
        <a href={`${loginUrl.replace('/login', '/register')}`}>
          <button className="btn btn-outline w-full">إنشاء حساب</button>
        </a>
      </div>
    </div>
  )
}

function ThankYou({ status }) {
  const accepted = status === 'accepted'
  return (
    <div className="thankyou-box" style={{ background: accepted ? '#D1FAE5' : '#F3F4F6' }}>
      <div style={{ fontSize: 48 }}>{accepted ? '🎉' : '😔'}</div>
      <h3 className="h3 mt-4">شكراً على ردك!</h3>
      <p className="small mt-4">
        {accepted ? 'نتطلع إلى رؤيتك في الحفل!' : 'نأسف لعدم تمكنك من الحضور'}
      </p>
    </div>
  )
}
