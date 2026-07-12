import { createContext, useContext, useState, useCallback } from 'react'

const AuthModalContext = createContext(null)

export function AuthModalProvider({ children }) {
  const [authOpen, setAuthOpen] = useState(false)
  const [authView, setAuthView] = useState('login')

  const openLogin    = useCallback(() => { setAuthView('login');    setAuthOpen(true) }, [])
  const openRegister = useCallback(() => { setAuthView('register'); setAuthOpen(true) }, [])
  const closeAuth     = useCallback(() => setAuthOpen(false), [])

  return (
    <AuthModalContext.Provider value={{ authOpen, authView, openLogin, openRegister, closeAuth }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export const useAuthModal = () => {
  const context = useContext(AuthModalContext)
  if (!context) throw new Error('useAuthModal must be used within AuthModalProvider')
  return context
}
