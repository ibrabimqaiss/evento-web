import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  getOwnerBookings, confirmBooking, cancelBooking,
  fmtDate, fmtIQD, BOOKING_STATUS_LABELS, BOOKING_STATUS_CLASS,
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
  party: 'حفلة', birthday: 'عيد ميلاد', other: 'أخرى',
}

export default function OwnerBookings() {
  const [searchParams] = useSearchParams()
  const initStatus = searchParams.get('status') || ''
  const [activeTab, setActiveTab] = useState(
    TABS.find(t => t.value === initStatus) ? initStatus : ''
  )
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  const venueId = searchParams.get('venue_id')

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

  useEffect(() => { load() }, [load])

  async function handleConfirm(id) {
    setActionId(id)
    try { await confirmBooking(id); load() } catch { /* handled */ } finally { setActionId(null) }
  }

  async function handleCancel() {
    if (!cancelModal) return
    setActionId(cancelModal)
    try { await cancelBooking(cancelModal, cancelReason); load() } catch { /* handled */ }
    finally { setActionId(null); setCancelModal(null); setCancelReason('') }
  }

  return (
    <div className="owner-page">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>الحجوزات</h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
          إدارة جميع حجوزات قاعاتك
        </p>
      </div>

      {/* Tabs */}
      <div className="glass-tabs" style={{ marginBottom: '20px', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.value} className={`glass-tab${activeTab === t.value ? ' active' : ''}`} onClick={() => setActiveTab(t.value)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card-static">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7C3AED', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '15px' }}>
            لا توجد حجوزات
          </div>
        ) : (
          <div className="glass-table-wrap">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>القاعة</th>
                  <th>تاريخ الفعالية</th>
                  <th>النوع</th>
                  <th>الضيوف</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>{b.customer_name || b.customer?.full_name || '—'}</td>
                    <td>{b.venue_name || b.venue?.name || '—'}</td>
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
                          <button
                            className="glass-btn glass-btn-sm glass-btn-success"
                            disabled={actionId === b.id}
                            onClick={() => handleConfirm(b.id)}
                          >
                            {actionId === b.id ? '...' : '✓ تأكيد'}
                          </button>
                        )}
                        {(b.status === 'pending' || b.status === 'confirmed') && (
                          <button
                            className="glass-btn glass-btn-sm glass-btn-danger"
                            onClick={() => { setCancelModal(b.id); setCancelReason('') }}
                          >
                            ✕ إلغاء
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

      {/* Cancel Modal */}
      {cancelModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        }} onClick={() => setCancelModal(null)}>
          <div className="glass-card-static" style={{ maxWidth: 420, width: '100%', padding: '28px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: '16px' }}>
              إلغاء الحجز
            </h3>
            <label className="glass-label">سبب الإلغاء (اختياري)</label>
            <textarea
              className="glass-textarea"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="اكتب سبب إلغاء الحجز..."
              style={{ minHeight: '80px', marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setCancelModal(null)} className="glass-btn" style={{ flex: 1 }}>تراجع</button>
              <button onClick={handleCancel} disabled={actionId === cancelModal} className="glass-btn glass-btn-danger" style={{ flex: 1 }}>
                {actionId === cancelModal ? 'جاري الإلغاء...' : 'تأكيد الإلغاء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
