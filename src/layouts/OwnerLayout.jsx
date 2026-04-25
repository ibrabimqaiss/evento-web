import { NavLink, useNavigate } from 'react-router-dom'
import { logout, getStoredUser } from '../lib/api'

const NAV = [
  { to: '/owner/dashboard', icon: '📊', label: 'لوحة التحكم' },
  { to: '/owner/venues', icon: '🏛️', label: 'القاعات' },
  { to: '/owner/bookings', icon: '📅', label: 'الحجوزات' },
  { to: '/owner/finance', icon: '💰', label: 'المالية' },
  { to: '/owner/inventory', icon: '📦', label: 'المخزون' },
  { to: '/owner/hr', icon: '👥', label: 'الموارد البشرية' },
  { to: '/owner/analytics', icon: '📈', label: 'التحليلات' },
]

const SIDEBAR_W = 260

export default function OwnerLayout({ children }) {
  const navigate = useNavigate()
  const user = getStoredUser()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="owner-root bg-orbs" style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        style={{
          width: SIDEBAR_W,
          flexShrink: 0,
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 14px',
          background: 'rgba(8, 6, 20, 0.75)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
        }}
        className="owner-sidebar"
      >
        {/* Logo */}
        <div style={{
          padding: '8px 12px 18px',
          marginBottom: '10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
            إيفنتو
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', marginTop: '3px', fontWeight: 500 }}>
            لوحة تحكم المالك
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto' }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
          <div style={{ padding: '4px 14px 10px' }}>
            <div style={{
              fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.82)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.full_name || 'المالك'}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', direction: 'ltr', textAlign: 'right' }}>
              {user?.phone || ''}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="nav-item"
            style={{ width: '100%', border: 'none', background: 'transparent', justifyContent: 'flex-start' }}
          >
            <span style={{ fontSize: '16px' }}>🚪</span>
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main
        className="owner-main"
        style={{ flex: 1, position: 'relative', zIndex: 1, marginRight: SIDEBAR_W }}
      >
        <div style={{ padding: '28px 28px 60px' }}>
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Tabs ───────────────────────────────────────────── */}
      <nav
        className="owner-mobile-nav"
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 50,
          background: 'rgba(8, 6, 20, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '6px 0 10px',
          display: 'flex',
          justifyContent: 'space-around',
        }}
      >
        {NAV.slice(0, 5).map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', padding: '4px 6px',
              color: isActive ? '#A78BFA' : 'rgba(255,255,255,0.38)',
              textDecoration: 'none', fontSize: '10px', fontWeight: 600,
              minWidth: '48px',
            })}
          >
            <span style={{ fontSize: '18px' }}>{icon}</span>
            <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
