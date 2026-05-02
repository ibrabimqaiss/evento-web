import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout, getStoredUser } from '../lib/api'
import { useTheme } from '../lib/theme'
import {
  HomeIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  BanknotesIcon,
  ArchiveBoxIcon,
  UsersIcon,
  ChartBarIcon,
  EllipsisHorizontalIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline'

const NAV = [
  { to: '/owner/dashboard',  Icon: HomeIcon,             label: 'لوحة التحكم' },
  { to: '/owner/venues',     Icon: BuildingOffice2Icon,  label: 'القاعات' },
  { to: '/owner/bookings',   Icon: CalendarDaysIcon,     label: 'الحجوزات' },
  { to: '/owner/finance',    Icon: BanknotesIcon,        label: 'المالية' },
  { to: '/owner/inventory',  Icon: ArchiveBoxIcon,       label: 'المخزون' },
  { to: '/owner/hr',         Icon: UsersIcon,            label: 'الموارد البشرية' },
  { to: '/owner/analytics',  Icon: ChartBarIcon,         label: 'التحليلات' },
]

const MOBILE_MAIN = NAV.slice(0, 4)
const MOBILE_MORE = NAV.slice(4)
const SIDEBAR_W = 260

export default function OwnerLayout({ children }) {
  const navigate = useNavigate()
  const user = getStoredUser()
  const [showMore, setShowMore] = useState(false)
  const { theme, toggleTheme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  // Default owner panel to dark on first visit
  useEffect(() => {
    if (!localStorage.getItem('evento_theme')) {
      setTheme('dark')
    }
  }, [])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  // Theme-derived styles
  const sidebarBg = isDark
    ? 'rgba(8, 6, 20, 0.80)'
    : 'rgba(255, 255, 255, 0.92)'
  const sidebarBorder = isDark
    ? '1px solid rgba(255,255,255,0.07)'
    : '1px solid rgba(124,58,237,0.15)'
  const logoSubColor = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(80,60,120,0.55)'
  const userNameColor = isDark ? 'rgba(255,255,255,0.82)' : '#1a1a2e'
  const userPhoneColor = isDark ? 'rgba(255,255,255,0.3)' : '#888'
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(124,58,237,0.1)'
  const mobileNavBg = isDark ? 'rgba(8,6,20,0.92)' : 'rgba(255,255,255,0.97)'
  const mobileNavBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(124,58,237,0.12)'
  const mobileNavActiveColor = '#7C3AED'
  const mobileNavInactiveColor = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(80,60,120,0.45)'
  const sheetBg = isDark ? 'rgba(12, 9, 30, 0.97)' : 'rgba(248,245,255,0.98)'
  const sheetBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(124,58,237,0.15)'

  return (
    <div className="owner-root bg-orbs" style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Desktop Sidebar ── */}
      <aside
        className="owner-sidebar"
        style={{
          width: SIDEBAR_W, flexShrink: 0,
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
          display: 'flex', flexDirection: 'column',
          padding: '20px 14px',
          background: sidebarBg,
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderLeft: sidebarBorder,
        }}
      >
        {/* Logo */}
        <div style={{ padding: '8px 12px 18px', marginBottom: 10, borderBottom: `1px solid ${dividerColor}` }}>
          <img src="/evento_logo.svg" alt="Evento" height="30" style={{ display: 'block', filter: isDark ? 'none' : 'brightness(0) saturate(100%) invert(25%) sepia(70%) saturate(2000%) hue-rotate(250deg)' }} />
          <div style={{ fontSize: 11, color: logoSubColor, marginTop: 3, fontWeight: 500 }}>
            لوحة تحكم المالك
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto' }}>
          {NAV.map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon style={{ width: 20, height: 20, flexShrink: 0 }} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom: theme toggle + user + logout */}
        <div style={{ borderTop: `1px solid ${dividerColor}`, paddingTop: 12 }}>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="nav-item"
            style={{ width: '100%', border: 'none', background: 'transparent', justifyContent: 'flex-start', marginBottom: 4 }}
          >
            {isDark
              ? <SunIcon style={{ width: 20, height: 20, flexShrink: 0 }} />
              : <MoonIcon style={{ width: 20, height: 20, flexShrink: 0 }} />
            }
            <span>{isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
          </button>

          {/* User info */}
          <div style={{ padding: '4px 14px 10px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: userNameColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name || 'المالك'}
            </div>
            <div style={{ fontSize: 11, color: userPhoneColor, direction: 'ltr', textAlign: 'right' }}>
              {user?.phone || ''}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="nav-item"
            style={{ width: '100%', border: 'none', background: 'transparent', justifyContent: 'flex-start' }}
          >
            <ArrowRightOnRectangleIcon style={{ width: 20, height: 20, flexShrink: 0 }} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="owner-main" style={{ flex: 1, position: 'relative', zIndex: 1, marginRight: SIDEBAR_W }}>
        <div className="owner-mobile-header">
          <img src="/evento_logo.svg" alt="Evento" style={{ height: 28, display: 'block' }} />
        </div>
        <div className="owner-content">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="owner-mobile-nav" style={{ background: mobileNavBg, borderTop: `1px solid ${mobileNavBorder}` }}>
        {MOBILE_MAIN.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 3, padding: '6px 4px 0',
              color: isActive ? mobileNavActiveColor : mobileNavInactiveColor,
              textDecoration: 'none', fontSize: 10, fontWeight: 600,
              flex: 1,
            })}
          >
            <Icon style={{ width: 24, height: 24 }} />
            <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setShowMore(true)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 3, padding: '6px 4px 0',
            color: mobileNavInactiveColor,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 10, fontWeight: 600, flex: 1,
          }}
        >
          <EllipsisHorizontalIcon style={{ width: 24, height: 24 }} />
          <span>المزيد</span>
        </button>
      </nav>

      {/* ── "المزيد" Bottom Sheet ── */}
      {showMore && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={() => setShowMore(false)}
        >
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: sheetBg,
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderRadius: '20px 20px 0 0',
              border: `1px solid ${sheetBorder}`,
              borderBottom: 'none',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(124,58,237,0.2)' }} />
            </div>

            <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {MOBILE_MORE.map(({ to, Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  style={{ fontSize: 15 }}
                >
                  <Icon style={{ width: 22, height: 22, flexShrink: 0 }} />
                  <span>{label}</span>
                </NavLink>
              ))}

              <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(124,58,237,0.1)', margin: '8px 0' }} />

              {/* Theme toggle in sheet */}
              <button
                onClick={() => { toggleTheme(); setShowMore(false) }}
                className="nav-item"
                style={{ width: '100%', border: 'none', background: 'transparent', fontSize: 15 }}
              >
                {isDark
                  ? <SunIcon style={{ width: 22, height: 22, flexShrink: 0 }} />
                  : <MoonIcon style={{ width: 22, height: 22, flexShrink: 0 }} />
                }
                <span>{isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
              </button>

              <button
                onClick={() => { handleLogout(); setShowMore(false) }}
                className="nav-item"
                style={{ width: '100%', border: 'none', background: 'transparent', color: 'rgba(248,113,113,0.85)', fontSize: 15 }}
              >
                <ArrowRightOnRectangleIcon style={{ width: 22, height: 22, flexShrink: 0 }} />
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
