import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'react-qr-code'
import { useBrand } from '../../context/BrandContext'
import { useAuth } from '../../context/AuthContext'
import { getProfile, updateProfile, updatePassword } from '../../api/profileApi'
import { get2faStatus, setup2fa, enable2fa, disable2fa } from '../../api/twoFactorApi'

const ACCENT = '#7c3aed'

/* ── Small reusable pieces ─────────────────────────────────── */

function Label({ children }) {
  return (
    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', marginBottom: '6px' }}>
      {children}
    </div>
  )
}

function TextInput({ type = 'text', value, onChange, placeholder, maxLength, suffix }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: suffix ? '10px 42px 10px 12px' : '10px 12px',
          border: `1.5px solid ${focused ? ACCENT : 'var(--color-border)'}`,
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text)',
          background: 'var(--color-bg)',
          outline: 'none',
          transition: 'border-color 150ms, box-shadow 150ms',
          boxShadow: focused ? `0 0 0 3px rgba(124,58,237,0.11)` : 'none',
        }}
      />
      {suffix && (
        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
          {suffix}
        </div>
      )}
    </div>
  )
}

function Alert({ type, msg }) {
  if (!msg) return null
  const ok = type === 'success'
  return (
    <div style={{
      padding: '9px 13px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
      display: 'flex', alignItems: 'center', gap: '8px',
      background: ok ? 'var(--color-emerald-50)' : 'var(--color-red-50)',
      color: ok ? 'var(--color-emerald-700)' : 'var(--color-red-700)',
      border: `1px solid ${ok ? 'var(--color-emerald-200)' : 'var(--color-red-200)'}`,
      marginBottom: 'var(--space-4)',
    }}>
      <span>{ok ? '✓' : '⚠️'}</span> {msg}
    </div>
  )
}

function PrimaryBtn({ onClick, disabled, loading, saved, label, savedLabel }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: '9px 22px', borderRadius: 'var(--radius-md)',
        fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)',
        border: 'none',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        background: saved ? 'var(--color-emerald-600)' : disabled ? 'var(--color-slate-200)' : `linear-gradient(135deg, ${ACCENT}, #6d28d9)`,
        color: !disabled || saved ? '#fff' : 'var(--color-text-muted)',
        opacity: loading ? 0.7 : 1,
        transition: 'all 150ms',
        boxShadow: !disabled && !saved ? '0 3px 10px rgba(124,58,237,0.25)' : 'none',
      }}
    >
      {loading ? '...' : saved ? `✓ ${savedLabel}` : label}
    </button>
  )
}

function getStrength(p) {
  if (!p) return 0
  let s = 0
  if (p.length >= 6) s++
  if (p.length >= 10) s++
  if (/[A-Z]/.test(p)) s++
  if (/[0-9]/.test(p)) s++
  if (/[^A-Za-z0-9]/.test(p)) s++
  return s
}

function StrengthBar({ password }) {
  const s = getStrength(password)
  const color = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'][s]
  const label = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][s]
  if (!password) return null
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '3px', marginBottom: '3px' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= s ? color : 'var(--color-border)', transition: 'background 200ms' }} />
        ))}
      </div>
      <div style={{ fontSize: '11px', color, fontWeight: 'var(--font-medium)' }}>{label}</div>
    </div>
  )
}

