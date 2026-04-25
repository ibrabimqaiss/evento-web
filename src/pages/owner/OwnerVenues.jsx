import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BuildingOffice2Icon, UsersIcon, BanknotesIcon, CalendarDaysIcon,
  PlusIcon, PencilIcon, StarIcon, CalculatorIcon, XMarkIcon,
  CheckCircleIcon, PrinterIcon,
} from '@heroicons/react/24/outline'
import { getOwnerVenues, getOwnerBookings, fmtIQD, VENUE_TYPE_LABELS } from '../../lib/ownerApi'

const STATUS_LABELS = { active: 'نشط', inactive: 'غير نشط', under_review: 'قيد المراجعة' }
const STATUS_CLASS = { active: 'status-badge status-active', inactive: 'status-badge status-inactive', under_review: 'status-badge status-review' }

const EVENT_TYPES = [['wedding', 'زفاف'], ['conference', 'مؤتمر'], ['party', 'حفلة'], ['graduation', 'تخرج'], ['birthday', 'عيد ميلاد']]

const SERVICES = [
  { key: 'catering', label: 'طعام وشراب', unit: 'per_person', defaultPrice: 15000 },
  { key: 'photography', label: 'تصوير', unit: 'flat', defaultPrice: 250000 },
  { key: 'decor', label: 'ديكور', unit: 'flat', defaultPrice: 300000 },
  { key: 'sound', label: 'نظام صوتي', unit: 'flat', defaultPrice: 150000 },
  { key: 'lighting', label: 'إضاءة', unit: 'flat', defaultPrice: 200000 },
  { key: 'security', label: 'أمن', unit: 'per_unit_per_hour', defaultPrice: 10000, unitLabel: 'حارس/ساعة' },
  { key: 'waiters', label: 'نادلين', unit: 'per_unit_per_hour', defaultPrice: 8000, unitLabel: 'نادل/ساعة' },
]

const DOT_COLOR = {
  pending: '#FBBF24', confirmed: '#34D399', completed: '#60A5FA',
  rejected: '#F87171', cancelled_by_owner: '#F87171', cancelled_by_customer: '#F87171',
}

const ARABIC_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
const ARABIC_DAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']

function buildCalGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

