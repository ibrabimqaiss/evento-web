import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ListBulletIcon, CalendarDaysIcon, CheckCircleIcon, XCircleIcon,
  UserCircleIcon, PlusIcon,
} from '@heroicons/react/24/outline'
import {
  getOwnerBookings, getOwnerVenues, confirmBooking, cancelBooking,
  createOwnerBooking, fmtDate, fmtIQD, BOOKING_STATUS_LABELS, BOOKING_STATUS_CLASS,
} from '../../lib/ownerApi'

const TABS = [
  { label: 'الكل', value: '' },
  { label: 'معلق', value: 'pending' },
  { label: 'مؤكد', value: 'confirmed' },
  { label: 'مكتمل', value: 'completed' },
  { label: 'ملغي', value: 'cancelled_by_owner,cancelled_by_customer,rejected' },
]

const EVENT_TYPE_AR = {
  wedding: 'زفاف', graduation: 'تخرج', conference: 'مؤتمر',
  party: 'حفلة', birthday: 'عيد ميلاد', exhibition: 'معارض', other: 'أخرى',
}

const EVENT_TYPES_LIST = [
  ['wedding', 'زفاف'], ['conference', 'مؤتمر'], ['party', 'حفلة'],
  ['graduation', 'تخرج'], ['exhibition', 'معارض'], ['birthday', 'عيد ميلاد'], ['other', 'أخرى'],
]

const ARABIC_MONTHS = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
]
const ARABIC_DAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت']

const DOT_COLOR = {
  pending: '#FBBF24',
  confirmed: '#34D399',
  completed: '#60A5FA',
  rejected: '#F87171',
  cancelled_by_owner: '#F87171',
  cancelled_by_customer: '#F87171',
  no_show: '#F87171',
}

function getVenueName(b) {
  return b.venue_detail?.name_ar || b.venue_detail?.name || b.venue_name || b.venue?.name || '—'
}

function buildCalGrid(year, month) {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const Spinner = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7C3AED', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
  </div>
)

