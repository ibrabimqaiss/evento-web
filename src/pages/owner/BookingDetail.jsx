import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getOwnerBookingDetail, confirmBooking, completeBooking, cancelBooking,
  fmtDate, fmtIQD, BOOKING_STATUS_LABELS, BOOKING_STATUS_CLASS,
} from '../../lib/ownerApi'

const EVENT_TYPE_AR = {
  wedding: 'حفل زفاف', graduation: 'تخرج', conference: 'مؤتمر',
  party: 'حفلة', birthday: 'عيد ميلاد', other: 'أخرى',
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

  function load() {
    setLoading(true)
    getOwnerBookingDetail(id)
      .then(res => setBooking(res.data?.data ?? res.data))
      .catch(() => setError('تعذر تحميل تفاصيل الحجز'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

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

  return (
    <div className="owner-page" style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Back */}
      <Link to="/owner/bookings" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '20px', textDecoration: 'none' }}>
        → العودة للحجوزات
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
            تفاصيل الحجز
          </h1>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', direction: 'ltr', textAlign: 'right' }}>
            #{id?.slice(0, 8)}
          </div>
        </div>
        <span className={BOOKING_STATUS_CLASS[status] || 'status-badge status-pending'} style={{ fontSize: '14px', padding: '8px 18px' }}>
          {BOOKING_STATUS_LABELS[status] || status}
        </span>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '12px', color: '#F87171', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <InfoCard title="معلومات العميل">
          <Row label="الاسم" value={booking.customer_name || booking.customer?.full_name || '—'} />
          <Row label="الهاتف" value={booking.customer_phone || booking.customer?.phone || '—'} ltr />
        </InfoCard>
        <InfoCard title="معلومات الفعالية">
          <Row label="القاعة" value={booking.venue_name || booking.venue?.name || '—'} />
          <Row label="نوع الفعالية" value={EVENT_TYPE_AR[booking.event_type] || booking.event_type || '—'} />
          <Row label="تاريخ الفعالية" value={fmtDate(booking.event_date)} />
          <Row label="وقت البدء" value={booking.start_time || '—'} ltr />
        </InfoCard>
        <InfoCard title="التفاصيل المالية">
          <Row label="عدد الضيوف" value={`${booking.guest_count} شخص`} />
          <Row label="المبلغ المقتبس" value={fmtIQD(booking.quoted_price_iqd)} />
        </InfoCard>
        <InfoCard title="التواريخ">
          <Row label="تاريخ الحجز" value={fmtDate(booking.created_at)} />
          {booking.confirmed_at && <Row label="تاريخ التأكيد" value={fmtDate(booking.confirmed_at)} />}
          {booking.completed_at && <Row label="تاريخ الإكمال" value={fmtDate(booking.completed_at)} />}
        </InfoCard>
      </div>

      {/* Notes */}
      {booking.notes && (
        <div className="glass-card-static" style={{ padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>ملاحظات العميل</div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{booking.notes}</div>
        </div>
      )}

      {/* Actions */}
      {(canConfirm || canComplete || canCancel) && (
        <div className="glass-card-static" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '14px' }}>الإجراءات المتاحة</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {canConfirm && (
              <button onClick={() => act('confirm')} disabled={actionLoading === 'confirm'} className="glass-btn glass-btn-success">
                {actionLoading === 'confirm' ? 'جاري التأكيد...' : '✓ تأكيد الحجز'}
              </button>
            )}
            {canComplete && (
              <button onClick={() => act('complete')} disabled={actionLoading === 'complete'} className="glass-btn glass-btn-primary">
                {actionLoading === 'complete' ? 'جاري الإكمال...' : '🎉 تمت الفعالية'}
              </button>
            )}
            {canCancel && (
              <button onClick={() => setCancelModal(true)} className="glass-btn glass-btn-danger">
                ✕ إلغاء الحجز
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setCancelModal(false)}>
          <div className="glass-card-static" style={{ maxWidth: 420, width: '100%', padding: '28px' }} onClick={e => e.stopPropagation()}>
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