function SectionDivider({ label }) {
  return (
    <div style={{
      fontSize: '11px', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.7px',
      paddingBottom: 'var(--space-3)',
      borderBottom: '1px solid var(--color-border)',
      marginBottom: 'var(--space-4)',
    }}>
      {label}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
/*  SECTIONS                                                 */
/* ══════════════════════════════════════════════════════════ */

function AccountSection({ t, user, updateUser }) {
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getProfile().then(({ data }) => setForm({ name: data.name || '', email: data.email || '', phone: data.phone || '' })).catch(() => {})
  }, [])

  const change = (k) => (e) => { setForm(p => ({ ...p, [k]: e.target.value })); setSaved(false); setError('') }

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError(t('common:profile_required')); return }
    setLoading(true); setError('')
    try {
      const { data } = await updateProfile({ name: form.name.trim(), email: form.email.trim().toLowerCase(), phone: form.phone.trim() || null })
      updateUser({ name: data.name, email: data.email }, data.token)
      setForm({ name: data.name, email: data.email, phone: data.phone || '' })
      setSaved(true); setTimeout(() => setSaved(false), 2200)
    } catch (err) {
      setError(err.response?.data?.message || t('common:save_failed'))
    } finally { setLoading(false) }
  }

  return (
    <div>
      <SectionDivider label={t('common:account_settings')} />
      <Alert type="error" msg={error} />
      {saved && <Alert type="success" msg={t('common:profile_updated')} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div>
          <Label>{t('common:full_name')}</Label>
          <TextInput value={form.name} onChange={change('name')} placeholder="Admin User" maxLength={60} />
        </div>
        <div>
          <Label>{t('common:email_address')}</Label>
          <TextInput type="email" value={form.email} onChange={change('email')} placeholder="admin@dairy.com" />
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-5)' }}>
        <Label>{t('common:mobile_number')}</Label>
        <div style={{ maxWidth: '320px' }}>
          <TextInput type="tel" value={form.phone} onChange={change('phone')} placeholder="+91 98765 43210" maxLength={20} />
        </div>
      </div>

      <PrimaryBtn
        onClick={handleSave} loading={loading} saved={saved}
        disabled={!form.name.trim() || !form.email.trim()}
        label={t('common:save_changes')} savedLabel={t('common:saved')}
      />
    </div>
  )
}

function SecuritySection({ t }) {
  const [pwd, setPwd] = useState({ current: '', new: '', confirm: '' })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const toggleShow = (k) => setShow(p => ({ ...p, [k]: !p[k] }))
  const change = (k) => (e) => { setPwd(p => ({ ...p, [k]: e.target.value })); setSaved(false); setError('') }

  const pwdValid = pwd.current && pwd.new.length >= 6 && pwd.new === pwd.confirm

  const handleSave = async () => {
    if (pwd.new !== pwd.confirm) { setError(t('common:password_mismatch')); return }
    if (pwd.new.length < 6) { setError(t('common:password_min')); return }
    setLoading(true); setError('')
    try {
      await updatePassword({ currentPassword: pwd.current, newPassword: pwd.new })
      setPwd({ current: '', new: '', confirm: '' })
      setSaved(true); setTimeout(() => setSaved(false), 2200)
    } catch (err) {
      setError(err.response?.data?.message || t('common:save_failed'))
    } finally { setLoading(false) }
  }

  const EyeBtn = ({ k }) => (
    <button type="button" onClick={() => toggleShow(k)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '15px', lineHeight: 1, padding: 0 }}>
      {show[k] ? '🙈' : '👁️'}
    </button>
  )

  return (
    <div>
      <SectionDivider label={t('common:security_settings')} />
      <Alert type="error" msg={error} />
      {saved && <Alert type="success" msg={t('common:password_changed')} />}

      <div style={{ maxWidth: '360px', marginBottom: 'var(--space-4)' }}>
        <Label>{t('common:current_password')}</Label>
        <TextInput type={show.current ? 'text' : 'password'} value={pwd.current} onChange={change('current')} placeholder="••••••••" suffix={<EyeBtn k="current" />} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', maxWidth: '640px', marginBottom: 'var(--space-5)' }}>
        <div>
          <Label>{t('common:new_password')}</Label>
          <TextInput type={show.new ? 'text' : 'password'} value={pwd.new} onChange={change('new')} placeholder="Min. 6 characters" suffix={<EyeBtn k="new" />} />
          <StrengthBar password={pwd.new} />
        </div>
        <div>
          <Label>{t('common:confirm_password')}</Label>
          <TextInput type={show.confirm ? 'text' : 'password'} value={pwd.confirm} onChange={change('confirm')} placeholder="Repeat new password" suffix={<EyeBtn k="confirm" />} />
          {pwd.confirm && (
            <div style={{ marginTop: '6px', fontSize: '11px', fontWeight: 'var(--font-medium)', color: pwd.new === pwd.confirm ? 'var(--color-emerald-600)' : 'var(--color-red-600)' }}>
              {pwd.new === pwd.confirm ? `✓ ${t('common:passwords_match')}` : t('common:password_mismatch')}
            </div>
          )}
        </div>
      </div>

      <PrimaryBtn
        onClick={handleSave} loading={loading} saved={saved}
        disabled={!pwdValid}
        label={t('common:change_password')} savedLabel={t('common:saved')}
      />
    </div>
  )
}

