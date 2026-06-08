import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useBrand } from '../context/BrandContext'
import { verifyTwoFactorLogin } from '../api/twoFactorApi'
import { sendOtp, verifyOtp } from '../api/authApi'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'

const roleRedirect = {
  ADMIN:        '/admin/dashboard',
  CUSTOMER:     '/dashboard/customer',
  FARMER:       '/dashboard/farmer',
  DELIVERY_BOY: '/dashboard/delivery',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: '16px', height: '16px',
      border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff',
      borderRadius: '50%', animation: 'spin 0.7s linear infinite',
      verticalAlign: 'middle', marginRight: '8px',
    }} />
  )
}

function OtpBoxes({ value, onChange }) {
  const inputs = useRef([])
  const digits = value.split('')

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits]; next[i] = ''; onChange(next.join(''))
      } else if (i > 0) { inputs.current[i - 1]?.focus() }
      return
    }
    if (!/^[0-9]$/.test(e.key)) return
    const next = [...digits]; next[i] = e.key; onChange(next.join(''))
    if (i < 5) inputs.current[i + 1]?.focus()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) { onChange(pasted.padEnd(6, '').slice(0, 6)); inputs.current[Math.min(pasted.length, 5)]?.focus() }
    e.preventDefault()
  }

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0' }}>
      {[0,1,2,3,4,5].map(i => (
        <input key={i} ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ''} onKeyDown={e => handleKey(i, e)} onPaste={handlePaste} onChange={() => {}}
          style={{
            width: '46px', height: '52px', textAlign: 'center',
            fontSize: '1.4rem', fontWeight: 'var(--font-bold)',
            border: `2px solid ${digits[i] ? 'var(--color-blue-500)' : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-md)', outline: 'none',
            color: 'var(--color-text)', background: digits[i] ? 'var(--color-blue-50)' : '#fff',
            transition: 'all var(--transition-fast)', caretColor: 'transparent',
          }}
          onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'}
          onBlur={e  => e.target.style.boxShadow = 'none'}
        />
      ))}
    </div>
  )
}

// ── Validation ───────────────────────────────────────────────────────────────

const VALIDATORS = {
  EMAIL:    v => !v ? 'validation_email_required'    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'validation_email_invalid'    : '',
  USERNAME: v => !v ? 'validation_username_required' : !/^[a-zA-Z0-9_]{3,30}$/.test(v)       ? 'validation_username_invalid' : '',
  PHONE:    v => !v ? 'validation_phone_required'    : !/^[6-9]\d{9}$/.test(v)               ? 'validation_phone_invalid'   : '',
}
const validatePassword = v => !v ? 'validation_password_required' : v.length < 6 ? 'validation_password_min' : ''
const validatePhone    = v => !v ? 'validation_phone_required'    : !/^[6-9]\d{9}$/.test(v) ? 'validation_phone_invalid' : ''

// ── Input field ──────────────────────────────────────────────────────────────

function Field({ label, type = 'text', value, onChange, placeholder, error, autoFocus }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} autoFocus={autoFocus}
        style={{
          width: '100%', padding: '11px 14px', boxSizing: 'border-box',
          border: `1.5px solid ${error ? 'var(--color-red-400)' : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)', fontSize: 'var(--text-base)', outline: 'none',
          color: 'var(--color-text)', background: '#fff',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
        }}
        onFocus={e => { e.target.style.borderColor = error ? 'var(--color-red-400)' : 'var(--color-blue-500)'; e.target.style.boxShadow = error ? '0 0 0 3px rgba(239,68,68,0.12)' : '0 0 0 3px rgba(37,99,235,0.12)' }}
        onBlur={e  => { e.target.style.borderColor = error ? 'var(--color-red-400)' : 'var(--color-border)';  e.target.style.boxShadow = 'none' }}
      />
      {error && <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-red-600)' }}>{error}</p>}
    </div>
  )
}

// ── Primary button ───────────────────────────────────────────────────────────

function PrimaryBtn({ children, loading, disabled, onClick, type = 'submit' }) {
  const dis = loading || disabled
  return (
    <button type={type} disabled={dis} onClick={onClick}
      style={{
        width: '100%', padding: '13px', borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)',
        border: 'none', cursor: dis ? 'not-allowed' : 'pointer',
        background: dis ? 'var(--color-blue-300)' : 'linear-gradient(135deg,var(--color-blue-600),var(--color-blue-500))',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
        boxShadow: dis ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
        transition: 'opacity var(--transition-fast), transform var(--transition-fast)',
      }}
      onMouseEnter={e => { if (!dis) { e.currentTarget.style.opacity = '0.92'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {loading && <Spinner />}{children}
    </button>
  )
}

// ── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message, shakeKey }) {
  if (!message) return null
  return (
    <div key={shakeKey} className="anim-shake" style={{
      background: 'var(--color-red-50)', color: 'var(--color-red-700)',
      padding: '11px 14px', borderRadius: 'var(--radius-md)', marginBottom: '18px',
      fontSize: 'var(--text-sm)', border: '1px solid var(--color-red-200)',
      display: 'flex', alignItems: 'flex-start', gap: '8px', animationFillMode: 'both',
    }}>
      <span style={{ flexShrink: 0 }}>⚠️</span><span>{message}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function Login() {
  const { login }      = useAuth()
  const { brandName }  = useBrand()
  const navigate       = useNavigate()
  const { t }          = useTranslation(['auth', 'common'])

  // ── Login mode: 'password' | 'otp' ────────────────────────────────────────
  const [loginMode, setLoginMode]         = useState('password')

  // ── Password-login state ───────────────────────────────────────────────────
  const [identType, setIdentType]         = useState('EMAIL')  // EMAIL | USERNAME | PHONE
  const [identifier, setIdentifier]       = useState('')
  const [password, setPassword]           = useState('')
  const [rememberMe, setRememberMe]       = useState(false)
  const [fieldErrors, setFieldErrors]     = useState({})
  const [authStep, setAuthStep]           = useState('credentials') // credentials | 2fa
  const [tempToken, setTempToken]         = useState('')
  const [otpCode2fa, setOtpCode2fa]       = useState('')

  // ── OTP-login state ────────────────────────────────────────────────────────
  const [otpPhone, setOtpPhone]           = useState('')
  const [otpPhoneError, setOtpPhoneError] = useState('')
  const [otpStep, setOtpStep]             = useState('phone') // phone | verify
  const [otpDigits, setOtpDigits]         = useState('')
  const [otpRememberMe, setOtpRememberMe] = useState(false)
  const [countdown, setCountdown]         = useState(0)

  // ── Shared ─────────────────────────────────────────────────────────────────
  const [error, setError]                 = useState('')
  const [loading, setLoading]             = useState(false)
  const [shakeKey, setShakeKey]           = useState(0)

  const shake = useCallback(() => setShakeKey(k => k + 1), [])

  // ── Countdown timer for OTP resend ─────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return
    const id = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  // Reset identifier when type changes
  useEffect(() => { setIdentifier(''); setFieldErrors({}) }, [identType])

  // Reset OTP step when switching modes
  const switchMode = (mode) => {
    setLoginMode(mode); setError(''); setFieldErrors({})
    setOtpStep('phone'); setOtpDigits(''); setOtpPhone(''); setOtpPhoneError('')
    setAuthStep('credentials'); setOtpCode2fa('')
  }

  // ── Password login ──────────────────────────────────────────────────────────

  const validatePasswordForm = () => {
    const errs = {}
    const identErr = VALIDATORS[identType]?.(identifier.trim())
    if (identErr) errs.identifier = t(`auth:${identErr}`)
    const passErr  = validatePassword(password)
    if (passErr)  errs.password  = t(`auth:${passErr}`)
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    if (!validatePasswordForm()) { shake(); return }
    setError(''); setLoading(true)
    try {
      const data = await login({
        identifier:     identifier.trim(),
        identifierType: identType,
        password,
        rememberMe,
      })
      if (data.requiresTwoFactor) { setTempToken(data.tempToken); setAuthStep('2fa'); return }
      navigate(roleRedirect[data.role] || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || t('auth:login_failed')); shake()
    } finally { setLoading(false) }
  }

  const handleVerify2fa = async (e) => {
    e.preventDefault()
    if (otpCode2fa.length < 6) return
    setError(''); setLoading(true)
    try {
      const { data } = await verifyTwoFactorLogin(tempToken, otpCode2fa, rememberMe)
      localStorage.setItem('token',                data.token)
      localStorage.setItem('user',                 JSON.stringify({ email: data.email, name: data.name, role: data.role }))
      localStorage.setItem('dairy_token_expiry',   String(Date.now() + data.expiresIn))
      localStorage.setItem('dairy_remember_me',    String(data.rememberMe || false))
      window.location.href = roleRedirect[data.role] || '/dashboard'
    } catch (err) {
      setError(err.response?.data?.message || t('auth:invalid_code')); shake(); setOtpCode2fa('')
    } finally { setLoading(false) }
  }

  // ── OTP login ───────────────────────────────────────────────────────────────

  const handleSendOtp = async (e) => {
    e.preventDefault()
    const err = validatePhone(otpPhone.trim())
    if (err) { setOtpPhoneError(t(`auth:${err}`)); shake(); return }
    setOtpPhoneError(''); setError(''); setLoading(true)
    try {
      await sendOtp(otpPhone.trim())
      setOtpStep('verify'); setCountdown(60)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.'); shake()
    } finally { setLoading(false) }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otpDigits.length < 6) return
    setError(''); setLoading(true)
    try {
      const { data } = await verifyOtp(otpPhone.trim(), otpDigits, otpRememberMe)
      localStorage.setItem('token',                data.token)
      localStorage.setItem('user',                 JSON.stringify({ email: data.email, name: data.name, role: data.role }))
      localStorage.setItem('dairy_token_expiry',   String(Date.now() + data.expiresIn))
      localStorage.setItem('dairy_remember_me',    String(data.rememberMe || false))
      window.location.href = roleRedirect[data.role] || '/dashboard'
    } catch (err) {
      setError(err.response?.data?.message || t('auth:invalid_code')); shake(); setOtpDigits('')
    } finally { setLoading(false) }
  }

  const handleResendOtp = async () => {
    if (countdown > 0) return
    setError(''); setLoading(true)
    try {
      await sendOtp(otpPhone.trim()); setCountdown(60); setOtpDigits('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.'); shake()
    } finally { setLoading(false) }
  }

  // ── Identifier placeholder ──────────────────────────────────────────────────
  const identPlaceholder = {
    EMAIL:    t('auth:email_placeholder'),
    USERNAME: t('auth:username_placeholder'),
    PHONE:    t('auth:phone_placeholder'),
  }[identType]

  const identInputType = identType === 'EMAIL' ? 'email' : identType === 'PHONE' ? 'tel' : 'text'

  const features = [
    { icon: '🥛', text: t('auth:feature_tracking') },
    { icon: '🚚', text: t('auth:feature_delivery') },
    { icon: '💰', text: t('auth:feature_payment') },
  ]

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-family)' }}>

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className="login-left-panel" style={{
        flex: '0 0 50%',
        background: 'linear-gradient(145deg,#1e40af 0%,#2563eb 40%,#3b82f6 75%,#60a5fa 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'flex-start', padding: '60px 56px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '360px', height: '360px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '420px' }}>
          <div className="anim-fade-in-up" style={{ fontSize: '56px', lineHeight: 1, marginBottom: '20px', animationFillMode: 'both' }}>🥛</div>
          <h1 className="anim-fade-in-up anim-delay-1" style={{ margin: '0 0 8px', fontSize: '2.5rem', fontWeight: 'var(--font-extrabold)', color: '#fff', lineHeight: 1.15, animationFillMode: 'both' }}>
            {brandName}
          </h1>
          <p className="anim-fade-in-up anim-delay-2" style={{ margin: '0 0 40px', fontSize: 'var(--text-lg)', color: 'rgba(255,255,255,0.75)', fontWeight: 'var(--font-normal)', lineHeight: 1.5, animationFillMode: 'both' }}>
            {t('auth:tagline')}
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '18px', margin: 0, padding: 0 }}>
            {features.map((f, i) => (
              <li key={i} className={`anim-fade-in-up anim-delay-${i + 3}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', animationFillMode: 'both' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, backdropFilter: 'blur(4px)' }}>
                  {f.icon}
                </div>
                <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-medium)' }}>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <div style={{
        flex: '0 0 50%', background: '#fff', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', padding: '48px 40px',
        overflowY: 'auto', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: '20px', right: '24px' }}>
          <LanguageSwitcher accentColor="var(--color-blue-600)" />
        </div>

        {/* Mobile logo */}
        <div className="login-mobile-logo" style={{ textAlign: 'center', marginBottom: '28px', display: 'none' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>🥛</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>{brandName}</div>
        </div>

        <div className="anim-scale-in" style={{ width: '100%', maxWidth: '400px', animationFillMode: 'both' }}>

          {/* ════════════════════════════════════════════════════════════════
              STEP: 2FA (shared — same regardless of login mode)
          ═══════════════════════════════════════════════════════════════════ */}
          {authStep === '2fa' ? (
            <>
              <div style={{ marginBottom: '28px', textAlign: 'center' }}>
                <div style={{ fontSize: '44px', marginBottom: '12px', lineHeight: 1 }}>🔐</div>
                <h2 style={{ margin: '0 0 6px', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
                  {t('auth:two_factor_title')}
                </h2>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  {t('auth:two_factor_subtitle')}
                </p>
              </div>
              <ErrorBanner message={error} shakeKey={shakeKey} />
              <form onSubmit={handleVerify2fa}>
                <div style={{ background: 'var(--color-blue-50)', border: '1px solid var(--color-blue-200)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: '8px', fontSize: 'var(--text-sm)', color: 'var(--color-blue-700)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ flexShrink: 0 }}>💡</span><span>{t('auth:two_factor_hint')}</span>
                </div>
                <OtpBoxes value={otpCode2fa} onChange={setOtpCode2fa} />
                <PrimaryBtn loading={loading} disabled={otpCode2fa.length < 6}>
                  {loading ? t('auth:verifying') : t('auth:verify_code')}
                </PrimaryBtn>
                <button type="button" onClick={() => { setAuthStep('credentials'); setError(''); setOtpCode2fa('') }}
                  style={{ width: '100%', marginTop: '10px', padding: '11px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', border: '1.5px solid var(--color-border)', cursor: 'pointer', background: '#fff', color: 'var(--color-text-muted)' }}>
                  ← {t('auth:back_to_login')}
                </button>
              </form>
            </>

          ) : (
            <>
              {/* ── Mode tabs ─────────────────────────────────────────────── */}
              <div style={{ display: 'flex', borderRadius: 'var(--radius-lg)', background: 'var(--color-blue-50)', padding: '4px', marginBottom: '28px', border: '1px solid var(--color-blue-100)' }}>
                {[
                  { key: 'password', label: t('auth:tab_password') },
                  { key: 'otp',      label: t('auth:tab_otp') },
                ].map(tab => (
                  <button key={tab.key} type="button" onClick={() => switchMode(tab.key)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 'calc(var(--radius-lg) - 2px)',
                      fontSize: 'var(--text-sm)', fontWeight: loginMode === tab.key ? 'var(--font-semibold)' : 'var(--font-normal)',
                      border: 'none', cursor: 'pointer',
                      background: loginMode === tab.key ? '#fff' : 'transparent',
                      color:      loginMode === tab.key ? 'var(--color-blue-700)' : 'var(--color-text-muted)',
                      boxShadow:  loginMode === tab.key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                      transition: 'all var(--transition-fast)',
                    }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <ErrorBanner message={error} shakeKey={shakeKey} />

              {/* ════════════════════════════════════════════════════════════
                  PASSWORD LOGIN
              ═════════════════════════════════════════════════════════════ */}
              {loginMode === 'password' && (
                <>
                  <div style={{ marginBottom: '22px' }}>
                    <h2 style={{ margin: '0 0 4px', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
                      {t('auth:welcome_back')}
                    </h2>
                    <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
                      {t('auth:sign_in_account')}
                    </p>
                  </div>

                  <form onSubmit={handlePasswordLogin}>
                    {/* Identifier type segmented control */}
                    <div style={{ marginBottom: '6px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>
                        {t('auth:identifier_label')}
                      </label>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                        {['EMAIL', 'USERNAME', 'PHONE'].map(type => (
                          <button key={type} type="button" onClick={() => setIdentType(type)}
                            style={{
                              flex: 1, padding: '6px 0', borderRadius: 'var(--radius-sm)',
                              fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                              border: `1.5px solid ${identType === type ? 'var(--color-blue-500)' : 'var(--color-border)'}`,
                              background: identType === type ? 'var(--color-blue-50)' : '#fff',
                              color:      identType === type ? 'var(--color-blue-700)' : 'var(--color-text-muted)',
                              cursor: 'pointer', transition: 'all var(--transition-fast)',
                            }}>
                            {t(`auth:identifier_${type.toLowerCase()}`)}
                          </button>
                        ))}
                      </div>
                      <input
                        type={identInputType}
                        value={identifier}
                        onChange={e => { setIdentifier(e.target.value); if (fieldErrors.identifier) setFieldErrors(p => ({ ...p, identifier: '' })) }}
                        placeholder={identPlaceholder}
                        autoComplete={identType === 'EMAIL' ? 'email' : identType === 'PHONE' ? 'tel' : 'username'}
                        style={{
                          width: '100%', padding: '11px 14px', boxSizing: 'border-box',
                          border: `1.5px solid ${fieldErrors.identifier ? 'var(--color-red-400)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-md)', fontSize: 'var(--text-base)', outline: 'none',
                          color: 'var(--color-text)', background: '#fff', transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                        }}
                        onFocus={e => { e.target.style.borderColor = fieldErrors.identifier ? 'var(--color-red-400)' : 'var(--color-blue-500)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)' }}
                        onBlur={e  => { e.target.style.borderColor = fieldErrors.identifier ? 'var(--color-red-400)' : 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
                      />
                      {fieldErrors.identifier && <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-red-600)' }}>{fieldErrors.identifier}</p>}
                    </div>

                    {/* Password */}
                    <div style={{ marginBottom: '20px', marginTop: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>
                        {t('auth:password_label')}
                      </label>
                      <input
                        type="password" value={password}
                        onChange={e => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors(p => ({ ...p, password: '' })) }}
                        placeholder={t('auth:password_placeholder')} autoComplete="current-password"
                        style={{
                          width: '100%', padding: '11px 14px', boxSizing: 'border-box',
                          border: `1.5px solid ${fieldErrors.password ? 'var(--color-red-400)' : 'var(--color-border)'}`,
                          borderRadius: 'var(--radius-md)', fontSize: 'var(--text-base)', outline: 'none',
                          color: 'var(--color-text)', background: '#fff', transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
                        }}
                        onFocus={e => { e.target.style.borderColor = fieldErrors.password ? 'var(--color-red-400)' : 'var(--color-blue-500)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.12)' }}
                        onBlur={e  => { e.target.style.borderColor = fieldErrors.password ? 'var(--color-red-400)' : 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
                      />
                      {fieldErrors.password && <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-red-600)' }}>{fieldErrors.password}</p>}
                    </div>

                    {/* Remember me + Forgot password */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                        <div onClick={() => setRememberMe(p => !p)} style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${rememberMe ? 'var(--color-blue-600)' : 'var(--color-border)'}`, background: rememberMe ? 'var(--color-blue-600)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all var(--transition-fast)', cursor: 'pointer' }}>
                          {rememberMe && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </div>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{t('auth:remember_me')}</span>
                      </label>
                      <button type="button" style={{ background: 'none', border: 'none', padding: 0, fontSize: 'var(--text-sm)', color: 'var(--color-blue-600)', fontWeight: 'var(--font-medium)', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                        {t('auth:forgot_password')}
                      </button>
                    </div>

                    <PrimaryBtn loading={loading}>
                      {loading ? t('auth:signing_in') : t('auth:sign_in')}
                    </PrimaryBtn>
                  </form>
                </>
              )}

              {/* ════════════════════════════════════════════════════════════
                  OTP LOGIN
              ═════════════════════════════════════════════════════════════ */}
              {loginMode === 'otp' && (
                <>
                  {otpStep === 'phone' ? (
                    <>
                      <div style={{ marginBottom: '24px' }}>
                        <h2 style={{ margin: '0 0 4px', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
                          {t('auth:otp_login_title')}
                        </h2>
                        <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
                          {t('auth:otp_login_subtitle')}
                        </p>
                      </div>

                      <form onSubmit={handleSendOtp}>
                        <div style={{ marginBottom: '24px' }}>
                          <label style={{ display: 'block', marginBottom: '6px', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>
                            {t('auth:otp_phone_label')}
                          </label>
                          {/* +91 prefix input */}
                          <div style={{ display: 'flex', border: `1.5px solid ${otpPhoneError ? 'var(--color-red-400)' : 'var(--color-border)'}`, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#fff', transition: 'border-color var(--transition-fast)' }}
                            onFocusCapture={e => e.currentTarget.style.borderColor = otpPhoneError ? 'var(--color-red-400)' : 'var(--color-blue-500)'}
                            onBlurCapture={e  => e.currentTarget.style.borderColor = otpPhoneError ? 'var(--color-red-400)' : 'var(--color-border)'}>
                            <span style={{ padding: '11px 12px', background: '#f8fafc', borderRight: '1px solid var(--color-border)', fontSize: 'var(--text-base)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-medium)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                              🇮🇳 +91
                            </span>
                            <input
                              type="tel" value={otpPhone} inputMode="numeric" maxLength={10}
                              onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setOtpPhone(v); if (otpPhoneError) setOtpPhoneError('') }}
                              placeholder={t('auth:otp_phone_placeholder')} autoFocus
                              style={{ flex: 1, padding: '11px 14px', border: 'none', outline: 'none', fontSize: 'var(--text-base)', color: 'var(--color-text)', background: 'transparent' }}
                            />
                          </div>
                          {otpPhoneError && <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-red-600)' }}>{otpPhoneError}</p>}
                        </div>

                        <PrimaryBtn loading={loading} disabled={otpPhone.length !== 10}>
                          {loading ? t('auth:sending_otp') : t('auth:send_otp')}
                        </PrimaryBtn>
                      </form>
                    </>
                  ) : (
                    /* OTP verify step */
                    <>
                      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px', lineHeight: 1 }}>📱</div>
                        <h2 style={{ margin: '0 0 6px', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
                          {t('auth:otp_verify_title')}
                        </h2>
                        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                          {t('auth:otp_verify_subtitle', { phone: otpPhone })}
                        </p>
                      </div>

                      <form onSubmit={handleVerifyOtp}>
                        <OtpBoxes value={otpDigits} onChange={setOtpDigits} />

                        {/* Remember me */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', marginBottom: '20px' }}>
                          <div onClick={() => setOtpRememberMe(p => !p)} style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${otpRememberMe ? 'var(--color-blue-600)' : 'var(--color-border)'}`, background: otpRememberMe ? 'var(--color-blue-600)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all var(--transition-fast)', cursor: 'pointer' }}>
                            {otpRememberMe && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{t('auth:remember_me')}</span>
                        </label>

                        <PrimaryBtn loading={loading} disabled={otpDigits.length < 6}>
                          {loading ? t('auth:verifying') : t('auth:verify_otp')}
                        </PrimaryBtn>

                        {/* Resend + Change number */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
                          <button type="button" onClick={handleResendOtp} disabled={countdown > 0 || loading}
                            style={{ background: 'none', border: 'none', padding: 0, fontSize: 'var(--text-sm)', color: countdown > 0 ? 'var(--color-text-muted)' : 'var(--color-blue-600)', fontWeight: 'var(--font-medium)', cursor: countdown > 0 ? 'default' : 'pointer' }}>
                            {countdown > 0 ? t('auth:otp_resend_in', { seconds: countdown }) : t('auth:otp_resend')}
                          </button>
                          <button type="button" onClick={() => { setOtpStep('phone'); setOtpDigits(''); setError('') }}
                            style={{ background: 'none', border: 'none', padding: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                            ← {t('auth:otp_back')}
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .login-left-panel { display: none !important; }
          .login-mobile-logo { display: block !important; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
