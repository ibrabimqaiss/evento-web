import { useEffect, useState } from 'react'
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  BanknotesIcon, CalendarDaysIcon, ChartBarIcon, ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'
import { getAnalytics, fmtIQD } from '../../lib/ownerApi'
import { DEMO_ANALYTICS } from '../../lib/demoData'

const COLORS = ['#7C3AED', '#34D399', '#FBBF24', '#60A5FA', '#F87171', '#A78BFA']

const EVENT_TYPE_LABELS = {
  wedding: 'زفاف',
  engagement: 'خطوبة',
  birthday: 'عيد ميلاد',
  corporate: 'مؤتمر',
  graduation: 'تخرج',
  party: 'حفلة',
  conference: 'مؤتمر',
  other: 'أخرى',
}

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth)
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return width
}

export default function OwnerAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const screenWidth = useWindowWidth()
  const isMobile = screenWidth <= 768

  useEffect(() => {
    getAnalytics()
      .then(res => {
        const d = res.data?.data ?? res.data
        setData(d && (d.kpis || d.monthly_revenue) ? d : DEMO_ANALYTICS)
      })
      .catch(() => setData(DEMO_ANALYTICS))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AnalyticsSkeleton />
  if (!data) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>تعذر تحميل البيانات</div>

  const kpis = data.kpis || {}
  const monthlyRevenue = data.monthly_revenue || []
  const rawEventDist = data.event_type_distribution || []
  const occupancy = data.occupancy_by_venue || []
  const busiestDays = data.busiest_days || []
  const topCustomers = data.top_customers || []

  // Translate event type names to Arabic
  const eventDist = rawEventDist.map(e => ({
    ...e,
    event_type: EVENT_TYPE_LABELS[e.event_type] || e.event_type,
  }))

  // On mobile show last 6 months only
  const revenueData = isMobile ? monthlyRevenue.slice(-6) : monthlyRevenue

  // Truncate venue names for occupancy chart on mobile
  const occupancyData = occupancy.map(o => ({
    ...o,
    venue_name: isMobile && o.venue_name?.length > 15
      ? o.venue_name.slice(0, 15) + '…'
      : o.venue_name,
  }))

  return (
    <div className="owner-page">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>التحليلات</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>إحصاءات الأداء والنمو</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <KpiCard label="إجمالي الإيرادات" value={fmtIQD(kpis.total_revenue)} Icon={BanknotesIcon} color="#34D399" />
        <KpiCard label="إجمالي الحجوزات" value={kpis.total_bookings ?? 0} Icon={CalendarDaysIcon} color="#A78BFA" />
        <KpiCard label="معدل الإلغاء" value={`${kpis.cancellation_rate ?? 0}%`} Icon={ArrowTrendingDownIcon} color="#F87171" />
        <KpiCard label="متوسط قيمة الحجز" value={fmtIQD(kpis.avg_booking_value)} Icon={ChartBarIcon} color="#FBBF24" />
      </div>

      {/* Monthly Revenue Chart */}
      {monthlyRevenue.length > 0 && (
        <div className="glass-card-static" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '20px' }}>
            الإيرادات الشهرية ({isMobile ? 'آخر 6 أشهر' : 'آخر 12 شهر'})
          </h2>
          <div style={{ width: '100%', overflowX: 'auto', minHeight: 200 }}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: isMobile ? 30 : 5 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: isMobile ? 9 : 11, fill: 'rgba(255,255,255,0.5)' }}
                  angle={isMobile ? -45 : 0}
                  textAnchor={isMobile ? 'end' : 'middle'}
                  interval={0}
                />
                <YAxis
                  tickFormatter={v => (v / 1000000).toFixed(1) + 'M'}
                  tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
                  width={isMobile ? 40 : 60}
                />
                <Tooltip formatter={(v) => [fmtIQD(v), 'الإيرادات']} contentStyle={{ background: 'rgba(10,8,24,0.9)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Two-column row: stacks on mobile via finance-cols class */}
      <div className="finance-cols" style={{ gap: '16px', marginBottom: '20px' }}>

        {/* Event type pie */}
        {eventDist.length > 0 && (
          <div className="glass-card-static" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '20px' }}>توزيع أنواع الفعاليات</h2>
            <div style={{ width: '100%', overflowX: 'auto', minHeight: 200 }}>
              <ResponsiveContainer width="100%" height={isMobile ? 250 : 200}>
                <PieChart>
                  <Pie
                    data={eventDist}
                    dataKey="count"
                    nameKey="event_type"
                    cx="50%"
                    cy={isMobile ? '45%' : '50%'}
                    outerRadius={isMobile ? 60 : 70}
                    label={isMobile ? false : ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={!isMobile}
                  >
                    {eventDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(10,8,24,0.9)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12 }} />
                  {isMobile && (
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Busiest days */}
        {busiestDays.length > 0 && (
          <div className="glass-card-static" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '20px' }}>أكثر الأيام ازدحاماً</h2>
            <div style={{ width: '100%', overflowX: 'auto', minHeight: 200 }}>
              <div style={{ minWidth: isMobile ? 320 : '100%' }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={busiestDays} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: isMobile ? 10 : 11, fill: 'rgba(255,255,255,0.5)' }} />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 11, fill: 'rgba(255,255,255,0.5)' }} />
                    <Tooltip contentStyle={{ background: 'rgba(10,8,24,0.9)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12 }} />
                    <Bar dataKey="count" fill="#A78BFA" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Occupancy by venue */}
      {occupancy.length > 0 && (
        <div className="glass-card-static" style={{ padding: '24px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: '20px' }}>الإشغال حسب القاعة</h2>
          <div style={{ width: '100%', overflowX: 'auto', minHeight: 200 }}>
            <ResponsiveContainer width="100%" height={Math.max(200, occupancyData.length * 40)}>
              <BarChart data={occupancyData} layout="vertical" margin={{ top: 5, right: 20, left: isMobile ? 10 : 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} />
                <YAxis
                  dataKey="venue_name"
                  type="category"
                  tick={{ fontSize: isMobile ? 10 : 12, fill: 'rgba(255,255,255,0.6)' }}
                  width={isMobile ? 90 : 80}
                />
                <Tooltip formatter={(v) => [`${v}%`, 'معدل الإشغال']} contentStyle={{ background: 'rgba(10,8,24,0.9)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12 }} />
                <Bar dataKey="occupancy_rate" fill="#34D399" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top customers */}
      {topCustomers.length > 0 && (
        <div className="glass-card-static">
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>أفضل العملاء</h2>
          </div>
          <div className="glass-table-wrap">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>العميل</th>
                  <th>عدد الحجوزات</th>
                  <th>إجمالي الإنفاق</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.slice(0, 10).map((c, i) => (
                  <tr key={c.customer_id || i}>
                    <td style={{ color: i < 3 ? '#FBBF24' : 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                      {i + 1}
                    </td>
                    <td>{c.customer_name || `عميل #${i + 1}`}</td>
                    <td>{c.booking_count}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{fmtIQD(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, Icon, color }) {
  return (
    <div className="glass-card-static" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '10px', color }}>
        <Icon style={{ width: 24, height: 24 }} />
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="owner-page">
      <div className="skeleton" style={{ height: 32, width: 180, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: 280, marginBottom: 28 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 20 }} />)}
      </div>
      <div className="skeleton" style={{ height: 280, borderRadius: 20, marginBottom: 20 }} />
      <div className="finance-cols" style={{ gap: 16 }}>
        <div className="skeleton" style={{ height: 260, borderRadius: 20 }} />
        <div className="skeleton" style={{ height: 260, borderRadius: 20 }} />
      </div>
    </div>
  )
}