function BrandSection({ t, brandName, setBrandName, resetBrandName, DEFAULT_BRAND }) {
  const [input, setInput] = useState(brandName)
  const [saved, setSaved] = useState(false)

  const changed = input.trim() !== brandName
  const preview = input.trim() || DEFAULT_BRAND

  const handleSave = () => {
    const v = input.trim() || DEFAULT_BRAND
    setBrandName(v); setInput(v)
    setSaved(true); setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div>
      <SectionDivider label={t('common:brand_settings')} />

      <div style={{ maxWidth: '480px', marginBottom: 'var(--space-5)' }}>
        <Label>{t('common:brand_name_label')}</Label>
        <TextInput value={input} onChange={(e) => { setInput(e.target.value); setSaved(false) }} placeholder={DEFAULT_BRAND} maxLength={40} />
        <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--color-text-muted)' }}>{input.length}/40</div>
      </div>

      {/* Compact preview */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '12px',
        background: '#0d0d1a', padding: '10px 16px', borderRadius: 'var(--radius-lg)',
        marginBottom: 'var(--space-5)',
      }}>
        <span style={{ fontSize: '18px' }}>🥛</span>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: '#fff' }}>{preview}</div>
        <div style={{ fontSize: '10px', padding: '2px 7px', borderRadius: 'var(--radius-full)', background: ACCENT, color: '#fff', fontWeight: 'var(--font-bold)' }}>
          {t('nav:admin_panel_badge')}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
        <PrimaryBtn
          onClick={handleSave} saved={saved}
          disabled={!changed && !saved}
          label={t('common:save_changes')} savedLabel={t('common:saved')}
        />
        <button
          onClick={() => { resetBrandName(); setInput(DEFAULT_BRAND); setSaved(false) }}
          disabled={brandName === DEFAULT_BRAND && input === DEFAULT_BRAND}
          style={{
            padding: '9px 16px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)', border: '1px solid var(--color-border)',
            background: 'transparent', color: 'var(--color-text)',
            cursor: brandName === DEFAULT_BRAND && input === DEFAULT_BRAND ? 'not-allowed' : 'pointer',
            opacity: brandName === DEFAULT_BRAND && input === DEFAULT_BRAND ? 0.4 : 1,
            transition: 'background 150ms',
          }}
          onMouseEnter={e => { if (!(brandName === DEFAULT_BRAND && input === DEFAULT_BRAND)) e.currentTarget.style.background = 'var(--color-slate-100)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          {t('common:reset')}
        </button>
      </div>
    </div>
  )
}

/* ── Mini OTP input for 2FA setup/disable ─────────────────── */
function MiniOtpInput({ value, onChange }) {
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
    <div style={{ display: 'flex', gap: '8px', margin: '16px 0' }}>
      {[0,1,2,3,4,5].map(i => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ''} onChange={() => {}}
          onKeyDown={e => handleKey(i, e)} onPaste={handlePaste}
          style={{
            width: '44px', height: '48px', textAlign: 'center',
            fontSize: '1.25rem', fontWeight: 'var(--font-bold)',
            border: `2px solid ${digits[i] ? ACCENT : 'var(--color-border)'}`,
            borderRadius: 'var(--radius-md)', outline: 'none',
            color: 'var(--color-text)', background: digits[i] ? 'rgba(124,58,237,0.06)' : '#fff',
            transition: 'all 150ms', caretColor: 'transparent',
          }}
          onFocus={e => { e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)' }}
          onBlur={e => { e.target.style.boxShadow = 'none' }}
        />
      ))}
    </div>
  )
}

