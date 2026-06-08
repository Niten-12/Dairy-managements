import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { login as loginApi, REMEMBER_ME_KEY, TOKEN_EXPIRY_KEY } from '../api/authApi'

const AuthContext = createContext(null)

function isTokenExpired() {
  const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!expiry) return false
  return Date.now() > parseInt(expiry, 10)
}

function loadUser() {
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')
  if (!token || !userData) return null
  if (isTokenExpired()) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    localStorage.removeItem(REMEMBER_ME_KEY)
    return null
  }
  return JSON.parse(userData)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  useEffect(() => {
    if (!user) return
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiry) return
    const remaining = parseInt(expiry, 10) - Date.now()
    if (remaining <= 0) { logout(); return }
    const timer = setTimeout(() => logout(), remaining)
    return () => clearTimeout(timer)
  }, [user])

  const login = useCallback(async (credentials) => {
    const { data } = await loginApi(credentials)
    const expiresAt = Date.now() + data.expiresIn
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify({ email: data.email, name: data.name, role: data.role }))
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt))
    localStorage.setItem(REMEMBER_ME_KEY, String(data.rememberMe || false))
    setUser({ email: data.email, name: data.name, role: data.role })
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    localStorage.removeItem(REMEMBER_ME_KEY)
    setUser(null)
  }, [])

  const updateUser = useCallback((updatedData, newToken) => {
    const merged = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...updatedData }
    localStorage.setItem('user', JSON.stringify(merged))
    if (newToken) localStorage.setItem('token', newToken)
    setUser(merged)
  }, [])

  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true'

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, rememberMe, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