// ── Cost Calculator Modal ────────────────────────────────────────────────────
function CostCalculator({ venue, onClose }) {
  const [form, setForm] = useState({ event_type: 'wedding', guests: 100, hours: 4 })
  const [services, setServices] = useState({})
  const [servicePrices, setServicePrices] = useState(
    Object.fromEntries(SERVICES.map(s => [s.key, s.defaultPrice]))
  )
  const [serviceUnits, setServiceUnits] = useState(
    Object.fromEntries(SERVICES.filter(s => s.unit === 'per_unit_per_hour').map(s => [s.key, 1]))
  )
  const [showQuote, setShowQuote] = useState(false)

  const venuePrice = parseFloat(venue.base_price_iqd || 0)
  const cateringTotal = services.catering ? servicePrices.catering * form.guests : 0
  const flatServices = SERVICES.filter(s => s.unit === 'flat' && s.key !== 'catering' && services[s.key])
    .reduce((t, s) => t + servicePrices[s.key], 0)
  const unitServices = SERVICES.filter(s => s.unit === 'per_unit_per_hour' && services[s.key])
    .reduce((t, s) => t + servicePrices[s.key] * (serviceUnits[s.key] || 1) * form.hours, 0)
  const total = venuePrice + cateringTotal + flatServices + unitServices

  function toggleService(key) {
    setServices(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="glass-modal-overlay" onClick={onClose}>
      <div className="glass-modal-panel" style={{ maxWidth: 560, padding: '28px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CalculatorIcon style={{ width: 22, height: 22, color: '#A78BFA' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', margin: 0 }}>حاسبة التكلفة</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '22px', cursor: 'pointer' }}><XMarkIcon style={{ width: 20, height: 20 }} /></button>
        </div>

        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
          {venue.name_ar || venue.name} — السعر الأساسي: <span style={{ color: '#34D399', fontWeight: 700 }}>{fmtIQD(venuePrice)}</span>
        </div>

        {/* Event basics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div>
            <label className="glass-label">نوع المناسبة</label>
            <select className="glass-select" value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))} style={{ fontSize: '13px' }}>
              {EVENT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="glass-label">عدد الضيوف</label>
            <input className="glass-input" type="number" min={1} value={form.guests} onChange={e => setForm(f => ({ ...f, guests: +e.target.value }))} dir="ltr" />
          </div>
          <div>
            <label className="glass-label">عدد الساعات</label>
            <input className="glass-input" type="number" min={1} max={24} value={form.hours} onChange={e => setForm(f => ({ ...f, hours: +e.target.value }))} dir="ltr" />
          </div>
        </div>

        {/* Services */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>الخدمات</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {SERVICES.map(svc => (
              <div key={svc.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: services[svc.key] ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '10px 14px', border: `1px solid ${services[svc.key] ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`, flexWrap: 'wrap' }}>
                <button
                  onClick={() => toggleService(svc.key)}
                  style={{ width: 22, height: 22, borderRadius: '6px', border: 'none', cursor: 'pointer', background: services[svc.key] ? '#7C3AED' : 'rgba(255,255,255,0.1)', color: 'white', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {services[svc.key] ? <CheckCircleIcon style={{ width: 14, height: 14 }} /> : ''}
                </button>
                <span style={{ flex: 1, fontSize: '14px', color: services[svc.key] ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)', fontWeight: services[svc.key] ? 600 : 400 }}>{svc.label}</span>
                {svc.unit === 'per_unit_per_hour' && services[svc.key] && (
                  <input
                    type="number" min={1} value={serviceUnits[svc.key] || 1}
                    onChange={e => setServiceUnits(u => ({ ...u, [svc.key]: +e.target.value }))}
                    style={{ width: 50, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, color: 'white', padding: '4px 8px', fontSize: '13px', textAlign: 'center', outline: 'none' }}
                    dir="ltr"
                  />
                )}
                {svc.unit === 'per_unit_per_hour' && services[svc.key] && (
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{svc.unitLabel}</span>
                )}
                <input
                  type="number" min={0} value={servicePrices[svc.key]}
                  onChange={e => setServicePrices(p => ({ ...p, [svc.key]: +e.target.value }))}
                  style={{ width: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#34D399', padding: '4px 8px', fontSize: '13px', textAlign: 'left', outline: 'none', direction: 'ltr' }}
                />
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', minWidth: 30 }}>
                  {svc.unit === 'per_person' ? 'د.ع/شخص' : svc.unit === 'flat' ? 'د.ع' : 'د.ع'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>تفصيل التكلفة</div>
          {[
            { label: 'إيجار القاعة', value: venuePrice },
            ...(services.catering ? [{ label: `طعام وشراب (${form.guests} × ${fmtIQD(servicePrices.catering)})`, value: cateringTotal }] : []),
            ...SERVICES.filter(s => s.unit === 'flat' && services[s.key]).map(s => ({ label: s.label, value: servicePrices[s.key] })),
            ...SERVICES.filter(s => s.unit === 'per_unit_per_hour' && services[s.key]).map(s => ({
              label: `${s.label} (${serviceUnits[s.key]} × ${form.hours}ساعة)`,
              value: servicePrices[s.key] * (serviceUnits[s.key] || 1) * form.hours,
            })),
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: 'rgba(255,255,255,0.7)' }}>
              <span>{label}</span>
              <span style={{ direction: 'ltr', color: 'rgba(255,255,255,0.85)' }}>{fmtIQD(value)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700 }}>
            <span style={{ color: 'rgba(255,255,255,0.9)' }}>المجموع الكلي</span>
            <span style={{ color: '#34D399', direction: 'ltr' }}>{fmtIQD(total)}</span>
          </div>
        </div>

        <button
          onClick={() => setShowQuote(true)}
          className="glass-btn glass-btn-primary w-full"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <PrinterIcon style={{ width: 16, height: 16 }} /> إنشاء عرض سعر
        </button>

        {/* Quote print view */}
        {showQuote && (
          <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '20px', border: '1px solid rgba(255,255,255,0.08)' }} id="quote-print">
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>عرض سعر — Evento</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>{new Date().toLocaleDateString('ar-IQ')}</div>
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '12px' }}>
              <strong>القاعة:</strong> {venue.name_ar || venue.name}<br />
              <strong>نوع المناسبة:</strong> {EVENT_TYPES.find(([v]) => v === form.event_type)?.[1]}<br />
              <strong>عدد الضيوف:</strong> {form.guests}<br />
              <strong>المدة:</strong> {form.hours} ساعة
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
              <div style={{ fontWeight: 700, marginBottom: '6px', color: 'rgba(255,255,255,0.9)' }}>تفاصيل التكلفة:</div>
              إيجار القاعة: {fmtIQD(venuePrice)}<br />
              {services.catering && <>طعام وشراب: {fmtIQD(cateringTotal)}<br /></>}
              {SERVICES.filter(s => s.unit === 'flat' && services[s.key]).map(s => <>{s.label}: {fmtIQD(servicePrices[s.key])}<br /></>)}
              {SERVICES.filter(s => s.unit === 'per_unit_per_hour' && services[s.key]).map(s => <>{s.label}: {fmtIQD(servicePrices[s.key] * (serviceUnits[s.key] || 1) * form.hours)}<br /></>)}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px' }}>
              <span>المجموع الكلي</span>
              <span style={{ color: '#34D399', direction: 'ltr' }}>{fmtIQD(total)}</span>
            </div>
            <button onClick={() => window.print()} className="glass-btn glass-btn-sm" style={{ marginTop: '12px' }}>
              <PrinterIcon style={{ width: 13, height: 13 }} /> طباعة
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Venue Availability Calendar Modal ────────────────────────────────────────
function VenueCalendarModal({ venue, onClose }) {
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [bookings, setBookings] = useState([])
  const [blocked, setBlocked] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`evento_blocked_${venue.id}`) || '[]') } catch { return [] }
  })

  useEffect(() => {
    const firstDay = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`
    const lastDay = new Date(calYear, calMonth + 1, 0)
    const lastDayStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
    getOwnerBookings({ venue_id: venue.id, date_from: firstDay, date_to: lastDayStr })
      .then(res => {
        const d = res.data?.data ?? res.data
        setBookings(Array.isArray(d) ? d : (d?.results ?? []))
      })
      .catch(() => {})
  }, [calYear, calMonth, venue.id])

  function toggleBlock(ds) {
    const next = blocked.includes(ds) ? blocked.filter(d => d !== ds) : [...blocked, ds]
    setBlocked(next)
    localStorage.setItem(`evento_blocked_${venue.id}`, JSON.stringify(next))
  }

  const byDate = {}
  bookings.forEach(b => {
    if (b.event_date) {
      if (!byDate[b.event_date]) byDate[b.event_date] = []
      byDate[b.event_date].push(b)
    }
  })

  const calGrid = buildCalGrid(calYear, calMonth)
  const todayStr = today.toISOString().slice(0, 10)

  return (
    <div className="glass-modal-overlay" onClick={onClose}>
      <div className="glass-modal-panel" style={{ maxWidth: 520, padding: '28px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
            تقويم التوفر — {venue.name_ar || venue.name}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><XMarkIcon style={{ width: 18, height: 18 }} /></button>
        </div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <button onClick={() => { if (calMonth === 0) { setCalYear(y => y-1); setCalMonth(11) } else setCalMonth(m => m-1) }} className="glass-btn glass-btn-sm" style={{ padding: '6px 12px' }}>→</button>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{ARABIC_MONTHS[calMonth]} {calYear}</span>
          <button onClick={() => { if (calMonth === 11) { setCalYear(y => y+1); setCalMonth(0) } else setCalMonth(m => m+1) }} className="glass-btn glass-btn-sm" style={{ padding: '6px 12px' }}>←</button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '4px' }}>
          {ARABIC_DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.35)', padding: '3px 0' }}>{d}</div>)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {calGrid.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} style={{ minHeight: 50 }} />
            const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const dayBks = byDate[ds] || []
            const isBlocked = blocked.includes(ds)
            const isToday = ds === todayStr
            const isPast = ds < todayStr
            const hasBooked = dayBks.some(b => b.status === 'confirmed' || b.status === 'completed')
            const hasPending = dayBks.some(b => b.status === 'pending')

            let bg = 'rgba(52,211,153,0.07)'
            if (isBlocked) bg = 'rgba(156,163,175,0.15)'
            else if (hasBooked) bg = 'rgba(248,113,113,0.15)'
            else if (hasPending) bg = 'rgba(251,191,36,0.12)'

            return (
              <div
                key={ds}
                onClick={() => !isPast && toggleBlock(ds)}
                style={{
                  minHeight: 50, borderRadius: 8, padding: '4px 3px', textAlign: 'center',
                  cursor: isPast ? 'default' : 'pointer',
                  background: isToday ? 'rgba(124,58,237,0.25)' : bg,
                  border: isToday ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.05)',
                  opacity: isPast ? 0.45 : 1,
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: isToday ? 700 : 500, color: isToday ? '#A78BFA' : isPast ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.75)', marginBottom: 3 }}>{day}</div>
                {isBlocked && <div style={{ fontSize: '9px', color: '#9CA3AF' }}>محجوب</div>}
                {hasBooked && !isBlocked && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#F87171', margin: '0 auto' }} />}
                {hasPending && !hasBooked && !isBlocked && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FBBF24', margin: '0 auto' }} />}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '11px' }}>
          {[['#34D399', 'متاح'], ['#FBBF24', 'معلق'], ['#F87171', 'محجوز'], ['#9CA3AF', 'محجوب يدوياً']].map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.5)' }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
            </div>
          ))}
        </div>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '10px' }}>اضغط على يوم لحجبه أو إلغاء حجبه يدوياً</p>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function OwnerVenues() {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [calcVenue, setCalcVenue] = useState(null)
  const [calVenue, setCalVenue] = useState(null)

  useEffect(() => {
    getOwnerVenues()
      .then((res) => {
        const data = res.data?.data ?? res.data
        setVenues(Array.isArray(data) ? data : (data?.results ?? []))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="owner-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>القاعات</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>إدارة قاعاتك وإعداداتها</p>
        </div>
        <Link to="/owner/venues/new" className="glass-btn glass-btn-primary">
          <PlusIcon style={{ width: 16, height: 16 }} /> قاعة جديدة
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 20 }} />)}
        </div>
      ) : venues.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <BuildingOffice2Icon style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.3)', marginBottom: '16px' }} />
          <div style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>لا توجد قاعات بعد</div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>أضف قاعتك الأولى للبدء في استقبال الحجوزات</p>
          <Link to="/owner/venues/new" className="glass-btn glass-btn-primary"><PlusIcon style={{ width: 16, height: 16 }} /> إضافة قاعة</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {venues.map((v) => (
            <VenueCard key={v.id} venue={v} onCalc={() => setCalcVenue(v)} onCal={() => setCalVenue(v)} />
          ))}
        </div>
      )}

      {calcVenue && <CostCalculator venue={calcVenue} onClose={() => setCalcVenue(null)} />}
      {calVenue && <VenueCalendarModal venue={calVenue} onClose={() => setCalVenue(null)} />}
    </div>
  )
}

function VenueCard({ venue, onCalc, onCal }) {
  const coverImg = venue.cover_image?.card_url || venue.cover_image?.image_url || null
  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      {/* Cover */}
      <div style={{
        height: '140px',
        background: coverImg ? `url(${coverImg}) center/cover` : 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.3))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!coverImg && <BuildingOffice2Icon style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.35)' }} />}
      </div>

      <div style={{ padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{venue.name_ar || venue.name}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
              {VENUE_TYPE_LABELS[venue.venue_type] || venue.venue_type} · {venue.city}
            </div>
          </div>
          <span className={STATUS_CLASS[venue.status] || 'status-badge status-review'}>
            {STATUS_LABELS[venue.status] || venue.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '14px 0' }}>
          <InfoChip Icon={UsersIcon} label="سعة قصوى" value={`${venue.max_capacity} شخص`} />
          <InfoChip Icon={BanknotesIcon} label="السعر الأساسي" value={fmtIQD(venue.base_price_iqd)} />
          <InfoChip Icon={CalendarDaysIcon} label="إجمالي الحجوزات" value={venue.total_bookings ?? 0} />
          <InfoChip Icon={StarIcon} label="التقييم" value={`${venue.avg_rating ?? 0} / 5`} />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <Link to={`/owner/venues/${venue.slug}/edit`} className="glass-btn glass-btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
            <PencilIcon style={{ width: 13, height: 13 }} /> تعديل
          </Link>
          <Link to={`/owner/bookings?venue_id=${venue.id}`} className="glass-btn glass-btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
            <CalendarDaysIcon style={{ width: 13, height: 13 }} /> الحجوزات
          </Link>
          <button onClick={onCalc} className="glass-btn glass-btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
            <CalculatorIcon style={{ width: 13, height: 13 }} /> حاسبة
          </button>
          <button onClick={onCal} className="glass-btn glass-btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
            <CalendarDaysIcon style={{ width: 13, height: 13 }} /> تقويم
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoChip({ Icon, label, value }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '8px 10px', minWidth: 0 }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {Icon && <Icon style={{ width: 11, height: 11, flexShrink: 0 }} />}
        {label}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}
