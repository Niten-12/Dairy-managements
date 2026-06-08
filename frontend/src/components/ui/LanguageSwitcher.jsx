import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', native: 'English', flag: '🇬🇧' },
  { code: 'te', native: 'తెలుగు',  flag: '🇮🇳' },
]

function LanguageSwitcher({ accentColor = 'var(--color-blue-600)', borderColor = 'var(--color-border)' }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (code) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((p) => !p)}
        title="Switch language"
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '6px 10px', borderRadius: 'var(--radius-md)',
          border: `1px solid ${borderColor}`,
          background: 'transparent', cursor: 'pointer',
          fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)',
          color: 'var(--color-text)',
          transition: 'background var(--transition-fast)',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-slate-100)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ fontSize: '15px', lineHeight: 1 }}>{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
        <span style={{ fontSize: '9px', opacity: 0.55, marginLeft: '1px' }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-dropdown)',
            minWidth: '170px', zIndex: 70, overflow: 'hidden',
            animation: 'scaleIn 150ms both', transformOrigin: 'top right',
          }}
        >
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === current.code
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px',
                  background: isActive ? 'var(--color-slate-50)' : 'transparent',
                  cursor: 'pointer', fontSize: 'var(--text-sm)', textAlign: 'left',
                  fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-normal)',
                  color: isActive ? accentColor : 'var(--color-text)',
                  transition: 'background var(--transition-fast)',
                  borderBottom: '1px solid var(--color-border)',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--color-slate-50)' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: '20px', lineHeight: 1, flexShrink: 0 }}>{lang.flag}</span>
                <span style={{ flex: 1 }}>{lang.native}</span>
                {isActive && (
                  <span style={{ fontSize: '13px', color: accentColor, marginLeft: 'auto' }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher
