import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const intlLocale = { en: 'en', te: 'te' }

function LiveClock() {
  const { i18n } = useTranslation()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const locale = intlLocale[i18n.language] || 'en'

  const dateStr = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(now)

  const timeStr = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(now)

  return (
    <div style={{ textAlign: 'right', lineHeight: 1.4 }}>
      <div
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-text)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.02em',
        }}
      >
        {timeStr}
      </div>
      <div
        style={{
          fontSize: '11px',
          color: 'var(--color-text-muted)',
          marginTop: '1px',
          whiteSpace: 'nowrap',
        }}
      >
        {dateStr}
      </div>
    </div>
  )
}

export default LiveClock
