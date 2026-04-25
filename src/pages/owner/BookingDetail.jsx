import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  CheckCircleIcon, XCircleIcon, CheckBadgeIcon, CalendarDaysIcon,
  CreditCardIcon, DocumentTextIcon, TagIcon, UserCircleIcon,
  PhoneIcon, ChatBubbleLeftIcon, ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import {
  getOwnerBookingDetail, confirmBooking, completeBooking, cancelBooking,
  getOwnerBookings, fmtDate, fmtIQD, BOOKING_STATUS_LABELS, BOOKING_STATUS_CLASS,
} from '../../lib/ownerApi'

const EVENT_TYPE_AR = {
  wedding: 'حفل زفاف', graduation: 'تخرج', conference: 'مؤتمر',
  party: 'حفلة', birthday: 'عيد ميلاد', other: 'أخرى',
}

const PRIORITY_OPTS = [
  { key: 'normal', label: 'عادي', color: 'rgba(255,255,255,0.5)' },
  { key: 'important', label: 'مهم', color: '#FBBF24' },
  { key: 'urgent', label: 'عاجل', color: '#F87171' },
]

const QUICK_TAGS = ['VIP', 'عميل جديد', 'تأجيل محتمل', 'مشكلة دفع']

const PAYMENT_METHODS = [['cash', 'نقد'], ['transfer', 'تحويل بنكي'], ['card', 'بطاقة']]

// ── localStorage helpers ───────────────────────────────────────────────────
function notesKey(id) { return `evento_booking_notes_${id}` }
function loadNotes(id) {
  try { return JSON.parse(localStorage.getItem(notesKey(id)) || '{"text":"","priority":"normal","tags":[]}') }
  catch { return { text: '', priority: 'normal', tags: [] } }
}
function saveNotes(id, data) { localStorage.setItem(notesKey(id), JSON.stringify(data)) }

function paymentsKey(id) { return `evento_booking_payments_${id}` }
function loadPayments(id) {
  try { return JSON.parse(localStorage.getItem(paymentsKey(id)) || '[]') } catch { return [] }
}
function savePayments(id, data) { localStorage.setItem(paymentsKey(id), JSON.stringify(data)) }

// ── ICS calendar helper ────────────────────────────────────────────────────
function downloadICS(booking) {
  const dt = booking.event_date?.replace(/-/g, '') || ''
  const vname = booking.venue_detail?.name_ar || booking.venue_detail?.name || ''
  const addr = booking.venue_detail?.address || ''
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Evento//AR',
    'BEGIN:VEVENT',
    `DTSTART:${dt}T${(booking.start_time || '18:00').replace(':', '')}00`,
    `DTEND:${dt}T${(booking.start_time || '18:00').replace(':', '')}00`,
    `SUMMARY:${EVENT_TYPE_AR[booking.event_type] || booking.event_type} - ${booking.customer_name || ''}`,
    `LOCATION:${vname} ${addr}`,
    `DESCRIPTION:عدد الضيوف: ${booking.guest_count}\\nالمبلغ: ${fmtIQD(booking.quoted_price_iqd)}\\nملاحظات: ${booking.notes || '—'}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = `evento_booking_${booking.id?.slice(0, 8) || 'event'}.ics`; a.click()
}

function googleCalUrl(booking) {
  const dt = booking.event_date?.replace(/-/g, '') || ''
  const time = (booking.start_time || '18:00').replace(':', '')
  const vname = booking.venue_detail?.name_ar || booking.venue_detail?.name || ''
  const title = encodeURIComponent(`${EVENT_TYPE_AR[booking.event_type] || ''} - ${booking.customer_name || ''}`)
  const details = encodeURIComponent(`ضيوف: ${booking.guest_count} | ${fmtIQD(booking.quoted_price_iqd)}`)
  const loc = encodeURIComponent(vname)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dt}T${time}00/${dt}T${time}00&details=${details}&location=${loc}`
}

export default function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [error, setError] = useState('')

  // Notes state
  const [notes, setNotes] = useState({ text: '', priority: 'normal', tags: [] })
  const [notesSaved, setNotesSaved] = useState(false)

  // Payment state
  const [payments, setPayments] = useState([])
  const [payModal, setPayModal] = useState(false)
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash', date: new Date().toISOString().slice(0, 10), note: '' })

  // Customer profile
  const [customerModal, setCustomerModal] = useState(null)
  const [customerBookings, setCustomerBookings] = useState([])

  function load() {
    setLoading(true)
    getOwnerBookingDetail(id)
      .then(res => {
        const b = res.data?.data ?? res.data
        setBooking(b)
      })
      .catch(() => setError('تعذر تحميل تفاصيل الحجز'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    setNotes(loadNotes(id))
    setPayments(loadPayments(id))
  }, [id])

  function saveNote() {
    saveNotes(id, notes)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  function toggleTag(tag) {
    const next = notes.tags.includes(tag)
      ? notes.tags.filter(t => t !== tag)
      : [...notes.tags, tag]
    setNotes(n => ({ ...n, tags: next }))
  }

  function addPayment() {
    if (!payForm.amount) return
    const next = [...payments, { ...payForm, id: Date.now(), amount: +payForm.amount }]
    savePayments(id, next)
    setPayments(next)
    setPayModal(false)
    setPayForm({ amount: '', method: 'cash', date: new Date().toISOString().slice(0, 10), note: '' })
  }

  function removePayment(pid) {
    const next = payments.filter(p => p.id !== pid)
    savePayments(id, next)
    setPayments(next)
  }

  function openCustomer(b) {
    setCustomerModal(b)
    getOwnerBookings({ limit: 50 }).then(res => {
      const d = res.data?.data ?? res.data
      const all = Array.isArray(d) ? d : (d?.results ?? [])
      setCustomerBookings(all.filter(x => x.customer_name === b.customer_name && b.customer_name))
    }).catch(() => setCustomerBookings([]))
  }

  async function act(action) {
    setActionLoading(action)
    setError('')
    try {
      if (action === 'confirm') await confirmBooking(id)
      if (action === 'complete') await completeBooking(id)
      if (action === 'cancel') { await cancelBooking(id, cancelReason); setCancelModal(false) }
      load()
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.detail || 'حدث خطأ')
    } finally { setActionLoading('') }
  }

  if (loading) return (
    <div style={{ padding: '40px' }}>
      <div className="skeleton" style={{ height: 400, borderRadius: 20 }} />
    </div>
  )

  if (!booking) return (
    <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
      {error || 'الحجز غير موجود'}
    </div>
  )

  const status = booking.status
  const canConfirm = status === 'pending'
  const canComplete = status === 'confirmed'
  const canCancel = status === 'pending' || status === 'confirmed'

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const remaining = parseFloat(booking.quoted_price_iqd || 0) - totalPaid
  const paidPct = booking.quoted_price_iqd ? Math.min((totalPaid / parseFloat(booking.quoted_price_iqd)) * 100, 100) : 0

  const priorityOpt = PRIORITY_OPTS.find(p => p.key === notes.priority) || PRIORITY_OPTS[0]

  return (
    <div className="owner-page" style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Back */}
      <Link to="/owner/bookings" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px', textDecoration: 'none' }}>
        ← العودة للحجوزات
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>تفاصيل الحجز</h1>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', direction: 'ltr', textAlign: 'right' }}>#{id?.slice(0, 8)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {notes.priority !== 'normal' && (
            <span style={{ padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, color: priorityOpt.color, background: `${priorityOpt.color}18`, border: `1px solid ${priorityOpt.color}44` }}>
              {priorityOpt.label}
            </span>
          )}
          <span className={BOOKING_STATUS_CLASS[status] || 'status-badge status-pending'} style={{ fontSize: '14px', padding: '8px 18px' }}>
            {BOOKING_STATUS_LABELS[status] || status}
          </span>
        </div>
      </div>

      {/* Quick tags display */}
      {notes.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {notes.tags.map(tag => (
            <span key={tag} style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'rgba(167,139,250,0.15)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.3)' }}>{tag}</span>
          ))}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '12px', color: '#F87171', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
        <InfoCard title="معلومات العميل">
          <Row label="الاسم" value={
            <button
              onClick={() => openCustomer(booking)}
              style={{ background: 'none', border: 'none', color: '#A78BFA', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '14px', fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <UserCircleIcon style={{ width: 15, height: 15 }} />
              {booking.customer_name || booking.customer?.full_name || '—'}
            </button>
          } />
          <Row label="الهاتف" value={booking.customer_phone || booking.customer?.phone || '—'} ltr />
        </InfoCard>
        <InfoCard title="معلومات الفعالية">
          <Row label="القاعة" value={booking.venue_detail?.name_ar || booking.venue_detail?.name || '—'} />
          <Row label="نوع الفعالية" value={EVENT_TYPE_AR[booking.event_type] || booking.event_type || '—'} />
          <Row label="تاريخ الفعالية" value={fmtDate(booking.event_date)} />
          <Row label="وقت البدء" value={booking.start_time || '—'} ltr />
        </InfoCard>
      </div>

      {/* Cost Breakdown */}
      <div className="glass-card-static" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCardIcon style={{ width: 18, height: 18, color: '#A78BFA' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>التفاصيل المالية</span>
          </div>
          <button onClick={() => setPayModal(true)} className="glass-btn glass-btn-sm glass-btn-primary">
            <CreditCardIcon style={{ width: 13, height: 13 }} /> تسجيل دفعة
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <MetricBox label="عدد الضيوف" value={`${booking.guest_count} شخص`} color="rgba(255,255,255,0.8)" />
          <MetricBox label="المبلغ الإجمالي" value={fmtIQD(booking.quoted_price_iqd)} color="#34D399" />
          <MetricBox label="المدفوع" value={fmtIQD(totalPaid)} color="#60A5FA" />
          <MetricBox label="المتبقي" value={fmtIQD(Math.max(remaining, 0))} color={remaining > 0 ? '#FBBF24' : '#34D399'} />
        </div>

        {/* Payment progress bar */}
        <div style={{ marginBottom: payments.length > 0 ? '14px' : 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>
            <span>نسبة السداد</span><span>{paidPct.toFixed(0)}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
            <div style={{ height: '100%', borderRadius: 3, width: `${paidPct}%`, background: paidPct >= 100 ? '#34D399' : '#A78BFA', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>سجل الدفعات</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {payments.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 12px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#34D399', marginLeft: '8px', direction: 'ltr', display: 'inline-block' }}>{fmtIQD(p.amount)}</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{PAYMENT_METHODS.find(([v]) => v === p.method)?.[1] || p.method} · {p.date}</span>
                    {p.note && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{p.note}</div>}
                  </div>
                  <button onClick={() => removePayment(p.id)} style={{ background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '0 4px' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add to Calendar */}
      <div className="glass-card-static" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <CalendarDaysIcon style={{ width: 18, height: 18, color: '#A78BFA' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>إضافة للتقويم</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => downloadICS(booking)} className="glass-btn glass-btn-sm">
            <ArrowDownTrayIcon style={{ width: 14, height: 14 }} /> تنزيل ملف .ics
          </button>
          <a href={googleCalUrl(booking)} target="_blank" rel="noreferrer" className="glass-btn glass-btn-sm" style={{ textDecoration: 'none' }}>
            <CalendarDaysIcon style={{ width: 14, height: 14 }} /> فتح في Google Calendar
          </a>
        </div>
      </div>

      {/* Customer notes */}
      {booking.notes && (
        <div className="glass-card-static" style={{ padding: '20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>ملاحظات العميل</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{booking.notes}</div>
        </div>
      )}

      {/* Internal Notes */}
      <div className="glass-card-static" style={{ padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <DocumentTextIcon style={{ width: 18, height: 18, color: '#A78BFA' }} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>ملاحظات داخلية</span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginRight: 'auto' }}>مرئية للمالك فقط</span>
        </div>

        {/* Priority selector */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {PRIORITY_OPTS.map(p => (
            <button
              key={p.key}
              onClick={() => setNotes(n => ({ ...n, priority: p.key }))}
              style={{
                padding: '4px 12px', borderRadius: '8px', cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif', fontSize: '12px', fontWeight: 600,
                background: notes.priority === p.key ? `${p.color}22` : 'rgba(255,255,255,0.05)',
                color: notes.priority === p.key ? p.color : 'rgba(255,255,255,0.4)',
                border: `1px solid ${notes.priority === p.key ? p.color + '55' : 'rgba(255,255,255,0.08)'}`,
              }}
            >{p.label}</button>
          ))}
        </div>

        {/* Quick tags */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {QUICK_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              style={{
                padding: '3px 10px', borderRadius: '8px', cursor: 'pointer',
                fontFamily: 'Cairo, sans-serif', fontSize: '12px', fontWeight: 600,
                background: notes.tags.includes(tag) ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)',
                color: notes.tags.includes(tag) ? '#A78BFA' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${notes.tags.includes(tag) ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.08)'}`,
              }}
            ><TagIcon style={{ width: 11, height: 11, display: 'inline', verticalAlign: 'middle', marginLeft: 3 }} />{tag}</button>
          ))}
        </div>

        <textarea
          className="glass-textarea"
          value={notes.text}
          onChange={e => setNotes(n => ({ ...n, text: e.target.value }))}
          placeholder="أضف ملاحظاتك الداخلية هنا..."
          style={{ minHeight: '80px', marginBottom: '10px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={saveNote} className="glass-btn glass-btn-sm glass-btn-primary">
            {notesSaved ? <><CheckCircleIcon style={{ width: 13, height: 13 }} /> تم الحفظ</> : <><CheckCircleIcon style={{ width: 13, height: 13 }} /> حفظ الملاحظات</>}
          </button>
        </div>
      </div>

      {/* Actions */}
      {(canConfirm || canComplete || canCancel) && (
        <div className="glass-card-static" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '14px' }}>الإجراءات المتاحة</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {canConfirm && (
              <button onClick={() => act('confirm')} disabled={actionLoading === 'confirm'} className="glass-btn glass-btn-success">
                {actionLoading === 'confirm' ? 'جاري التأكيد...' : <><CheckCircleIcon style={{ width: 16, height: 16 }} /> تأكيد الحجز</>}
              </button>
            )}
            {canComplete && (
              <button onClick={() => act('complete')} disabled={actionLoading === 'complete'} className="glass-btn glass-btn-primary">
                {actionLoading === 'complete' ? 'جاري الإكمال...' : <><CheckBadgeIcon style={{ width: 16, height: 16 }} /> تمت الفعالية</>}
              </button>
            )}
            {canCancel && (
              <button onClick={() => setCancelModal(true)} className="glass-btn glass-btn-danger">
                <XCircleIcon style={{ width: 16, height: 16 }} /> إلغاء الحجز
              </button>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payModal && (
        <div className="glass-modal-overlay" onClick={() => setPayModal(false)}>
          <div className="glass-modal-panel" style={{ maxWidth: 420, padding: '28px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: '18px' }}>تسجيل دفعة</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="glass-label">المبلغ (د.ع)</label>
                <input className="glass-input" type="number" min={1} value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} dir="ltr" placeholder="0" />
              </div>
              <div>
                <label className="glass-label">طريقة الدفع</label>
                <select className="glass-select" value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}>
                  {PAYMENT_METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="glass-label">التاريخ</label>
                <input className="glass-input" type="date" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} dir="ltr" />
              </div>
              <div>
                <label className="glass-label">ملاحظات (اختياري)</label>
                <input className="glass-input" value={payForm.note} onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))} placeholder="..." />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button onClick={() => setPayModal(false)} className="glass-btn" style={{ flex: 1 }}>إلغاء</button>
                <button onClick={addPayment} disabled={!payForm.amount} className="glass-btn glass-btn-primary" style={{ flex: 1 }}>
                  <CheckCircleIcon style={{ width: 15, height: 15 }} /> تأكيد الدفع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="glass-modal-overlay" onClick={() => setCancelModal(false)}>
          <div className="glass-modal-panel" style={{ maxWidth: 420, padding: '28px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: '16px' }}>إلغاء الحجز</h3>
            <label className="glass-label">سبب الإلغاء</label>
            <textarea className="glass-textarea" value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="سبب الإلغاء..." style={{ minHeight: '80px', marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setCancelModal(false)} className="glass-btn" style={{ flex: 1 }}>تراجع</button>
              <button onClick={() => act('cancel')} disabled={actionLoading === 'cancel'} className="glass-btn glass-btn-danger" style={{ flex: 1 }}>
                {actionLoading === 'cancel' ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Profile Modal */}
      {customerModal && (
        <div className="glass-modal-overlay" onClick={() => setCustomerModal(null)}>
          <div className="glass-modal-panel" style={{ maxWidth: 500, padding: '28px', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(124,58,237,0.2)', border: '2px solid rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCircleIcon style={{ width: 28, height: 28, color: '#A78BFA' }} />
                </div>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{customerModal.customer_name || customerModal.customer?.full_name}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', direction: 'ltr' }}>{customerModal.customer_phone || customerModal.customer?.phone || '—'}</div>
                </div>
              </div>
              <button onClick={() => setCustomerModal(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '22px', cursor: 'pointer' }}>×</button>
            </div>

            {customerBookings.length > 0 && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  {[
                    { label: 'إجمالي الحجوزات', value: customerBookings.length },
                    { label: 'إجمالي الإنفاق', value: fmtIQD(customerBookings.reduce((s, b) => s + parseFloat(b.quoted_price_iqd || 0), 0)) },
                    { label: 'أول حجز', value: fmtDate(customerBookings.reduce((m, b) => !m || b.created_at < m ? b.created_at : m, null)) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#A78BFA', marginBottom: 4 }}>{value}</div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>سجل الحجوزات</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {customerBookings.slice(0, 6).map(b => (
                    <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{EVENT_TYPE_AR[b.event_type] || b.event_type}</div>
                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{fmtDate(b.event_date)}</div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', direction: 'ltr', color: '#34D399' }}>{fmtIQD(b.quoted_price_iqd)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  )
}

function InfoCard({ title, children }) {
  return (
    <div className="glass-card-static" style={{ padding: '20px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, ltr }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <span style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', direction: ltr ? 'ltr' : undefined }}>
        {value}
      </span>
    </div>
  )
}

function MetricBox({ label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px 14px' }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>{label}</div>
      <div style={{ fontSize: '15px', fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