// ── Add Booking Modal ─────────────────────────────────────────────────────────
function AddBookingModal({ venues, initialDate, onClose, onSuccess }) {
  const emptyForm = {
    venue_id: venues[0]?.id || '',
    customer_name: '',
    customer_phone: '',
    event_type: 'wedding',
    event_date: initialDate || '',
    start_time: '18:00',
    end_time: '23:00',
    guest_count: '',
    total_amount: '',
    notes: '',
    status: 'pending',
  }
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (venues[0]?.id && !form.venue_id) {
      setForm(f => ({ ...f, venue_id: venues[0].id }))
    }
  }, [venues])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await createOwnerBooking({
        venue_id: form.venue_id,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        event_type: form.event_type,
        event_date: form.event_date,
        start_time: form.start_time || '18:00',
        end_time: form.end_time || null,
        guest_count: +form.guest_count || 1,
        total_amount: +form.total_amount || 0,
        notes: form.notes,
        status: form.status,
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  return (
    <div className="glass-modal-overlay" onClick={onClose}>
      <div
        className="glass-modal-panel"
        style={{ maxWidth: 560, padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: '20px' }}>
          إضافة حجز جديد
        </h3>

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: '16px', color: '#F87171', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="glass-label">القاعة</label>
            <select className="glass-select" value={form.venue_id} onChange={e => set('venue_id', e.target.value)} required>
              {venues.length === 0 && <option value="">لا توجد قاعات</option>}
              {venues.map(v => <option key={v.id} value={v.id}>{v.name_ar || v.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="glass-label">اسم العميل *</label>
              <input className="glass-input" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} required />
            </div>
            <div>
              <label className="glass-label">رقم الهاتف *</label>
              <input className="glass-input" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} dir="ltr" required placeholder="07xxxxxxxxx" />
            </div>
            <div>
              <label className="glass-label">نوع المناسبة</label>
              <select className="glass-select" value={form.event_type} onChange={e => set('event_type', e.target.value)}>
                {EVENT_TYPES_LIST.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="glass-label">حالة الحجز</label>
              <select className="glass-select" value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="pending">معلق</option>
                <option value="confirmed">مؤكد</option>
              </select>
            </div>
            <div>
              <label className="glass-label">تاريخ المناسبة *</label>
              <input className="glass-input" type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} dir="ltr" required />
            </div>
            <div>
              <label className="glass-label">عدد الضيوف *</label>
              <input className="glass-input" type="number" min={1} value={form.guest_count} onChange={e => set('guest_count', e.target.value)} dir="ltr" required />
            </div>
            <div>
              <label className="glass-label">وقت البدء</label>
              <input className="glass-input" type="time" value={form.start_time} onChange={e => set('start_time', e.target.value)} dir="ltr" />
            </div>
            <div>
              <label className="glass-label">وقت الانتهاء</label>
              <input className="glass-input" type="time" value={form.end_time} onChange={e => set('end_time', e.target.value)} dir="ltr" />
            </div>
          </div>

          <div>
            <label className="glass-label">المبلغ الإجمالي (د.ع)</label>
            <input className="glass-input" type="number" min={0} value={form.total_amount} onChange={e => set('total_amount', e.target.value)} dir="ltr" placeholder="0" />
          </div>
          <div>
            <label className="glass-label">ملاحظات</label>
            <textarea className="glass-textarea" value={form.notes} onChange={e => set('notes', e.target.value)} style={{ minHeight: '70px' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} className="glass-btn" style={{ flex: 1 }}>إلغاء</button>
            <button type="submit" disabled={saving} className="glass-btn glass-btn-primary" style={{ flex: 1 }}>
              {saving ? 'جاري الحفظ...' : <><PlusIcon style={{ width: 14, height: 14 }} /> إضافة الحجز</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OwnerBookings() {
  const [searchParams] = useSearchParams()
  const venueId = searchParams.get('venue_id')
  const initStatus = searchParams.get('status') || ''
  const [activeTab, setActiveTab] = useState(TABS.find(t => t.value === initStatus) ? initStatus : '')
  const [view, setView] = useState('list')

  // ── List state ──────────────────────────────────────────────────────────────
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  // ── Venues (for add modal) ──────────────────────────────────────────────────
  const [venues, setVenues] = useState([])

  // ── Add booking modal ──────────────────────────────────────────────────────
  const [addModal, setAddModal] = useState(null) // null | { date: '' }

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState('')

  // ── Customer profile modal ──────────────────────────────────────────────────
  const [customerModal, setCustomerModal] = useState(null)

  function openCustomer(b) {
    const same = bookings.filter(x => x.customer_name === b.customer_name && b.customer_name)
    setCustomerModal({ name: b.customer_name || '—', phone: b.customer_phone || '—', bookings: same })
  }

  // ── Calendar state ──────────────────────────────────────────────────────────
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calBookings, setCalBookings] = useState([])
  const [calLoading, setCalLoading] = useState(false)
  const [dayModal, setDayModal] = useState(null)
  const [hoveredDay, setHoveredDay] = useState(null)

  // ── List loader ─────────────────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (activeTab) params.status = activeTab
    if (venueId) params.venue_id = venueId
    getOwnerBookings(params)
      .then(res => {
        const d = res.data?.data ?? res.data
        setBookings(Array.isArray(d) ? d : (d?.results ?? []))
      })
      .finally(() => setLoading(false))
  }, [activeTab, venueId])

  useEffect(() => { if (view === 'list') load() }, [load, view])

  // ── Load venues once ────────────────────────────────────────────────────────
  useEffect(() => {
    getOwnerVenues().then(res => {
      const d = res.data?.data ?? res.data
      setVenues(Array.isArray(d) ? d : (d?.results ?? []))
    }).catch(() => {})
  }, [])

  // ── Calendar loader ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (view !== 'calendar') return
    setCalLoading(true)
    const firstDay = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`
    const lastDay = new Date(calYear, calMonth + 1, 0)
    const lastDayStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
    getOwnerBookings({ date_from: firstDay, date_to: lastDayStr })
      .then(res => {
        const d = res.data?.data ?? res.data
        setCalBookings(Array.isArray(d) ? d : (d?.results ?? []))
      })
      .finally(() => setCalLoading(false))
  }, [view, calYear, calMonth])

  const byDate = {}
  calBookings.forEach(b => {
    if (b.event_date) {
      if (!byDate[b.event_date]) byDate[b.event_date] = []
      byDate[b.event_date].push(b)
    }
  })

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleConfirm(id) {
    setActionId(id)
    try { await confirmBooking(id); load() } catch { } finally { setActionId(null) }
  }

  async function handleCancel() {
    if (!cancelModal) return
    setActionId(cancelModal)
    try { await cancelBooking(cancelModal, cancelReason); load() }
    finally { setActionId(null); setCancelModal(null); setCancelReason('') }
  }

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const calGrid = buildCalGrid(calYear, calMonth)
  const todayStr = today.toISOString().slice(0, 10)

  return (
    <div className="owner-page">
      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.5)', borderRadius: 12, padding: '12px 28px', color: '#34D399', fontSize: '14px', fontWeight: 600, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>الحجوزات</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>إدارة جميع حجوزات قاعاتك</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Add booking button */}
          <button onClick={() => setAddModal({ date: '' })} className="glass-btn glass-btn-primary">
            <PlusIcon style={{ width: 16, height: 16 }} /> إضافة حجز +
          </button>

          {/* View toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.08)', gap: '4px' }}>
            {[{ v: 'list', Icon: ListBulletIcon, label: 'قائمة' }, { v: 'calendar', Icon: CalendarDaysIcon, label: 'تقويم' }].map(({ v, Icon, label }) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '8px 18px', borderRadius: '9px', cursor: 'pointer', gap: '6px',
                  background: view === v ? 'rgba(124,58,237,0.3)' : 'transparent',
                  color: view === v ? '#A78BFA' : 'rgba(255,255,255,0.45)',
                  fontSize: '14px', fontWeight: 600, fontFamily: 'Cairo, sans-serif', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', border: 'none',
                }}
              >
                <Icon style={{ width: 16, height: 16 }} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── List View ──────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <>
          <div className="glass-tabs" style={{ marginBottom: '20px', flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t.value} className={`glass-tab${activeTab === t.value ? ' active' : ''}`} onClick={() => setActiveTab(t.value)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="glass-card-static">
            {loading ? <Spinner /> : bookings.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '15px' }}>لا توجد حجوزات</div>
            ) : (
              <div className="glass-table-wrap">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>العميل</th><th>القاعة</th><th>تاريخ الفعالية</th>
                      <th>النوع</th><th>الضيوف</th><th>المبلغ</th><th>الحالة</th><th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b.id}>
                        <td>
                          <button
                            onClick={() => openCustomer(b)}
                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '14px', padding: 0, display: 'flex', alignItems: 'center', gap: '5px' }}
                          >
                            <UserCircleIcon style={{ width: 15, height: 15, color: '#A78BFA', flexShrink: 0 }} />
                            {b.customer_name || '—'}
                          </button>
                        </td>
                        <td>{getVenueName(b)}</td>
                        <td>{fmtDate(b.event_date)}</td>
                        <td>{EVENT_TYPE_AR[b.event_type] || b.event_type || '—'}</td>
                        <td>{b.guest_count}</td>
                        <td style={{ direction: 'ltr', textAlign: 'right' }}>{fmtIQD(b.quoted_price_iqd)}</td>
                        <td>
                          <span className={BOOKING_STATUS_CLASS[b.status] || 'status-badge status-pending'}>
                            {BOOKING_STATUS_LABELS[b.status] || b.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <Link to={`/owner/bookings/${b.id}`} className="glass-btn glass-btn-sm">تفاصيل</Link>
                            {b.status === 'pending' && (
                              <button className="glass-btn glass-btn-sm glass-btn-success" disabled={actionId === b.id} onClick={() => handleConfirm(b.id)}>
                                {actionId === b.id ? '...' : <><CheckCircleIcon style={{ width: 13, height: 13 }} /> تأكيد</>}
                              </button>
                            )}
                            {(b.status === 'pending' || b.status === 'confirmed') && (
                              <button className="glass-btn glass-btn-sm glass-btn-danger" onClick={() => { setCancelModal(b.id); setCancelReason('') }}>
                                <XCircleIcon style={{ width: 13, height: 13 }} /> إلغاء
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Calendar View ───────────────────────────────────────────────────── */}
      {view === 'calendar' && (
        <div className="glass-card-static" style={{ padding: '24px' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button onClick={prevMonth} className="glass-btn glass-btn-sm" style={{ fontSize: '18px', padding: '8px 14px' }}>→</button>
            <div style={{ fontSize: '19px', fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>
              {ARABIC_MONTHS[calMonth]} {calYear}
            </div>
            <button onClick={nextMonth} className="glass-btn glass-btn-sm" style={{ fontSize: '18px', padding: '8px 14px' }}>←</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '6px' }}>
            {ARABIC_DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.38)', padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {calLoading ? <Spinner /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {calGrid.map((day, idx) => {
                if (day === null) return <div key={`e-${idx}`} style={{ minHeight: 70 }} />
                const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayBks = byDate[ds] || []
                const isToday = ds === todayStr
                const isPast = ds < todayStr
                const hasPending = dayBks.some(b => b.status === 'pending')
                const allConfirmed = dayBks.length > 0 && dayBks.every(b => b.status === 'confirmed')
                const isEmpty = dayBks.length === 0
                const isHovered = hoveredDay === ds

                return (
                  <div
                    key={ds}
                    onClick={() => {
                      if (dayBks.length > 0) setDayModal({ dateStr: ds, bookings: dayBks })
                      else setAddModal({ date: ds })
                    }}
                    onMouseEnter={() => setHoveredDay(ds)}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{
                      minHeight: 72, borderRadius: 12, padding: '8px 6px', position: 'relative',
                      cursor: 'pointer',
                      opacity: isPast && !isToday ? 0.55 : 1,
                      background: isToday
                        ? 'rgba(124,58,237,0.2)'
                        : isEmpty && isHovered ? 'rgba(52,211,153,0.08)'
                        : hasPending ? 'rgba(251,191,36,0.07)'
                        : allConfirmed ? 'rgba(52,211,153,0.07)'
                        : dayBks.length > 0 ? 'rgba(255,255,255,0.04)'
                        : 'rgba(255,255,255,0.02)',
                      border: isToday
                        ? '1px solid rgba(124,58,237,0.65)'
                        : isEmpty && isHovered ? '1px solid rgba(52,211,153,0.4)'
                        : dayBks.length > 0 ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(255,255,255,0.04)',
                      boxShadow: isToday
                        ? '0 0 14px rgba(124,58,237,0.28)'
                        : isEmpty && isHovered ? '0 0 12px rgba(52,211,153,0.15)' : 'none',
                      transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <div style={{
                      textAlign: 'center', fontSize: '13px', marginBottom: 5,
                      fontWeight: isToday ? 700 : 500,
                      color: isToday ? '#A78BFA' : isPast ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.82)',
                    }}>
                      {day}
                    </div>
                    {isEmpty && isHovered ? (
                      <div style={{ textAlign: 'center', fontSize: 18, color: '#34D399', lineHeight: 1 }}>+</div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                          {dayBks.slice(0, 5).map((b, i) => (
                            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: DOT_COLOR[b.status] || '#A78BFA' }} />
                          ))}
                          {dayBks.length > 5 && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>+{dayBks.length - 5}</span>}
                        </div>
                        {dayBks.length > 0 && (
                          <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 4 }}>
                            {dayBks.length} حجز
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
            {[['#FBBF24','معلق'],['#34D399','مؤكد'],['#60A5FA','مكتمل'],['#F87171','ملغي/مرفوض']].map(([c,l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.48)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />{l}
              </div>
            ))}
            <div style={{ fontSize: 12, color: 'rgba(52,211,153,0.7)', marginRight: 'auto' }}>
              اضغط على يوم فارغ لإضافة حجز
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ───────────────────────────────────────────────────── */}
      {cancelModal && (
        <div className="glass-modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="glass-modal-panel" style={{ maxWidth: 420, padding: '28px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', marginBottom: '16px' }}>إلغاء الحجز</h3>
            <label className="glass-label">سبب الإلغاء (اختياري)</label>
            <textarea className="glass-textarea" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="اكتب سبب إلغاء الحجز..." style={{ minHeight: '80px', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setCancelModal(null)} className="glass-btn" style={{ flex: 1 }}>تراجع</button>
              <button onClick={handleCancel} disabled={actionId === cancelModal} className="glass-btn glass-btn-danger" style={{ flex: 1 }}>
                {actionId === cancelModal ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Customer Profile Modal ─────────────────────────────────────────── */}
      {customerModal && (
        <div className="glass-modal-overlay" onClick={() => setCustomerModal(null)}>
          <div className="glass-modal-panel" style={{ maxWidth: 480, padding: '28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(124,58,237,0.2)', border: '2px solid rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCircleIcon style={{ width: 28, height: 28, color: '#A78BFA' }} />
                </div>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{customerModal.name}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', direction: 'ltr', textAlign: 'right' }}>{customerModal.phone}</div>
                </div>
              </div>
              <button onClick={() => setCustomerModal(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '22px', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'إجمالي الحجوزات', value: customerModal.bookings.length },
                { label: 'إجمالي الإنفاق', value: fmtIQD(customerModal.bookings.reduce((s, b) => s + parseFloat(b.quoted_price_iqd || 0), 0)) },
                { label: 'أول حجز', value: customerModal.bookings.reduce((m, b) => !m || b.created_at < m ? b.created_at : m, null) ? fmtDate(customerModal.bookings.reduce((m, b) => !m || b.created_at < m ? b.created_at : m, null)) : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#A78BFA', marginBottom: 4 }}>{value}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '10px' }}>آخر الحجوزات</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {customerModal.bookings.slice(0, 5).map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{EVENT_TYPE_AR[b.event_type] || b.event_type}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{fmtDate(b.event_date)}</div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13px', direction: 'ltr', color: '#34D399' }}>{fmtIQD(b.quoted_price_iqd)}</div>
                    <span className={BOOKING_STATUS_CLASS[b.status] || 'status-badge status-pending'} style={{ fontSize: '10px', padding: '2px 8px' }}>
                      {BOOKING_STATUS_LABELS[b.status] || b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Day Detail Modal ────────────────────────────────────────────────── */}
      {dayModal && (
        <div className="glass-modal-overlay" onClick={() => setDayModal(null)}>
          <div className="glass-modal-panel" style={{ maxWidth: 560, padding: '28px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
                حجوزات {fmtDate(dayModal.dateStr)}
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => { setDayModal(null); setAddModal({ date: dayModal.dateStr }) }}
                  className="glass-btn glass-btn-sm glass-btn-primary"
                >
                  <PlusIcon style={{ width: 13, height: 13 }} /> إضافة
                </button>
                <button onClick={() => setDayModal(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dayModal.bookings.map(b => (
                <div key={b.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.88)' }}>{b.customer_name || '—'}</span>
                    <span className={BOOKING_STATUS_CLASS[b.status] || 'status-badge status-pending'}>
                      {BOOKING_STATUS_LABELS[b.status] || b.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                    <span>{getVenueName(b)}</span>
                    <span>{b.guest_count} ضيف</span>
                    <span>{EVENT_TYPE_AR[b.event_type] || b.event_type || '—'}</span>
                  </div>
                  <Link to={`/owner/bookings/${b.id}`} className="glass-btn glass-btn-sm" style={{ marginTop: '10px', display: 'inline-flex' }}>
                    عرض التفاصيل ←
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Booking Modal ───────────────────────────────────────────────── */}
      {addModal && (
        <AddBookingModal
          venues={venues}
          initialDate={addModal.date}
          onClose={() => setAddModal(null)}
          onSuccess={() => {
            setAddModal(null)
            load()
            if (view === 'calendar') {
              // re-trigger calendar reload
              setCalBookings([])
              setCalLoading(true)
              const firstDay = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`
              const lastDay = new Date(calYear, calMonth + 1, 0)
              const lastDayStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
              getOwnerBookings({ date_from: firstDay, date_to: lastDayStr })
                .then(res => {
                  const d = res.data?.data ?? res.data
                  setCalBookings(Array.isArray(d) ? d : (d?.results ?? []))
                })
                .finally(() => setCalLoading(false))
            }
            showToast('تم إضافة الحجز بنجاح ✓')
          }}
        />
      )}
    </div>
  )
}
