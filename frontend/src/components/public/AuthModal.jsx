import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { verifyTwoFactorLogin } from '../../api/twoFactorApi'
import { sendOtp, verifyOtp, register } from '../../api/authApi'

const ROLE_REDIRECT = {
  ADMIN:        '/admin/dashboard',
  CUSTOMER:     '/dashboard/customer',
  FARMER:       '/dashboard/farmer',
  DELIVERY_BOY: '/dashboard/delivery',
}

function detectIdentType(value) {
  const v = value.trim()
  if (/^[6-9]\d{9}$/.test(v)) return 'PHONE'
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'EMAIL'
  return 'USERNAME'
}

/* ── Eye Icon ─────────────────────────────────────────────── */
function EyeIcon({ visible }) {
  return visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

/* ── Spinner ──────────────────────────────────────────────── */
function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 16, height: 16,
      border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff',
      borderRadius: '50%', animation: 'am-spin 0.7s linear infinite',
      verticalAlign: 'middle', marginRight: 8, flexShrink: 0,
    }} />
  )
}

/* ── Floating-label Input (notched outline, MUI-style) ──────── */
function FloatingInput({
  label, type = 'text', value, onChange, error, autoFocus, onBlur,
  inputMode, maxLength, prefix, required, rightSlot,
}) {
  const [focused, setFocused] = useState(false)
  const [touched, setTouched] = useState(false)
  const hasValue = value != null && String(value).length > 0
  const floated = focused || hasValue
  const success = !error && touched && hasValue
  const active = focused || success
  const borderColor = error ? '#f87171' : (active ? '#16a34a' : '#e2e8f0')
  const labelColor  = error ? '#dc2626' : (active ? '#16a34a' : '#94a3b8')
  const notchLeft = prefix ? 58 : 10

  return (
    <div className="am-field" style={{ marginBottom: 16 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
        {/* Notched outline — border with a gap cut for the floated label */}
        <fieldset aria-hidden="true" style={{
          position: 'absolute', inset: 0, margin: 0, padding: 0,
          borderRadius: 10, border: `1.5px solid ${borderColor}`,
          background: error ? '#fff5f5' : '#fff',
          pointerEvents: 'none', minWidth: 0,
          boxShadow: focused ? (error ? '0 0 0 3px rgba(248,113,113,0.15)' : '0 0 0 3px rgba(22,163,74,0.12)') : 'none',
          transition: 'border-color 150ms, box-shadow 150ms',
        }}>
          <legend style={{
            marginLeft: notchLeft, padding: 0,
            fontSize: 11, lineHeight: '11px', whiteSpace: 'nowrap', overflow: 'hidden',
            maxWidth: floated ? 400 : 0.01, opacity: 0,
            transition: 'max-width 150ms ease',
          }}>
            {label}{required ? ' *' : ''}
          </legend>
        </fieldset>

        {prefix && (
          <span style={{
            position: 'relative', padding: '0 10px', fontSize: 13, color: '#64748b', fontWeight: 600,
            display: 'flex', alignItems: 'center', flexShrink: 0,
            borderRight: '1px solid #e2e8f0', margin: '8px 0',
          }}>
            {prefix}
          </span>
        )}

        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type={type} value={value} inputMode={inputMode} maxLength={maxLength}
            autoFocus={autoFocus}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={e => { setFocused(false); setTouched(true); onBlur && onBlur(e) }}
            style={{
              position: 'relative', width: '100%', boxSizing: 'border-box',
              padding: `13px ${rightSlot ? 40 : 14}px 13px 14px`,
              border: 'none', outline: 'none', fontSize: 14,
              color: '#1e293b', background: 'transparent',
            }}
          />
          <label style={{
            position: 'absolute', left: 14,
            top: floated ? 0 : '50%',
            transform: `translateY(-50%) scale(${floated ? 0.78 : 1})`,
            transformOrigin: 'left center',
            fontSize: 14, fontWeight: floated ? 700 : 400,
            color: labelColor,
            pointerEvents: 'none', transition: 'all 150ms ease', whiteSpace: 'nowrap',
          }}>
            {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
          </label>
          {success && !rightSlot && (
            <span style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              color: '#16a34a', fontSize: 15, fontWeight: 700, pointerEvents: 'none',
            }}>
              ✓
            </span>
          )}
          {rightSlot && (
            <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
              {rightSlot}
            </div>
          )}
        </div>
      </div>
      {error && (
        <p style={{ margin: '5px 0 0', fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
}

/* ── Floating-label Password field (show/hide eye) ─────────── */
function FloatingPasswordField({ label, value, onChange, error, autoFocus, onBlur, required }) {
  const [show, setShow] = useState(false)
  return (
    <FloatingInput
      label={label} type={show ? 'text' : 'password'} value={value} onChange={onChange}
      error={error} autoFocus={autoFocus} onBlur={onBlur} required={required}
      rightSlot={
        <button
          type="button" tabIndex={-1}
          onClick={() => setShow(s => !s)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 2,
            borderRadius: 4, transition: 'color 150ms',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#64748b'}
          onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
        >
          <EyeIcon visible={show} />
        </button>
      }
    />
  )
}

/* ── Primary Button ───────────────────────────────────────── */
function PrimaryBtn({ children, loading, disabled, type = 'submit' }) {
  const dis = loading || disabled
  return (
    <button type={type} disabled={dis}
      style={{
        width: '100%', padding: '13px', borderRadius: 12,
        fontSize: 15, fontWeight: 700, border: 'none',
        cursor: dis ? 'not-allowed' : 'pointer',
        background: dis ? '#86efac' : 'linear-gradient(135deg,#16a34a,#15803d)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: dis ? 'none' : '0 4px 16px rgba(22,163,74,0.35)',
        transition: 'opacity 150ms, transform 150ms, box-shadow 150ms',
        letterSpacing: '0.01em',
      }}
      onMouseEnter={e => { if (!dis) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(22,163,74,0.45)' } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = dis ? 'none' : '0 4px 16px rgba(22,163,74,0.35)' }}
    >
      {loading && <Spinner />}{children}
    </button>
  )
}

/* ── Toast Alert ──────────────────────────────────────────── */
const TOAST_DURATION = 4000

function Toast({ message, onDismiss }) {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(100)
  const timerRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    if (!message) { setVisible(false); return }
    setVisible(true)
    setProgress(100)
    startRef.current = Date.now()
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current
      const pct = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100)
      setProgress(pct)
      if (pct <= 0) { clearInterval(timerRef.current); setVisible(false); setTimeout(onDismiss, 300) }
    }, 30)
    return () => clearInterval(timerRef.current)
  }, [message])

  if (!message) return null

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      zIndex: 10, padding: '0 0 0 0',
      pointerEvents: visible ? 'auto' : 'none',
    }}>
      <div style={{
        margin: '10px 16px 0',
        background: '#1e293b',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        overflow: 'hidden',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.97)',
        opacity: visible ? 1 : 0,
        transition: 'transform 280ms cubic-bezier(0.34,1.56,0.64,1), opacity 250ms ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'rgba(239,68,68,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>
            ⚠️
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Error
            </div>
            <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.45 }}>{message}</div>
          </div>
          <button type="button"
            onClick={() => { setVisible(false); clearInterval(timerRef.current); setTimeout(onDismiss, 300) }}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
              color: '#94a3b8', width: 28, height: 28, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0, transition: 'background 150ms, color 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8' }}
          >✕</button>
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{
            height: '100%', background: 'linear-gradient(90deg,#ef4444,#f87171)',
            width: `${progress}%`, transition: 'width 30ms linear',
          }} />
        </div>
      </div>
    </div>
  )
}

