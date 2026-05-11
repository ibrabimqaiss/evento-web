import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ isOpen, onClose, title, children, maxWidth = '520px' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 999999,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--modal-bg, #1e1540)',
        border: '1px solid var(--border, rgba(255,255,255,0.12))',
        borderRadius: '20px',
        width: '100%',
        maxWidth,
        maxHeight: '88vh',
        overflowY: 'auto',
        padding: '28px 24px',
        position: 'relative',
        boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
        margin: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          direction: 'rtl',
        }}>
          <h2 style={{
            color: 'var(--text-primary, #ffffff)',
            fontSize: '1.25rem',
            fontWeight: 700,
            margin: 0,
          }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary, #ffffff)',
            fontSize: '1.2rem',
            flexShrink: 0,
          }}>×</button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}
