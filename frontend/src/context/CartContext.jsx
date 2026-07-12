import { createContext, useContext, useEffect, useReducer, useState } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'dairyfresh_cart'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { items: [] }
  } catch {
    return { items: [] }
  }
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((i) => i.id === action.item.id)
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i
          ),
        }
      }
      return { ...state, items: [...state.items, { ...action.item, qty: 1 }] }
    }
    case 'REMOVE':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) }
    case 'SET_QTY':
      return {
        ...state,
        items: state.items
          .map((i) => (i.id === action.id ? { ...i, qty: action.qty } : i))
          .filter((i) => i.qty > 0),
      }
    case 'CLEAR':
      return { ...state, items: [] }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, loadFromStorage())
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const addItem = (product) => {
    dispatch({
      type: 'ADD',
      item: {
        id:       product.id,
        name:     product.name,
        price:    parseFloat(product.price),
        unit:     product.unit,
        emoji:    product.emoji,
        bgGradient: product.bgGradient,
      },
    })
    setDrawerOpen(true)
  }

  const removeItem   = (id)       => dispatch({ type: 'REMOVE', id })
  const setQty       = (id, qty)  => dispatch({ type: 'SET_QTY', id, qty })
  const clearCart    = ()         => dispatch({ type: 'CLEAR' })
  const openDrawer   = ()         => setDrawerOpen(true)
  const closeDrawer  = ()         => setDrawerOpen(false)

  const totalItems = state.items.reduce((s, i) => s + i.qty, 0)
  const totalPrice = state.items.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <CartContext.Provider value={{
      items: state.items,
      totalItems,
      totalPrice,
      drawerOpen,
      addItem,
      removeItem,
      setQty,
      clearCart,
      openDrawer,
      closeDrawer,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
