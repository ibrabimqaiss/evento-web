// Shared demo data — single source of truth for Finance, HR, Analytics fallbacks.
// Used only when the API returns empty or null data.

export const DEMO_BOOKINGS = [
  { id: 'b1', reference: 'EVT-001', event_date: '2026-04-10', customer_name: 'أحمد سالم', venue_name: 'قاعة النخيل', amount: 2500000, status: 'completed' },
  { id: 'b2', reference: 'EVT-002', event_date: '2026-03-25', customer_name: 'فاطمة حسن', venue_name: 'قاعة النخيل', amount: 1800000, status: 'completed' },
  { id: 'b3', reference: 'EVT-003', event_date: '2026-03-10', customer_name: 'علي كريم', venue_name: 'قاعة النخيل', amount: 3000000, status: 'completed' },
  { id: 'b4', reference: 'EVT-004', event_date: '2026-02-28', customer_name: 'زينب محمد', venue_name: 'قاعة النخيل', amount: 2100000, status: 'completed' },
  { id: 'b5', reference: 'EVT-005', event_date: '2026-02-14', customer_name: 'حسين طارق', venue_name: 'قاعة النخيل', amount: 1500000, status: 'confirmed' },
  { id: 'b6', reference: 'EVT-006', event_date: '2026-05-01', customer_name: 'مريم جابر', venue_name: 'قاعة النخيل', amount: 2800000, status: 'confirmed' },
]

export const DEMO_STAFF = [
  { id: 's1', full_name: 'أحمد حسن', role: 'manager', employment_type: 'full_time', wage_type: 'monthly', salary: 800000, phone: '07701000001', is_active: true },
  { id: 's2', full_name: 'محمد علي', role: 'waiter', employment_type: 'full_time', wage_type: 'monthly', salary: 450000, phone: '07701000002', is_active: true },
  { id: 's3', full_name: 'علي كريم', role: 'chef', employment_type: 'full_time', wage_type: 'monthly', salary: 600000, phone: '07701000003', is_active: true },
  { id: 's4', full_name: 'حسين جواد', role: 'security', employment_type: 'full_time', wage_type: 'monthly', salary: 400000, phone: '07701000004', is_active: true },
  { id: 's5', full_name: 'ياسر طارق', role: 'waiter', employment_type: 'part_time', wage_type: 'daily', daily_rate: 30000, phone: '07701000005', is_active: true },
  { id: 's6', full_name: 'سارة محمود', role: 'decorator', employment_type: 'contract', wage_type: 'monthly', salary: 500000, phone: '07701000006', is_active: true },
  { id: 's7', full_name: 'نور رضا', role: 'photographer', employment_type: 'contract', wage_type: 'daily', daily_rate: 75000, phone: '07701000007', is_active: true },
]

export const DEMO_INVENTORY = [
  { id: 'i1', name: 'كراسي أبيض', category: 'furniture', quantity: 300, min_quantity: 50, condition: 'good', is_low_stock: false },
  { id: 'i2', name: 'طاولات مستديرة', category: 'furniture', quantity: 40, min_quantity: 10, condition: 'good', is_low_stock: false },
  { id: 'i3', name: 'نظام صوتي رئيسي', category: 'audio', quantity: 2, min_quantity: 1, condition: 'good', is_low_stock: false },
  { id: 'i4', name: 'مصابيح LED', category: 'lighting', quantity: 60, min_quantity: 20, condition: 'good', is_low_stock: false },
  { id: 'i5', name: 'غطاء طاولة أبيض', category: 'decor', quantity: 5, min_quantity: 15, condition: 'fair', is_low_stock: true },
  { id: 'i6', name: 'بوفيه مزدوج', category: 'kitchen', quantity: 2, min_quantity: 3, condition: 'needs_repair', is_low_stock: true },
]

// Computed from DEMO_BOOKINGS — always consistent
const completedBookings = DEMO_BOOKINGS.filter(b => ['confirmed', 'completed'].includes(b.status))
const TOTAL_REVENUE = completedBookings.reduce((s, b) => s + b.amount, 0)
const TOTAL_BOOKINGS = DEMO_BOOKINGS.length

export const DEMO_FINANCE_SUMMARY = {
  today: 0,
  week: 1800000,
  month: 4300000,
  year: TOTAL_REVENUE,
}

export const DEMO_ANALYTICS = {
  kpis: {
    total_revenue: TOTAL_REVENUE,
    total_bookings: TOTAL_BOOKINGS,
    cancellation_rate: 0,
    avg_booking_value: Math.round(TOTAL_REVENUE / completedBookings.length),
    occupancy_rate: 42,
    top_venue: 'قاعة النخيل',
    busiest_day: 'الجمعة',
  },
  monthly_revenue: [
    { month: '2025-07', revenue: 1200000 },
    { month: '2025-08', revenue: 1800000 },
    { month: '2025-09', revenue: 2200000 },
    { month: '2025-10', revenue: 1500000 },
    { month: '2025-11', revenue: 2800000 },
    { month: '2025-12', revenue: 3200000 },
    { month: '2026-01', revenue: 2100000 },
    { month: '2026-02', revenue: 3600000 },
    { month: '2026-03', revenue: 4800000 },
    { month: '2026-04', revenue: 2300000 },
  ],
  event_type_distribution: [
    { event_type: 'زفاف', count: 8 },
    { event_type: 'تخرج', count: 4 },
    { event_type: 'مؤتمر', count: 3 },
    { event_type: 'حفلة', count: 2 },
  ],
  occupancy_by_venue: [
    { venue_name: 'قاعة النخيل', occupancy_rate: 62 },
  ],
  busiest_days: [
    { day: 'الاثنين', count: 2 },
    { day: 'الثلاثاء', count: 3 },
    { day: 'الأربعاء', count: 2 },
    { day: 'الخميس', count: 4 },
    { day: 'الجمعة', count: 8 },
    { day: 'السبت', count: 6 },
    { day: 'الأحد', count: 3 },
  ],
  top_customers: DEMO_BOOKINGS.slice(0, 5).map((b, i) => ({
    customer_name: b.customer_name,
    booking_count: 1,
    total_spent: b.amount,
  })),
}
