import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { BrandProvider } from './context/BrandContext'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <BrandProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrandProvider>
    </BrowserRouter>
  )
}

export default App
