import { useEffect, useMemo, useState } from 'react'
import { getUsers } from '../../api/adminApi'
import { adminCreateOrder } from '../../api/adminOrderApi'
import { adminGetAllProducts } from '../../api/adminProductApi'
import { adminGetCategories as getCategories } from '../../api/adminCategoryApi'
import './AdminCreateOrderModal.css'

const PAYMENT_OPTIONS = [
  { value: 'COD',  icon: '💵', label: 'Cash' },
  { value: 'UPI',  icon: '📱', label: 'UPI'  },
  { value: 'CARD', icon: '💳', label: 'Card' },
]

const EMPTY_FORM = {
  customerId:      '',
  deliveryName:    '',
  deliveryPhone:   '',
  deliveryAddress: '',
  deliveryCity:    '',
  deliveryPincode: '',
  notes:           '',
  paymentMethod:   'COD',
}

function stockLabel(stock) {
  if (stock == null)   return null
  if (stock === 0)     return { text: 'Out of stock',         cls: 'oom-stock-out'      }
  if (stock < 3)       return { text: `Only ${stock} left!`,  cls: 'oom-stock-critical' }
  if (stock < 10)      return { text: `${stock} left`,        cls: 'oom-stock-low'      }
  return               { text: `${stock} available`,          cls: 'oom-stock-ok'       }
}