/* ── OTP Coming Soon ─────────────────────────────────────── */
function OtpComingSoon() {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 1800)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>

      {/* Animated Icon */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 18 }}>
        {/* Ripple rings */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 80 + i * 28,
            height: 80 + i * 28,
            borderRadius: '50%',
            border: '1.5px solid rgba(22,163,74,0.18)',
            animation: `otp-ripple ${1.6 + i * 0.5}s ease-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }} />
        ))}
        {/* Main icon bubble */}
        <div style={{
          width: 76, height: 76, borderRadius: '50%',
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          border: '2px solid #86efac',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 34, position: 'relative', zIndex: 1,
          boxShadow: '0 8px 24px rgba(22,163,74,0.20)',
          transition: 'transform 1.8s ease',
          transform: pulse ? 'scale(1.06)' : 'scale(1)',
        }}>
          📲
        </div>
      </div>

      {/* Badge */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'linear-gradient(90deg,#16a34a,#15803d)',
        color: '#fff', fontSize: 10, fontWeight: 800,
        padding: '4px 12px', borderRadius: 999,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        marginBottom: 12, boxShadow: '0 2px 10px rgba(22,163,74,0.30)',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#86efac',
          display: 'inline-block', animation: 'otp-blink 1s ease-in-out infinite' }} />
        Coming Soon
      </div>

      {/* Heading */}
      <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
        OTP Login is on its way!
      </h3>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
        We're building something <strong style={{ color: '#16a34a' }}>secure & seamless</strong>.<br />
        Soon you'll be able to log in with just your mobile number.
      </p>

      {/* Notify banner */}
      <div style={{
        background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
        border: '1px solid #bbf7d0', borderRadius: 12,
        padding: '12px 14px', marginBottom: 4,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>🔔</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: '#15803d', marginBottom: 2 }}>
            We're working hard on this!
          </div>
          <div style={{ fontSize: 12, color: '#4ade80', lineHeight: 1.4 }}>
            Use <strong>Password login</strong> for now. OTP feature coming very soon 🚀
          </div>
        </div>
      </div>

      {/* Inline keyframes via style tag */}
      <style>{`
        @keyframes otp-ripple {
          0%   { opacity: 0.7; transform: translate(-50%,-50%) scale(0.8); }
          100% { opacity: 0;   transform: translate(-50%,-50%) scale(1.4); }
        }
        @keyframes otp-blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}

