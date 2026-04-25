import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getDashboardStats, getOwnerBookings,
  fmtIQD, fmtDate, BOOKING_STATUS_LABELS, BOOKING_STATUS_CLASS,
} from '../../lib/ownerApi'

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getOwnerBookings({ limit: 8, ordering: '-created_at' }),
    ]).then(([sRes, bRes]) => {
      setStats(sRes.data?.data ?? sRes.data)
      const bData = bRes.data?.data ?? bRes.data
      setBookings(Array.isArray(bData) ? bData : (bData?.results ?? []))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const cards = [
    { icon: '📅', label: 'حجوزات اليوم', value: stats?.today_bookings ?? 0, color: 'purple' },
    { icon: '💰', label: 'إيرادات الشهر', value: fmtIQD(stats?.month_revenue ?? 0), color: 'green', raw: false },
    { icon: '⏳', label: 'بانتظار الموافقة', value: stats?.pending_count ?? 0, color: 'yellow' },
    { icon: '🏛️', label: 'إجمالي القاعات', value: stats?.total_venues ?? 0, color: 'blue' },
  ]

  return (
    <div className="owner-page">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
          لوحة التحكم
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
          {new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {cards.map((c) => (
          <div key={c.label} className={`glass-card stat-card stat-card-${c.color}`}>
            <div className="stat-card-icon">{c.icon}</div>
            <div className="stat-card-value">{c.value}</div>
            <div className="stat-card-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <Link to="/owner/bookings?status=pending" className="glass-btn glass-btn-primary">
          ⏳ مراجعة الحجوزات المعلقة
        </Link>
        <Link to="/owner/venues/new" className="glass-btn">
          ➕ إضافة قاعة جديدة
        </Link>
        <Link to="/owner/analytics" className="glass-btn">
          📈 عرض التحليلات
        </Link>
      </div>

      {/* Recent Bookings */}
      <div className="glass-card-static">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
            آخر الحجوزات
          </h2>
          <Link to="/owner/bookings" className="glass-btn glass-btn-sm">عرض الكل</Link>
        </div>
        {bookings.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
            لا توجد حجوزات حتى الآن
          </div>
        ) : (
          <div className="glass-table-wrap">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>القاعة</th>
                  <th>تاريخ الفعالية</th>
                  <th>عدد الضيوف</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} onClick={() => window.location.href = `/owner/bookings/${b.id}`}>
                    <td>{b.customer_name || b.customer?.full_name || '—'}</td>
                    <td>{b.venue_name || b.venue?.name || '—'}</td>
                    <td>{fmtDate(b.event_date)}</td>
                    <td>{b.guest_count}</td>
                    <td>
                      <span className={BOOKING_STATUS_CLASS[b.status] || 'status-badge status-pending'}>
                        {BOOKING_STATUS_LABELS[b.status] || b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Second row: occupancy + this month */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '20px' }}>
          <div className="glass-card-static" style={{ padding: '24px' }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>معدل الإشغال (هذا الشهر)</div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#A78BFA' }}>
              {stats.occupancy_rate ?? 0}%
            </div>
            <div style={{ marginTop: '12px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #7C3AED, #A78BFA)', width: `${Math.min(stats.occupancy_rate ?? 0, 100)}%`, transition: 'width 1s ease' }} />
            </div>
          </div>
          <div className="glass-card-static" style={{ padding: '24px' }}>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>حجوزات هذا الشهر</div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#34D399' }}>
              {stats.this_month_bookings ?? 0}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginTop: '8px' }}>حجز مؤكد</div>
          </div>
        </div>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="owner-page">
      <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: 300, marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 20 }} />)}
      </div>
      <div className="skeleton" style={{ height: 300, borderRadius: 20 }} />
    </div>
  )
}