function TwoFactorSection({ t }) {
  const [status,    setStatus]    = useState(null)   // { twoFactorEnabled: bool }
  const [phase,     setPhase]     = useState('idle') // 'idle' | 'setup' | 'disabling'
  const [setupData, setSetupData] = useState(null)   // { secret, otpauthUrl }
  const [code,      setCode]      = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState('')

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

  useEffect(() => {
    get2faStatus().then(({ data }) => setStatus(data)).catch(() => {})
  }, [])

  const handleSetup = async () => {
    setLoading(true); setError('')
    try {
      const { data } = await setup2fa()
      setSetupData(data); setPhase('setup'); setCode('')
    } catch (err) {
      setError(err.response?.data?.message || t('common:save_failed'))
    } finally { setLoading(false) }
  }

  const handleEnable = async () => {
    if (code.length < 6) return
    setLoading(true); setError('')
    try {
      await enable2fa(code)
      setStatus({ twoFactorEnabled: true }); setPhase('idle'); setSetupData(null); setCode('')
      flash(t('common:two_factor_enabled'))
    } catch (err) {
      setError(err.response?.data?.message || t('auth:invalid_code'))
      setCode('')
    } finally { setLoading(false) }
  }

  const handleDisable = async () => {
    if (code.length < 6) return
    setLoading(true); setError('')
    try {
      await disable2fa(code)
      setStatus({ twoFactorEnabled: false }); setPhase('idle'); setCode('')
      flash(t('common:two_factor_disabled'))
    } catch (err) {
      setError(err.response?.data?.message || t('auth:invalid_code'))
      setCode('')
    } finally { setLoading(false) }
  }

  if (!status) {
    return <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Loading...</div>
  }

  return (
    <div>
      <SectionDivider label={t('common:two_factor_settings')} />
      <Alert type="error" msg={error} />
      {success && <Alert type="success" msg={success} />}

      {/* Current status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-5)' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '5px 12px', borderRadius: 'var(--radius-full)',
          fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)',
          background: status.twoFactorEnabled ? 'var(--color-emerald-50)' : 'var(--color-slate-100)',
          color: status.twoFactorEnabled ? 'var(--color-emerald-700)' : 'var(--color-text-muted)',
          border: `1px solid ${status.twoFactorEnabled ? 'var(--color-emerald-200)' : 'var(--color-border)'}`,
        }}>
          {status.twoFactorEnabled ? '🛡️' : '🔓'}
          {status.twoFactorEnabled ? t('common:two_factor_active') : t('common:two_factor_inactive')}
        </div>
      </div>

      {/* ── DISABLED state — offer to enable ── */}
      {!status.twoFactorEnabled && phase === 'idle' && (
        <div>
          <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: '480px' }}>
            {t('common:two_factor_desc')}
          </p>
          <PrimaryBtn
            onClick={handleSetup} loading={loading}
            label={t('common:two_factor_setup_btn')} savedLabel=""
          />
        </div>
      )}

      {/* ── SETUP phase — show QR + enter code to confirm ── */}
      {phase === 'setup' && setupData && (
        <div style={{ maxWidth: '420px' }}>
          <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {t('common:two_factor_scan_instructions')}
          </p>

          {/* QR Code */}
          <div style={{
            display: 'inline-block', padding: '16px',
            background: '#fff', borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            marginBottom: 'var(--space-4)',
          }}>
            <QRCode value={setupData.otpauthUrl} size={160} />
          </div>

          {/* Manual entry key */}
          <div style={{
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px',
            marginBottom: 'var(--space-4)',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              {t('common:two_factor_manual_key')}
            </div>
            <div style={{
              fontFamily: 'monospace', fontSize: 'var(--text-sm)', color: 'var(--color-text)',
              letterSpacing: '2px', wordBreak: 'break-all',
            }}>
              {setupData.secret}
            </div>
          </div>

          {/* Confirm OTP */}
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)', marginBottom: '4px' }}>
            {t('common:two_factor_enter_code')}
          </div>
          <MiniOtpInput value={code} onChange={(v) => { setCode(v); setError('') }} />

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <PrimaryBtn
              onClick={handleEnable} loading={loading}
              disabled={code.length < 6}
              label={t('common:two_factor_enable_btn')} savedLabel={t('common:saved')}
            />
            <button
              onClick={() => { setPhase('idle'); setSetupData(null); setCode(''); setError('') }}
              style={{ padding: '9px 16px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer' }}
            >
              {t('common:cancel')}
            </button>
          </div>
        </div>
      )}

      {/* ── ENABLED state — offer to disable ── */}
      {status.twoFactorEnabled && phase === 'idle' && (
        <div style={{ maxWidth: '420px' }}>
          <p style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {t('common:two_factor_enabled_desc')}
          </p>
          <button
            onClick={() => { setPhase('disabling'); setCode(''); setError('') }}
            style={{
              padding: '9px 22px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-semibold)', border: '1.5px solid var(--color-red-300)',
              background: 'var(--color-red-50)', color: 'var(--color-red-700)', cursor: 'pointer',
              transition: 'background 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-red-100)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-red-50)' }}
          >
            🔓 {t('common:two_factor_disable_btn')}
          </button>
        </div>
      )}

      {/* ── DISABLING phase — verify current OTP then disable ── */}
      {status.twoFactorEnabled && phase === 'disabling' && (
        <div style={{ maxWidth: '360px' }}>
          <p style={{ margin: '0 0 var(--space-3)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            {t('common:two_factor_disable_confirm')}
          </p>
          <MiniOtpInput value={code} onChange={(v) => { setCode(v); setError('') }} />
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <button
              onClick={handleDisable}
              disabled={loading || code.length < 6}
              style={{
                padding: '9px 22px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-semibold)', border: 'none',
                background: code.length < 6 ? 'var(--color-slate-200)' : '#dc2626',
                color: code.length < 6 ? 'var(--color-text-muted)' : '#fff',
                cursor: code.length < 6 ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'all 150ms',
              }}
            >
              {loading ? '...' : t('common:two_factor_disable_btn')}
            </button>
            <button
              onClick={() => { setPhase('idle'); setCode(''); setError('') }}
              style={{ padding: '9px 16px', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text)', cursor: 'pointer' }}
            >
              {t('common:cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════ */
/*  MAIN — sidebar nav + content panel                       */
/* ══════════════════════════════════════════════════════════ */

const NAV = [
  { key: 'account',   icon: '👤' },
  { key: 'security',  icon: '🔒' },
  { key: 'twofactor', icon: '🛡️' },
  { key: 'brand',     icon: '🏷️' },
]

function AdminSettings() {
  const { t } = useTranslation(['common', 'nav'])
  const { brandName, setBrandName, resetBrandName, DEFAULT_BRAND } = useBrand()
  const { user, updateUser } = useAuth()
  const [active, setActive] = useState('account')

  const navLabels = {
    account:   t('common:account_settings'),
    security:  t('common:security_settings'),
    twofactor: t('common:two_factor_settings'),
    brand:     t('common:brand_settings'),
  }

  return (
    <div style={{ maxWidth: '860px' }}>

      {/* Page header */}
      <div className="anim-fade-in-up" style={{ marginBottom: 'var(--space-6)', animationFillMode: 'both' }}>
        <h1 style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
          {t('nav:settings')}
        </h1>
        <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
          {t('nav:settings_subtitle')}
        </p>
      </div>

      {/* Layout: sidebar + content */}
      <div
        className="anim-fade-in-up"
        style={{
          display: 'flex', gap: 0,
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
          animationFillMode: 'both',
          animationDelay: '60ms',
          minHeight: '420px',
        }}
      >
        {/* Left nav */}
        <div style={{
          width: '200px', flexShrink: 0,
          borderRight: '1px solid var(--color-border)',
          padding: 'var(--space-3) 0',
          background: 'var(--color-bg)',
        }}>
          {NAV.map(({ key, icon }) => {
            const isActive = active === key
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 20px', border: 'none', background: 'none',
                  textAlign: 'left', cursor: 'pointer',
                  fontSize: 'var(--text-sm)', fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-normal)',
                  color: isActive ? ACCENT : 'var(--color-text-muted)',
                  borderRight: isActive ? `2px solid ${ACCENT}` : '2px solid transparent',
                  transition: 'color 150ms, background 150ms',
                  background: isActive ? 'rgba(124,58,237,0.06)' : 'transparent',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--color-slate-50)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: '15px' }}>{icon}</span>
                {navLabels[key]}
              </button>
            )
          })}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, padding: 'var(--space-7)', minWidth: 0 }}>
          {active === 'account'   && <AccountSection t={t} user={user} updateUser={updateUser} />}
          {active === 'security'  && <SecuritySection t={t} />}
          {active === 'twofactor' && <TwoFactorSection t={t} />}
          {active === 'brand' && (
            <BrandSection
              t={t}
              brandName={brandName}
              setBrandName={setBrandName}
              resetBrandName={resetBrandName}
              DEFAULT_BRAND={DEFAULT_BRAND}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminSettings
