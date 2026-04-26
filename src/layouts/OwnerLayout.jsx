import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { logout, getStoredUser } from '../lib/api'
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

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="owner-root bg-orbs" style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Desktop Sidebar ──────────────────────────────────────────────── */}
      <aside
        className="owner-sidebar"
        style={{
          width: SIDEBAR_W,
          flexShrink: 0,
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 14px',
          background: 'rgba(8, 6, 20, 0.75)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '8px 12px 18px', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <img src="/evento_logo.svg" alt="Evento" height="30" style={{ display: 'block' }} />
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', marginTop: '3px', fontWeight: 500 }}>
            لوحة تحكم المالك
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto' }}>
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
            <ArrowRightOnRectangleIcon style={{ width: 20, height: 20, flexShrink: 0 }} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main
        className="owner-main"
        style={{ flex: 1, position: 'relative', zIndex: 1, marginRight: SIDEBAR_W }}
      >
        {/* Mobile top header — logo only, hidden on desktop */}
        <div className="owner-mobile-header">
          <img src="/evento_logo.svg" alt="Evento" style={{ height: 28, display: 'block' }} />
        </div>
        <div className="owner-content">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ─────────────────────────────────────────────── */}
      <nav className="owner-mobile-nav">
        {MOBILE_MAIN.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', padding: '6px 4px 0',
              color: isActive ? '#A78BFA' : 'rgba(255,255,255,0.38)',
              textDecoration: 'none', fontSize: '10px', fontWeight: 600,
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
            gap: '3px', padding: '6px 4px 0',
            color: 'rgba(255,255,255,0.38)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '10px', fontWeight: 600, flex: 1,
          }}
        >
          <EllipsisHorizontalIcon style={{ width: 24, height: 24 }} />
          <span>المزيد</span>
        </button>
      </nav>

      {/* ── "المزيد" Bottom Sheet ─────────────────────────────────────────── */}
      {showMore && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 150,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
          onClick={() => setShowMore(false)}
        >
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'rgba(12, 9, 30, 0.96)',
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              borderRadius: '20px 20px 0 0',
              border: '1px solid rgba(255,255,255,0.12)',
              borderBottom: 'none',
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
            </div>

            <div style={{ padding: '8px 16px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {MOBILE_MORE.map(({ to, Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setShowMore(false)}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  style={{ fontSize: '15px' }}
                >
                  <Icon style={{ width: 22, height: 22, flexShrink: 0 }} />
                  <span>{label}</span>
                </NavLink>
              ))}

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '8px 0' }} />

              <button
                onClick={() => { handleLogout(); setShowMore(false) }}
                className="nav-item"
                style={{
                  width: '100%', border: 'none', background: 'transparent',
                  color: 'rgba(248,113,113,0.8)', fontSize: '15px',
                }}
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
