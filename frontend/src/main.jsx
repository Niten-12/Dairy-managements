import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n/index.js'
import './styles/global.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif', color: '#64748b', fontSize: '14px',
        background: '#f1f5f9',
      }}>
        {`Loading ${localStorage.getItem('dairypro_brand_name') || 'DairyPro'}...`}
      </div>
    }>
      <App />
    </Suspense>
  </StrictMode>
)
