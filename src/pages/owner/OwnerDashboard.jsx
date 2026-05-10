import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarDaysIcon,
  BanknotesIcon,
  ClockIcon,
  BuildingOffice2Icon,
  UsersIcon,
  PlusIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline'
import {
  getDashboardStats, getOwnerBookings, getInventory,
  fmtDate, fmtIQD, BOOKING_STATUS_LABELS, BOOKING_STATUS_CLASS,
} from '../../lib/ownerApi'

function fmtShort(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + ' م'
  if (n >= 1_000) return Math.round(n / 1_000) + ' ألف'
  return n.toLocaleString('en-US')
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getOwnerBookings({ limit: 8, ordering: '-created_at' }),
      getInventory(),
    ]).then(([sRes, bRes, invRes]) => {
      setStats(sRes.data?.data ?? sRes.data)
      const bData = bRes.data?.data ?? bRes.data
      setBookings(Array.isArray(bData) ? bData : (bData?.results ?? []))
      const invData = invRes.data?.data ?? invRes.data
      const inv = Array.isArray(invData) ? invData : (invData?.results ?? [])
      setLowStock(inv.filter(i => i.is_low_stock))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardSkeleton />

  const cards = [
    { Icon: CalendarDaysIcon, label: 'إجمالي الحجوزات', value: stats?.this_month_bookings ?? 0, color: 'purple', to: '/owner/bookings' },
    { Icon: BanknotesIcon, label: 'إجمالي الإيرادات', value: fmtShort(stats?.month_revenue ?? 0), color: 'green', to: '/owner/finance' },
    { Icon: BuildingOffice2Icon, label: 'القاعات النشطة', value: stats?.total_venues ?? 0, color: 'blue', to: '/owner/venues' },
    { Icon: UsersIcon, label: 'الموظفين', value: stats?.total_staff ?? 0, color: 'yellow', to: '/owner/hr' },
  ]

  return (
    <div className="owner-page">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          لوحة التحكم
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {new Date().toLocaleDateString('ar-IQ-u-nu-latn', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 16, padding: '16px 20px', marginBottom: '20px', boxShadow: '0 0 20px rgba(248,113,113,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <ExclamationTriangleIcon style={{ width: 20, height: 20, color: '#F87171', flexShrink: 0 }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#F87171' }}>تنبيه: {lowStock.length} عنصر منخفض المخزون</span>
            <Link to="/owner/inventory" className="glass-btn glass-btn-sm glass-btn-danger" style={{ marginRight: 'auto', padding: '4px 12px' }}>إدارة المخزون</Link>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {lowStock.map(item => (
              <div key={item.id} style={{ background: 'rgba(248,113,113,0.1)', borderRadius: 10, padding: '6px 12px', fontSize: '13px', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 600 }}>{item.name}</span>
                <span style={{ opacity: 0.7 }}>({item.quantity}/{item.min_quantity})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: '28px' }}>
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/owner/bookings?status=pending" className="glass-btn glass-btn-primary">
          <ClockIcon style={{ width: 18, height: 18 }} />
          مراجعة الحجوزات المعلقة
        </Link>
        <Link to="/owner/venues/new" className="glass-btn">
          <PlusIcon style={{ width: 18, height: 18 }} />
          إضافة قاعة جديدة
        </Link>
        <Link to="/owner/analytics" className="glass-btn">
          <ChartBarIcon style={{ width: 18, height: 18 }} />
          عرض التحليلات
        </Link>
      </div>

      {/* Recent Bookings */}
      <div className="glass-card-static">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            آخر الحجوزات
          </h2>
          <Link to="/owner/bookings" className="glass-btn glass-btn-sm">عرض الكل</Link>
        </div>
        {bookings.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
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
                    <td>{b.venue_detail?.name_ar || b.venue_detail?.name || '—'}</td>
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
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>معدل الإشغال (هذا الشهر)</div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#A78BFA' }}>
              {stats.occupancy_rate ?? 0}%
            </div>
            <div style={{ marginTop: '12px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
              <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #7C3AED, #A78BFA)', width: `${Math.min(stats.occupancy_rate ?? 0, 100)}%`, transition: 'width 1s ease' }} />
            </div>
          </div>
          <div className="glass-card-static" style={{ padding: '24px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>حجوزات هذا الشهر</div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#34D399' }}>
              {stats.this_month_bookings ?? 0}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>حجز مؤكد</div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ Icon, label, value, color, to }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={to}
      className={`glass-card stat-card stat-card-${color}`}
      style={{
        textDecoration: 'none',
        position: 'relative',
        cursor: 'pointer',
        transform: hovered ? 'scale(1.025)' : 'scale(1)',
        boxShadow: hovered ? '0 8px 32px rgba(124,58,237,0.25)' : undefined,
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="stat-card-icon"><Icon /></div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      <ChevronLeftIcon style={{ position: 'absolute', bottom: 12, left: 12, width: 15, height: 15, color: 'var(--text-tertiary)', transition: 'color 0.18s', ...(hovered && { color: 'var(--text-secondary)' }) }} />
    </Link>
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