export default function AdminCreateOrderModal({ onClose, onCreated }) {
  const [customers,   setCustomers]   = useState([])
  const [categories,  setCategories]  = useState([])
  const [products,    setProducts]    = useState([])
  const [form,        setForm]        = useState(EMPTY_FORM)
  const [quantities,  setQuantities]  = useState({})
  const [categoryId,  setCategoryId]  = useState('ALL')
  const [search,      setSearch]      = useState('')
  const [custSearch,  setCustSearch]  = useState('')
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)

    Promise.all([
      getUsers({ role: 'CUSTOMER', active: true, page: 0, size: 200 }),
      getCategories(),
      adminGetAllProducts(),
    ])
      .then(([ur, cr, pr]) => {
        setCustomers(ur.data?.content || [])
        setCategories(cr.data || [])
        setProducts((pr.data || []).filter(p => p.available))
      })
      .catch(() => setError('Customers and products could not be loaded.'))
      .finally(() => setLoading(false))

    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  /* ── Filtered customers by search ────────────── */
  const filteredCustomers = useMemo(() => {
    const q = custSearch.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  }, [customers, custSearch])

  /* ── Filtered products ───────────────────────── */
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter(p => {
      const catMatch = categoryId === 'ALL' || String(p.categoryId) === categoryId
      const txtMatch = !q || p.name.toLowerCase().includes(q)
      return catMatch && txtMatch
    })
  }, [products, categoryId, search])

  /* ── Cart derived state ──────────────────────── */
  const selectedItems = useMemo(() =>
    products
      .filter(p => (quantities[p.id] || 0) > 0)
      .map(p => ({ ...p, quantity: quantities[p.id] })),
    [products, quantities]
  )

  const total = selectedItems.reduce((s, i) => s + Number(i.price) * i.quantity, 0)

  /* ── Handlers ────────────────────────────────── */
  const selectCustomer = (id) => {
    const c = customers.find(x => String(x.id) === id)
    setForm(f => ({
      ...f,
      customerId:    id,
      deliveryName:  c?.name  || '',
      deliveryPhone: c?.phone || '',
    }))
  }

  const updateField = e => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const changeQty = (product, delta) => {
    setQuantities(q => {
      const cur = q[product.id] || 0
      const max = product.stock ?? 999
      const next = Math.max(0, Math.min(max, cur + delta))
      if (next === 0) { const c = { ...q }; delete c[product.id]; return c }
      return { ...q, [product.id]: next }
    })
  }

  const removeItem = (productId) =>
    setQuantities(q => { const c = { ...q }; delete c[productId]; return c })

  const clearAll = () => setQuantities({})

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (!form.customerId)                                                          return setError('Select a customer.')
    if (!form.deliveryName.trim() || !form.deliveryPhone.trim() || !form.deliveryAddress.trim())
                                                                                   return setError('Name, phone, and delivery address are required.')
    if (selectedItems.length === 0)                                                return setError('Add at least one product.')

    setSaving(true)
    try {
      const { data } = await adminCreateOrder({
        ...form,
        customerId: Number(form.customerId),
        items: selectedItems.map(i => ({ productId: i.id, quantity: i.quantity })),
      })
      onCreated(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Order could not be created.')
    } finally { setSaving(false) }
  }

  return (
    <div className="oom-layer" role="dialog" aria-modal="true" aria-label="Create new order">
      <button className="oom-backdrop" onClick={saving ? undefined : onClose} aria-label="Close" />
      <form className="oom-modal" onSubmit={submit}>

        {/* Header */}
        <header className="oom-header">
          <div>
            <div className="oom-kicker">ORDER MANAGEMENT</div>
            <h2>Create New Order</h2>
            <p>Prices and stock are verified live from the database.</p>
          </div>
          <button type="button" className="oom-close" onClick={onClose} disabled={saving}>×</button>
        </header>

        {loading ? (
          <div className="oom-loading">Loading catalogue...</div>
        ) : (
          <div className="oom-body">

            {/* ── Left panel ────────────────────────────── */}
            <main className="oom-main">

              {/* Section 1 — Customer */}
              <section className="oom-section">
                <div className="oom-section-title"><span>1</span> Customer &amp; delivery</div>
                <div className="oom-grid">

                  {/* Searchable customer list */}
                  <label className="oom-field oom-field-wide">
                    <span>Customer *</span>
                    <input
                      className="oom-input"
                      value={custSearch}
                      onChange={e => setCustSearch(e.target.value)}
                      placeholder="Search by name, phone or email..."
                    />
                    <div className="oom-cust-list">
                      {filteredCustomers.length === 0 ? (
                        <div className="oom-cust-empty">No customers match "{custSearch}"</div>
                      ) : filteredCustomers.map(c => (
                        <div
                          key={c.id}
                          className={`oom-cust-row${form.customerId === String(c.id) ? ' selected' : ''}`}
                          onClick={() => selectCustomer(String(c.id))}
                        >
                          <strong>{c.name}</strong>
                          <small>{[c.phone, c.email].filter(Boolean).join(' · ')}</small>
                        </div>
                      ))}
                    </div>
                  </label>

                  <OField label="Name *"  name="deliveryName"  value={form.deliveryName}  onChange={updateField} />
                  <OField label="Phone *" name="deliveryPhone" value={form.deliveryPhone} onChange={updateField} />

                  <label className="oom-field oom-field-wide">
                    <span>Delivery address *</span>
                    <textarea name="deliveryAddress" value={form.deliveryAddress} onChange={updateField} rows="2" placeholder="House, street and area" className="oom-input" />
                  </label>

                  <OField label="City"    name="deliveryCity"    value={form.deliveryCity}    onChange={updateField} />
                  <OField label="Pincode" name="deliveryPincode" value={form.deliveryPincode} onChange={updateField} />
                </div>
              </section>

              {/* Section 2 — Products */}
              <section className="oom-section oom-products-section">
                <div className="oom-products-header">
                  <div className="oom-section-title">
                    <span>2</span> Choose products
                    {selectedItems.length > 0 && (
                      <span className="oom-selected-badge">{selectedItems.length} selected</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {selectedItems.length > 0 && (
                      <button type="button" className="oom-clear-btn" onClick={clearAll}>
                        Clear all
                      </button>
                    )}
                    <input className="oom-search oom-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." />
                  </div>
                </div>

                <div className="oom-cats">
                  <button type="button" className={categoryId === 'ALL' ? 'active' : ''} onClick={() => setCategoryId('ALL')}>All</button>
                  {categories.map(c => (
                    <button type="button" key={c.id} className={categoryId === String(c.id) ? 'active' : ''} onClick={() => setCategoryId(String(c.id))}>
                      {c.emoji} {c.name}
                    </button>
                  ))}
                </div>

                <div className="oom-products">
                  {filteredProducts.length === 0 ? (
                    <div className="oom-products-empty">No available products found.</div>
                  ) : filteredProducts.map(p => {
                    const qty  = quantities[p.id] || 0
                    const sl   = stockLabel(p.stock)
                    const sold = p.stock === 0
                    return (
                      <article key={p.id} className={`oom-product${qty ? ' selected' : ''}${sold ? ' out' : ''}`}>
                        <div className="oom-product-emoji">{p.emoji || '🥛'}</div>
                        <div className="oom-product-info">
                          <strong>{p.name}</strong>
                          <small>{p.categoryName || 'Dairy'} · {p.unit}</small>
                          <b>₹{Number(p.price).toFixed(2)}</b>
                          {sl && <span className={sl.cls}>{sl.text}</span>}
                        </div>
                        {qty === 0 ? (
                          <button type="button" className="oom-add" onClick={() => changeQty(p, 1)} disabled={sold}>
                            {sold ? 'Out' : 'Add'}
                          </button>
                        ) : (
                          <div className="oom-stepper">
                            <button type="button" onClick={() => changeQty(p, -1)}>−</button>
                            <span>{qty}</span>
                            <button type="button" onClick={() => changeQty(p, 1)} disabled={p.stock != null && qty >= p.stock}>+</button>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              </section>
            </main>

            {/* ── Right panel — Summary ─────────────────── */}
            <aside className="oom-summary">
              <div className="oom-section-title"><span>3</span> Order summary</div>

              <div className="oom-summary-items">
                {selectedItems.length === 0 ? (
                  <div className="oom-summary-empty">Products you add will appear here.</div>
                ) : selectedItems.map(item => (
                  <div className="oom-summary-row" key={item.id}>
                    <span className="oom-summary-emoji">{item.emoji}</span>
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.quantity} × ₹{Number(item.price).toFixed(2)}</small>
                    </div>
                    <div className="oom-summary-right">
                      <b>₹{(Number(item.price) * item.quantity).toFixed(2)}</b>
                      <button type="button" className="oom-remove-btn" onClick={() => removeItem(item.id)} title="Remove">✕</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="oom-total"><span>Total</span><strong>₹{total.toFixed(2)}</strong></div>

              {/* Payment method */}
              <div className="oom-field" style={{ marginBottom: 14 }}>
                <span className="oom-field-label">Payment method</span>
                <div className="oom-payment">
                  {PAYMENT_OPTIONS.map(({ value, icon, label }) => (
                    <button
                      type="button"
                      key={value}
                      className={`oom-pay-opt${form.paymentMethod === value ? ' active' : ''}`}
                      onClick={() => setForm(f => ({ ...f, paymentMethod: value }))}
                    >
                      <span>{icon}</span> {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="oom-field">
                <span className="oom-field-label">Order notes</span>
                <textarea name="notes" value={form.notes} onChange={updateField} rows="3" placeholder="Call before delivery, leave at door..." className="oom-input" />
              </label>

              {error && <div className="oom-error">{error}</div>}

              <button type="submit" className="oom-submit" disabled={saving || loading}>
                {saving ? 'Creating order...' : `Create order · ${form.paymentMethod}`}
              </button>
              <p className="oom-note">Prices verified from database on submit.</p>
            </aside>

          </div>
        )}
      </form>
    </div>
  )
}

function OField({ label, name, value, onChange }) {
  return (
    <label className="oom-field">
      <span>{label}</span>
      <input name={name} value={value} onChange={onChange} className="oom-input" />
    </label>
  )
}
