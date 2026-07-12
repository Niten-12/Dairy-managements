import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BrandProvider } from './context/BrandContext'
import { CartProvider } from './context/CartContext'
import { AuthModalProvider, useAuthModal } from './context/AuthModalContext'
import CartDrawer from './components/public/CartDrawer'
import AuthModal from './components/public/AuthModal'
import AppRoutes from './routes/AppRoutes'

function GlobalAuthModal() {
  const { authOpen, authView, closeAuth } = useAuthModal()
  return <AuthModal isOpen={authOpen} onClose={closeAuth} initialView={authView} />
}

function App() {
  return (
    <BrowserRouter>
      <BrandProvider>
        <AuthProvider>
          <CartProvider>
            <AuthModalProvider>
              <AppRoutes />
              <CartDrawer />
              <GlobalAuthModal />
            </AuthModalProvider>
          </CartProvider>
        </AuthProvider>
      </BrandProvider>
    </BrowserRouter>
  )
}

export default App
