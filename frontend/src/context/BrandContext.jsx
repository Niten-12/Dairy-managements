import { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'dairypro_brand_name'
const DEFAULT_BRAND = 'DairyPro'

const BrandContext = createContext(null)

export function BrandProvider({ children }) {
  const [brandName, setBrandNameState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT_BRAND
  )

  useEffect(() => {
    document.title = `${brandName} — Dairy Management System`
  }, [brandName])

  const setBrandName = (name) => {
    const trimmed = (name || '').trim() || DEFAULT_BRAND
    localStorage.setItem(STORAGE_KEY, trimmed)
    setBrandNameState(trimmed)
  }

  const resetBrandName = () => {
    localStorage.removeItem(STORAGE_KEY)
    setBrandNameState(DEFAULT_BRAND)
  }

  return (
    <BrandContext.Provider value={{ brandName, setBrandName, resetBrandName, DEFAULT_BRAND }}>
      {children}
    </BrandContext.Provider>
  )
}

export function useBrand() {
  const ctx = useContext(BrandContext)
  if (!ctx) throw new Error('useBrand must be used within BrandProvider')
  return ctx
}
