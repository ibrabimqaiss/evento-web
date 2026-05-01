import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useTheme } from '../lib/theme'

export default function HomePage() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const bg = isDark
    ? 'linear-gradient(135deg, #0f0a1e 0%, #1a1035 50%, #0f0a1e 100%)'
    : 'linear-gradient(135deg, #f8f4ff 0%, #ffffff 50%, #ede9fe 100%)'

  const textColor = isDark ? '#ffffff' : '#1a1a2e'
  const subtextColor = isDark ? 'rgba(255,255,255,0.55)' : '#888888'
  const toggleBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'
  const toggleColor = isDark ? '#ffffff' : '#1a1a2e'
  const toggleBorder = isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.08)'

  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Cairo, sans-serif',
      direction: 'rtl',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Decorative orbs */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: 400, height: 400, borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-5%',
        width: 350, height: 350, borderRadius: '50%',
        background: isDark
          ? 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Theme toggle — top left (RTL: physical left = visual right) */}
      <button
        onClick={toggleTheme}
        style={{
          position: 'absolute', top: 20, left: 20,
          background: toggleBg,
          border: toggleBorder,
          borderRadius: '50%', width: 44, height: 44,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: toggleColor,
          transition: 'all 0.2s',
          zIndex: 10,
        }}
      >
        {isDark
          ? <SunIcon style={{ width: 20, height: 20 }} />
          : <MoonIcon style={{ width: 20, height: 20 }} />
        }
      </button>

      {/* Logo */}
      <img
        src="/evento_logo.svg"
        alt="Evento"
        style={{
          height: 52,
          marginBottom: 28,
          filter: isDark ? 'brightness(10)' : 'none',
          position: 'relative', zIndex: 1,
        }}
        onError={e => { e.target.style.display = 'none' }}
      />

      {/* Text content */}
      <div style={{ textAlign: 'center', padding: '0 24px', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        <h1 style={{
          fontSize: 'clamp(40px, 8vw, 68px)',
          fontWeight: 900,
          color: textColor,
          marginBottom: 16,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}>
          قريباً
        </h1>
        <p style={{
          fontSize: 16,
          color: subtextColor,
          lineHeight: 1.85,
          marginBottom: 40,
        }}>
          منصة Evento لحجز القاعات في العراق
          <br />
          قيد الإطلاق — ترقّب الجديد
        </p>

        {/* Animated dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#7C3AED',
                animation: `eventoPulse 1.4s ease-in-out ${i * 0.22}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes eventoPulse {
          0%, 100% { transform: scale(1); opacity: 0.65; }
          50% { transform: scale(1.35); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