/* ── Mode Tabs ────────────────────────────────────────────── */
function ModeTabs({ loginMode, onChange }) {
  return (
    <div className="am-mode-tabs" style={{
      display: 'flex', borderRadius: 10,
      background: '#f1f5f9', padding: 3,
      border: '1px solid #e2e8f0', flexShrink: 0,
    }}>
      {[{ key: 'password', label: '🔑 Password' }, { key: 'otp', label: '📱 OTP' }].map(tab => (
        <button key={tab.key} type="button" className="am-mode-tab" onMouseDown={e => e.preventDefault()} onClick={() => onChange(tab.key)}
          style={{
            padding: '7px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: loginMode === tab.key ? 700 : 500,
            border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            background: loginMode === tab.key ? '#fff' : 'transparent',
            color: loginMode === tab.key ? '#15803d' : '#64748b',
            boxShadow: loginMode === tab.key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
            transition: 'all 150ms',
          }}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}

/* ── OTP Boxes ────────────────────────────────────────────── */
function OtpBoxes({ value, onChange }) {
  const inputs = useRef([])
  const digits = value.split('')
  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) { const n = [...digits]; n[i] = ''; onChange(n.join('')) }
      else if (i > 0) inputs.current[i - 1]?.focus()
      return
    }
    if (!/^[0-9]$/.test(e.key)) return
    const n = [...digits]; n[i] = e.key; onChange(n.join(''))
    if (i < 5) inputs.current[i + 1]?.focus()
  }
  const handlePaste = (e) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (p) { onChange(p.padEnd(6, '').slice(0, 6)); inputs.current[Math.min(p.length, 5)]?.focus() }
    e.preventDefault()
  }
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '20px 0' }}>
      {[0,1,2,3,4,5].map(i => (
        <input key={i} ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ''} onKeyDown={e => handleKey(i, e)} onPaste={handlePaste} onChange={() => {}}
          style={{
            width: 44, height: 52, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700,
            border: `2px solid ${digits[i] ? '#16a34a' : '#e2e8f0'}`,
            borderRadius: 10, outline: 'none',
            color: '#1e293b', background: digits[i] ? '#f0fdf4' : '#fff',
            transition: 'all 150ms', caretColor: 'transparent',
            boxShadow: digits[i] ? '0 0 0 3px rgba(22,163,74,0.12)' : 'none',
          }}
          onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)' }}
          onBlur={e  => { e.target.style.boxShadow = digits[i] ? '0 0 0 3px rgba(22,163,74,0.12)' : 'none' }}
        />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   LOGIN FORM
───────────────────────────────────────────────────────────── */
function LoginForm({ onSwitchToRegister, onSuccess, onLoadingChange, loginMode, onSwitchMode }) {
  const { login, setSession } = useAuth()
  const { t } = useTranslation(['auth'])

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [authStep, setAuthStep] = useState('credentials')
  const [tempToken, setTempToken] = useState('')
  const [otpCode2fa, setOtpCode2fa] = useState('')

  const [otpPhone, setOtpPhone] = useState('')
  const [otpPhoneError, setOtpPhoneError] = useState('')
  const [otpStep, setOtpStep] = useState('phone')
  const [otpDigits, setOtpDigits] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [devOtpNote, setDevOtpNote] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { onLoadingChange?.(loading) }, [loading])

  useEffect(() => {
    if (countdown <= 0) return
    const id = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  const setLoad = (v) => setLoading(v)

  const switchMode = (mode) => {
    onSwitchMode(mode); setError(''); setFieldErrors({})
    setOtpStep('phone'); setOtpDigits(''); setOtpPhone(''); setOtpPhoneError('')
    setAuthStep('credentials'); setOtpCode2fa('')
  }

  /* ── Password login ── */
  const validatePasswordForm = () => {
    const errs = {}
    if (!identifier.trim()) errs.identifier = 'Email, username or phone required'
    if (!password) errs.password = t('auth:validation_password_required')
    else if (password.length < 6) errs.password = t('auth:validation_password_min')
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    if (!validatePasswordForm()) return
    setError(''); setLoad(true)
    try {
      const data = await login({
        identifier: identifier.trim(),
        identifierType: detectIdentType(identifier),
        password,
        rememberMe: false,
      })
      if (data.requiresTwoFactor) { setTempToken(data.tempToken); setAuthStep('2fa'); return }
      onSuccess(data.role)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please check and try again.')
    } finally { setLoad(false) }
  }

  const handleVerify2fa = async (e) => {
    e.preventDefault()
    if (otpCode2fa.length < 6) return
    setError(''); setLoad(true)
    try {
      const { data } = await verifyTwoFactorLogin(tempToken, otpCode2fa, false)
      setSession(data)
      onSuccess(data.role)
    } catch (err) {
      setError(err.response?.data?.message || t('auth:invalid_code')); setOtpCode2fa('')
    } finally { setLoad(false) }
  }

  /* ── OTP login ── */
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!otpPhone || !/^[6-9]\d{9}$/.test(otpPhone)) { setOtpPhoneError('Enter a valid 10-digit Indian mobile number'); return }
    setOtpPhoneError(''); setError(''); setDevOtpNote(''); setLoad(true)
    try {
      const { data } = await sendOtp(otpPhone.trim())
      if (data.devOtp) {
        if (!data.smsSent) {
          setOtpDigits(data.devOtp)
          setDevOtpNote(`SMS failed — OTP auto-filled: ${data.devOtp}`)
        } else {
          setDevOtpNote(`OTP: ${data.devOtp} — use this if SMS not received`)
        }
      }
      setOtpStep('verify'); setCountdown(60)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally { setLoad(false) }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otpDigits.length < 6) return
    setError(''); setLoad(true)
    try {
      const { data } = await verifyOtp(otpPhone.trim(), otpDigits, false)
      setSession(data)
      onSuccess(data.role)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.'); setOtpDigits('')
    } finally { setLoad(false) }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    setError(''); setLoad(true)
    try {
      const { data } = await sendOtp(otpPhone.trim())
      setCountdown(60)
      if (data.devOtp) {
        if (!data.smsSent) {
          setOtpDigits(data.devOtp)
          setDevOtpNote(`SMS failed — OTP auto-filled: ${data.devOtp}`)
        } else {
          setDevOtpNote(`OTP: ${data.devOtp} — use this if SMS not received`)
        }
      } else { setOtpDigits('') }
    }
    catch (err) { setError(err.response?.data?.message || 'Failed to resend OTP.') }
    finally { setLoad(false) }
  }

  /* ── 2FA step ── */
  if (authStep === '2fa') return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 44, lineHeight: 1, marginBottom: 12 }}>🔐</div>
        <h3 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
          {t('auth:two_factor_title')}
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>{t('auth:two_factor_subtitle')}</p>
      </div>
      <Toast message={error} onDismiss={() => setError('')} />
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#15803d', display: 'flex', gap: 8 }}>
        <span>💡</span><span>{t('auth:two_factor_hint')}</span>
      </div>
      <form onSubmit={handleVerify2fa}>
        <OtpBoxes value={otpCode2fa} onChange={setOtpCode2fa} />
        <PrimaryBtn loading={loading} disabled={otpCode2fa.length < 6}>
          {loading ? t('auth:verifying') : t('auth:verify_code')}
        </PrimaryBtn>
        <button type="button" onClick={() => { setAuthStep('credentials'); setError(''); setOtpCode2fa('') }}
          style={{ width: '100%', marginTop: 10, padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1.5px solid #e2e8f0', cursor: 'pointer', background: '#fff', color: '#64748b', transition: 'background 150ms' }}>
          ← {t('auth:back_to_login')}
        </button>
      </form>
    </div>
  )

  return (
    <div>
      <Toast message={error} onDismiss={() => setError('')} />

      {/* ── Password mode ── */}
      {loginMode === 'password' && (
        <form onSubmit={handlePasswordLogin} noValidate>
          <FloatingInput
            label="Email / Username / Phone" required
            value={identifier} autoFocus
            onChange={v => { setIdentifier(v); if (fieldErrors.identifier) setFieldErrors(p => ({ ...p, identifier: '' })) }}
            onBlur={() => { if (!identifier.trim()) setFieldErrors(p => ({ ...p, identifier: 'This field is required' })) }}
            error={fieldErrors.identifier}
          />

          <FloatingPasswordField
            label="Password" required
            value={password}
            onChange={v => { setPassword(v); if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: '' })) }}
            error={fieldErrors.password}
            onBlur={() => {
              if (!password) setFieldErrors(p => ({ ...p, password: 'Password is required' }))
              else if (password.length < 6) setFieldErrors(p => ({ ...p, password: 'Min 6 characters' }))
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -8, marginBottom: 20 }}>
            <button type="button" style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, color: '#16a34a', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
              Forgot password?
            </button>
          </div>

          <PrimaryBtn loading={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </PrimaryBtn>
        </form>
      )}

      {/* ── OTP mode ── Coming Soon ── */}
      {loginMode === 'otp' && (
        <OtpComingSoon />
      )}

      <div style={{ height: 1, background: '#f1f5f9', margin: '20px 0 16px' }} />
      <p style={{ textAlign: 'center', margin: 0, fontSize: 13, color: '#64748b' }}>
        New customer?{' '}
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={onSwitchToRegister}
          style={{ background: 'none', border: 'none', padding: 0, color: '#16a34a', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
          Create account →
        </button>
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   REGISTER FORM
───────────────────────────────────────────────────────────── */
function RegisterForm({ onSwitchToLogin, onLoadingChange }) {
  const { t } = useTranslation(['auth'])

  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [errors, setErrors]     = useState({})
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)

  useEffect(() => { onLoadingChange?.(loading) }, [loading])

  const clearErr = (key) => setErrors(p => ({ ...p, [key]: '' }))

  const validate = () => {
    const e = {}
    if (!name.trim())                e.name     = 'Full name is required'
    else if (name.trim().length < 2) e.name     = 'Name must be at least 2 characters'
    if (!phone)                      e.phone    = 'Mobile number is required'
    else if (!/^[6-9]\d{9}$/.test(phone)) e.phone = 'Enter a valid 10-digit Indian number'
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address'
    if (!password)                   e.password = 'Password is required'
    else if (password.length < 6)   e.password = 'Minimum 6 characters required'
    if (!confirm)                    e.confirm  = 'Please confirm your password'
    else if (confirm !== password)   e.confirm  = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setError(''); setLoading(true)
    try {
      const { data } = await register({ name: name.trim(), phone, email: email.trim() || undefined, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify({ email: data.email, name: data.name, role: data.role }))
      localStorage.setItem('dairy_token_expiry', String(Date.now() + 86_400_000))
      localStorage.setItem('dairy_remember_me', 'false')
      setSuccess(true)
      setTimeout(() => { window.location.href = ROLE_REDIRECT[data.role] || '/dashboard/customer' }, 1200)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally { setLoading(false) }
  }

  if (success) return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ fontSize: 56, marginBottom: 14 }}>🎉</div>
      <h3 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>Account Created!</h3>
      <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>Redirecting you to your dashboard…</p>
    </div>
  )

  return (
    <div>
      <Toast message={error} onDismiss={() => setError('')} />

      <form onSubmit={handleSubmit} noValidate>
        {/* 2×2 Grid */}
        <div className="am-reg-grid">
          {/* Full Name */}
          <FloatingInput
            label="Full Name" required
            value={name} autoFocus
            onChange={v => { setName(v); clearErr('name') }}
            onBlur={() => { if (!name.trim()) setErrors(p => ({ ...p, name: 'Name is required' })) }}
            error={errors.name}
          />

          {/* Mobile Number */}
          <FloatingInput
            label="Mobile Number" required
            type="tel" inputMode="numeric" maxLength={10} prefix="🇮🇳 +91"
            value={phone}
            onChange={v => { setPhone(v.replace(/\D/g, '').slice(0, 10)); clearErr('phone') }}
            onBlur={() => { if (phone && !/^[6-9]\d{9}$/.test(phone)) setErrors(p => ({ ...p, phone: 'Invalid number' })) }}
            error={errors.phone}
          />

          {/* Email — Optional, collapsed by default to save vertical space */}
          <div>
            {showEmail ? (
              <FloatingInput
                label="Email (optional)" type="email"
                value={email}
                onChange={v => { setEmail(v); clearErr('email') }}
                error={errors.email}
              />
            ) : (
              <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setShowEmail(true)}
                style={{
                  background: 'none', border: 'none', padding: '13px 0', margin: 0,
                  color: '#16a34a', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                + Add email <span style={{ color: '#94a3b8', fontWeight: 500 }}>(optional)</span>
              </button>
            )}
          </div>

          {/* Password */}
          <FloatingPasswordField
            label="Password" required
            value={password}
            onChange={v => { setPassword(v); clearErr('password') }}
            error={errors.password}
            onBlur={() => {
              if (!password) setErrors(p => ({ ...p, password: 'Required' }))
              else if (password.length < 6) setErrors(p => ({ ...p, password: 'Min 6 chars' }))
            }}
          />
        </div>

        {/* Confirm Password — full width */}
        <FloatingPasswordField
          label="Confirm Password" required
          value={confirm}
          onChange={v => { setConfirm(v); clearErr('confirm') }}
          error={errors.confirm}
          onBlur={() => {
            if (!confirm) setErrors(p => ({ ...p, confirm: 'Required' }))
            else if (confirm !== password) setErrors(p => ({ ...p, confirm: 'Passwords do not match' }))
          }}
        />

        {/* Password strength hint */}
        {password.length > 0 && (
          <div style={{ marginTop: -8, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{
                  height: 3, flex: 1, borderRadius: 2,
                  background: password.length >= i * 3
                    ? i <= 1 ? '#ef4444' : i <= 2 ? '#f59e0b' : i <= 3 ? '#22c55e' : '#16a34a'
                    : '#e2e8f0',
                  transition: 'background 300ms',
                }} />
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 11, color: password.length < 6 ? '#ef4444' : password.length < 9 ? '#f59e0b' : '#16a34a' }}>
              {password.length < 6 ? 'Weak — min 6 chars' : password.length < 9 ? 'Fair' : 'Strong password ✓'}
            </p>
          </div>
        )}

        <PrimaryBtn loading={loading}>
          {loading ? 'Creating account…' : 'Create Account →'}
        </PrimaryBtn>
      </form>

      <div style={{ height: 1, background: '#f1f5f9', margin: '20px 0 16px' }} />
      <p style={{ textAlign: 'center', margin: 0, fontSize: 13, color: '#64748b' }}>
        Already have an account?{' '}
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={onSwitchToLogin}
          style={{ background: 'none', border: 'none', padding: 0, color: '#16a34a', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
          Sign In →
        </button>
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   AUTH MODAL (root export)
───────────────────────────────────────────────────────────── */
export default function AuthModal({ isOpen, onClose, initialView = 'login' }) {
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const [view, setView]           = useState(initialView)
  const [loginMode, setLoginMode] = useState('password')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => { if (isOpen) setView(initialView) }, [isOpen, initialView])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape' && !isLoading) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, isLoading])

  useEffect(() => { if (isOpen && user) onClose() }, [isOpen, user])

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) onClose()
  }

  const handleLoginSuccess = (role) => {
    onClose()
    navigate(ROLE_REDIRECT[role] || '/dashboard/customer')
  }

  if (!isOpen) return null

  return (
    <div className="am-overlay" onClick={handleOverlayClick}>
      <div className="am-card" role="dialog" aria-modal="true" style={{ position: 'relative' }}>

        {/* Header — single row on desktop, stacks on mobile (see @media below) */}
        <div className="am-header" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', flexWrap: 'nowrap' }}>
          {/* Logo */}
          <div className="am-header-brand" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
              🥛
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
              Dairy<span style={{ color: '#16a34a' }}>Fresh</span>
            </span>
          </div>

          {/* Vertical divider */}
          <div className="am-header-divider" style={{ width: 1, height: 28, background: '#e2e8f0', flexShrink: 0 }} />

          {/* Title + subtitle */}
          <div className="am-header-titles" style={{ flex: 1, minWidth: 0 }}>
            <div className="am-title-text" style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {view === 'register'
                ? 'Create Account 🥛'
                : loginMode === 'password' ? 'Welcome Back 👋' : '📱 OTP Login'}
            </div>
            <div className="am-subtitle-text" style={{ fontSize: 12, color: '#64748b', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {view === 'register'
                ? 'Join as a customer today'
                : loginMode === 'password' ? 'Sign in to your account' : 'Login with your mobile number'}
            </div>
          </div>

          {/* Tabs — login only */}
          {view === 'login' && (
            <div className="am-header-tabs-wrap">
              <ModeTabs loginMode={loginMode} onChange={(mode) => setLoginMode(mode)} />
            </div>
          )}

          {/* Close */}
          <button className="am-close" onMouseDown={e => e.preventDefault()} onClick={() => !isLoading && onClose()} aria-label="Close"
            style={{ opacity: isLoading ? 0.4 : 1, cursor: isLoading ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
            ✕
          </button>
        </div>

        <div style={{ height: 1, background: '#f1f5f9' }} />

        <div className="am-body" style={{ padding: '24px 24px 28px' }}>
          {view === 'login'
            ? <LoginForm
                onSwitchToRegister={() => { setView('register'); setLoginMode('password') }}
                onSuccess={handleLoginSuccess}
                onLoadingChange={setIsLoading}
                loginMode={loginMode}
                onSwitchMode={setLoginMode}
              />
            : <RegisterForm
                onSwitchToLogin={() => setView('login')}
                onLoadingChange={setIsLoading}
              />
          }
        </div>
      </div>

      <style>{`
        @keyframes am-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes am-shake {
          0%, 100% { transform: translateX(0) }
          15% { transform: translateX(-6px) }
          30% { transform: translateX(5px) }
          45% { transform: translateX(-4px) }
          60% { transform: translateX(3px) }
          75% { transform: translateX(-2px) }
        }
        @media (max-width: 520px) {
          .am-overlay { padding: 0 !important; align-items: flex-end !important; overflow-x: hidden !important; }
          .am-card {
            max-width: 100% !important;
            border-radius: 20px 20px 0 0 !important;
            max-height: 95vh !important;
            overflow-x: hidden !important;
          }
          .am-reg-grid { grid-template-columns: 1fr !important; gap: 10px !important; margin-bottom: 10px !important; }

          /* Header: stack into 3 rows — [logo ... close] / [title] / [tabs] */
          .am-header {
            flex-wrap: wrap !important;
            row-gap: 10px !important;
            padding: 14px 16px 12px !important;
          }
          .am-header-brand   { order: 1 !important; }
          .am-close          { order: 2 !important; margin-left: auto !important; }
          .am-header-divider { display: none !important; }
          .am-header-titles  { order: 3 !important; flex: 1 1 100% !important; }
          .am-header-tabs-wrap { order: 4 !important; flex: 1 1 100% !important; }
          .am-title-text, .am-subtitle-text {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
          }
          .am-mode-tabs { width: 100% !important; }
          .am-mode-tab  { flex: 1 !important; text-align: center !important; justify-content: center !important; }

          .am-field { margin-bottom: 12px !important; }
          .am-body  { padding: 20px 20px 22px !important; }
        }

        @media (max-width: 380px) {
          .am-body { padding: 20px 16px 24px !important; }
        }
      `}</style>
    </div>
  )
}
