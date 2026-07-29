import { useState, useEffect, useCallback, useRef } from 'react'
import {
  adminGetAllProducts,
  adminCreateProduct, adminUpdateProduct,
  adminDeleteProduct, adminToggleProduct,
  adminUploadProductImage,
  adminBulkDeleteProducts, adminBulkSetAvailable,
} from '../../api/adminProductApi'
import {
  adminGetCategories, adminCreateCategory,
  adminUpdateCategory, adminDeleteCategory,
  adminUploadCategoryImage,
} from '../../api/adminCategoryApi'
import { classifyError } from '../../utils/apiError'
import { formatPrice } from '../../utils/productDisplay'

/* ── helpers ─────────────────────────────────────────── */
const TAG_TYPES = ['success', 'warning', 'error', 'info']

const EMPTY_PROD = {
  name: '', description: '', price: '', originalPrice: '', unit: '',
  emoji: '', tag: '', tagType: 'success', bgGradient: '',
  available: true, stock: 100, featured: false, sortOrder: 0, categoryId: '',
}

const EMPTY_CAT = {
  name: '', emoji: '', description: '',
  bgColor: '', ringColor: '', sortOrder: 0,
}

const BG_PRESETS = [
  'linear-gradient(135deg,#f0fdf4,#dcfce7)',
  'linear-gradient(135deg,#fef3c7,#fde68a)',
  'linear-gradient(135deg,#eff6ff,#dbeafe)',
  'linear-gradient(135deg,#fff7ed,#fed7aa)',
  'linear-gradient(135deg,#fdf4ff,#e9d5ff)',
  'linear-gradient(135deg,#fef2f2,#fecaca)',
]

function fmt(price) { return formatPrice(price, { decimals: 2 }) }

/* ── Page ────────────────────────────────────────────── */
export default function ProductManagement() {
  const [tab, setTab] = useState('products') // 'products' | 'categories'

  /* ── Products state ──────────────────────────────────── */
  const [products,    setProducts]    = useState([])
  const [categories,  setCategories]  = useState([])
  // Products and categories load independently — a failure in one must never
  // blank the other, and a failed refresh must never discard already-loaded
  // data (stale-but-visible beats an empty screen for an admin mid-task).
  const [productsLoading,  setProductsLoading]  = useState(true)
  const [productsError,    setProductsError]    = useState(null) // classified error or null
  const [productsLoaded,   setProductsLoaded]   = useState(false)
  const [filterCat,   setFilterCat]   = useState('all')
  const [filterAvail, setFilterAvail] = useState('all')
  const [search,      setSearch]      = useState('')

  /* product modal state */
  const [modal,      setModal]      = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [form,       setForm]       = useState(EMPTY_PROD)
  const [formErr,    setFormErr]    = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [modalErr,   setModalErr]   = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  /* image upload state */
  const [uploadingId,   setUploadingId]   = useState(null)
  const [imagePreview,  setImagePreview]  = useState(null)
  const [imageFile,     setImageFile]     = useState(null)
  const fileInputRef = useRef(null)

  /* bulk state */
  const [selectedIds,   setSelectedIds]   = useState(new Set())
  const [bulkWorking,   setBulkWorking]   = useState(false)

  /* ── Categories state ────────────────────────────────── */
  const [catLoading,  setCatLoading]  = useState(true)
  const [catError,    setCatError]    = useState(null)  // classified error or null
  const [catLoaded,   setCatLoaded]   = useState(false)
  const [catModal,    setCatModal]    = useState(null) // null | 'add' | 'edit'
  const [catForm,     setCatForm]     = useState(EMPTY_CAT)
  const [catFormErr,  setCatFormErr]  = useState({})
  const [catSubmitting, setCatSubmitting] = useState(false)
  const [catModalErr, setCatModalErr] = useState('')
  const [catDeletingId,  setCatDeletingId]  = useState(null)
  const [catEditTarget,  setCatEditTarget]  = useState(null)
  const [catImagePreview, setCatImagePreview] = useState(null)
  const [catImageFile,    setCatImageFile]    = useState(null)
  const [catUploadingId,  setCatUploadingId]  = useState(null)
  const catFileInputRef = useRef(null)

  /* ── load (independent flows) ─────────────────────── */
  const loadProducts = useCallback(async () => {
    setProductsLoading(true); setProductsError(null)
    try {
      const { data } = await adminGetAllProducts()
      setProducts(Array.isArray(data) ? data : [])
      setProductsLoaded(true)
    } catch (err) {
      // Preserve any previously loaded products; just flag the failure.
      setProductsError(classifyError(err))
    } finally {
      setProductsLoading(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    setCatLoading(true); setCatError(null)
    try {
      const { data } = await adminGetCategories()
      setCategories(Array.isArray(data) ? data : [])
      setCatLoaded(true)
    } catch (err) {
      setCatError(classifyError(err))
    } finally {
      setCatLoading(false)
    }
  }, [])

  useEffect(() => { loadProducts(); loadCategories() }, [loadProducts, loadCategories])

  /* ── filtered products ─────────────────────────────── */
  const visible = products.filter(p => {
    const catOk   = filterCat   === 'all' || String(p.categoryId) === filterCat
    const availOk = filterAvail === 'all' || (filterAvail === 'active' ? p.available : !p.available)
    const searchOk = !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase())
    return catOk && availOk && searchOk
  })

  /* ── stats ────────────────────────────────────────── */
  const total    = products.length
  const active   = products.filter(p => p.available).length
  const featured = products.filter(p => p.featured).length

  // Show "—" rather than a misleading 0 when the underlying data never loaded.
  const productsUnknown = productsError && !productsLoaded
  const catsUnknown     = catError && !catLoaded
  const stat = (value, unknown) => (unknown ? '—' : value)

  /* ── product modal helpers ────────────────────────── */
  const openAdd = () => {
    setForm(EMPTY_PROD); setFormErr({}); setModalErr('')
    setEditTarget(null); setImagePreview(null); setImageFile(null); setModal('add')
  }
  const openEdit = (p) => {
    setForm({
      name: p.name || '', description: p.description || '',
      price: p.price || '', originalPrice: p.originalPrice || '', unit: p.unit || '',
      emoji: p.emoji || '', tag: p.tag || '',
      tagType: p.tagType || 'success', bgGradient: p.bgGradient || '',
      available: p.available, stock: p.stock ?? 100,
      featured: p.featured, sortOrder: p.sortOrder ?? 0,
      categoryId: p.categoryId ? String(p.categoryId) : '',
    })
    setFormErr({}); setModalErr(''); setEditTarget(p)
    setImagePreview(p.imageUrl || null); setImageFile(null); setModal('edit')
  }
  const closeModal = () => {
    setModal(null); setEditTarget(null)
    setImagePreview(null); setImageFile(null)
  }
  const setField = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (formErr[k]) setFormErr(f => ({ ...f, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim())  e.name  = 'Name is required'
    if (!form.price)        e.price = 'Price is required'
    else if (isNaN(form.price) || Number(form.price) <= 0) e.price = 'Enter valid price'
    if (!form.unit.trim())  e.unit  = 'Unit is required'
    setFormErr(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true); setModalErr('')
    const payload = {
      ...form,
      price: parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      stock: parseInt(form.stock) || 100,
      sortOrder: parseInt(form.sortOrder) || 0,
      categoryId: form.categoryId ? parseInt(form.categoryId) : null,
    }
    try {
      let saved
      if (modal === 'add') {
        const { data } = await adminCreateProduct(payload)
        saved = data
        setProducts(prev => [saved, ...prev])
      } else {
        const { data } = await adminUpdateProduct(editTarget.id, payload)
        saved = data
        setProducts(prev => prev.map(p => p.id === saved.id ? saved : p))
      }
      // Upload image if a new file was picked
      if (imageFile && saved?.id) {
        const fd = new FormData()
        fd.append('file', imageFile)
        const { data: withImg } = await adminUploadProductImage(saved.id, fd)
        setProducts(prev => prev.map(p => p.id === withImg.id ? withImg : p))
      }
      closeModal()
    } catch (err) {
      setModalErr(err.response?.data?.message || 'Operation failed.')
    } finally { setSubmitting(false) }
  }

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    setDeletingId(p.id)
    try {
      await adminDeleteProduct(p.id)
      setProducts(prev => prev.filter(x => x.id !== p.id))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete.')
    } finally { setDeletingId(null) }
  }

  const handleToggle = async (p) => {
    setTogglingId(p.id)
    try {
      const { data } = await adminToggleProduct(p.id)
      setProducts(prev => prev.map(x => x.id === data.id ? data : x))
    } catch {
      alert('Failed to toggle availability.')
    } finally { setTogglingId(null) }
  }

  /* ── Bulk handlers ────────────────────────────────────── */
  const toggleSelect = (id) => setSelectedIds(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const toggleSelectAll = () => {
    if (selectedIds.size === visible.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(visible.map(p => p.id)))
  }
  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.size} products? This cannot be undone.`)) return
    setBulkWorking(true)
    try {
      await adminBulkDeleteProducts([...selectedIds])
      setProducts(prev => prev.filter(p => !selectedIds.has(p.id)))
      clearSelection()
    } catch { alert('Bulk delete failed.') }
    finally { setBulkWorking(false) }
  }

  const handleBulkAvailable = async (available) => {
    setBulkWorking(true)
    try {
      await adminBulkSetAvailable([...selectedIds], available)
      setProducts(prev => prev.map(p =>
        selectedIds.has(p.id) ? { ...p, available } : p
      ))
      clearSelection()
    } catch { alert('Bulk update failed.') }
    finally { setBulkWorking(false) }
  }

  /* ── Image file pick ──────────────────────────────────── */
  const handleImagePick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  /* ── Inline image upload for existing products ────────── */
  const handleInlineUpload = async (p, file) => {
    if (!file) return
    setUploadingId(p.id)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await adminUploadProductImage(p.id, fd)
      setProducts(prev => prev.map(x => x.id === data.id ? data : x))
    } catch { alert('Image upload failed.') }
    finally { setUploadingId(null) }
  }

  /* ── category modal helpers ──────────────────────── */
  const openCatAdd = () => {
    setCatForm(EMPTY_CAT); setCatFormErr({}); setCatModalErr('')
    setCatEditTarget(null); setCatImagePreview(null); setCatImageFile(null); setCatModal('add')
  }
  const openCatEdit = (c) => {
    setCatForm({
      name: c.name || '', emoji: c.emoji || '', description: c.description || '',
      bgColor: c.bgColor || '', ringColor: c.ringColor || '', sortOrder: c.sortOrder ?? 0,
    })
    setCatFormErr({}); setCatModalErr(''); setCatEditTarget(c)
    setCatImagePreview(c.imageUrl || null); setCatImageFile(null); setCatModal('edit')
  }
  const closeCatModal = () => {
    setCatModal(null); setCatEditTarget(null)
    setCatImagePreview(null); setCatImageFile(null)
  }
  const setCatField = (k, v) => { setCatForm(f => ({ ...f, [k]: v })); if (catFormErr[k]) setCatFormErr(f => ({ ...f, [k]: '' })) }

  const validateCat = () => {
    const e = {}
    if (!catForm.name.trim()) e.name = 'Category name is required'
    setCatFormErr(e)
    return Object.keys(e).length === 0
  }

  const handleCatSubmit = async (e) => {
    e.preventDefault()
    if (!validateCat()) return
    setCatSubmitting(true); setCatModalErr('')
    try {
      let saved
      if (catModal === 'add') {
        const { data } = await adminCreateCategory(catForm)
        saved = data
        setCategories(prev => [...prev, saved])
      } else {
        const { data } = await adminUpdateCategory(catEditTarget.id, catForm)
        saved = data
        setCategories(prev => prev.map(c => c.id === saved.id ? saved : c))
      }
      if (catImageFile && saved?.id) {
        const fd = new FormData()
        fd.append('file', catImageFile)
        const { data: withImg } = await adminUploadCategoryImage(saved.id, fd)
        setCategories(prev => prev.map(c => c.id === withImg.id ? withImg : c))
      }
      closeCatModal()
    } catch (err) {
      setCatModalErr(err.response?.data?.message || 'Operation failed.')
    } finally { setCatSubmitting(false) }
  }

  const handleCatImagePick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCatImageFile(file)
    setCatImagePreview(URL.createObjectURL(file))
  }

  const handleCatInlineUpload = async (c, file) => {
    if (!file) return
    setCatUploadingId(c.id)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await adminUploadCategoryImage(c.id, fd)
      setCategories(prev => prev.map(x => x.id === data.id ? data : x))
    } catch { alert('Image upload failed.') }
    finally { setCatUploadingId(null) }
  }

  const handleCatDelete = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"? Products in this category will become uncategorised.`)) return
    setCatDeletingId(c.id)
    try {
      await adminDeleteCategory(c.id)
      setCategories(prev => prev.filter(x => x.id !== c.id))
      // refresh products (some may have lost their category); a failed refresh
      // here shouldn't wipe the table — loadProducts preserves prior data.
      loadProducts()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category.')
    } finally { setCatDeletingId(null) }
  }

  /* ── render ───────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1300 }}>

      {/* ── Header ── */}
      <div className="anim-fade-in-up" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 12, animationFillMode: 'both' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
            Product Management
          </h1>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', color: 'var(--color-text-muted)' }}>
            {stat(total, productsUnknown)} products · {stat(active, productsUnknown)} active · {stat(featured, productsUnknown)} featured · {stat(categories.length, catsUnknown)} categories
          </p>
        </div>
        <button
          onClick={tab === 'products' ? openAdd : openCatAdd}
          style={{
            padding: '10px 20px', borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg,#16a34a,#15803d)',
            color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)',
            display: 'flex', alignItems: 'center', gap: 6,
            boxShadow: '0 4px 14px rgba(22,163,74,0.35)',
          }}
        >
          + {tab === 'products' ? 'Add Product' : 'Add Category'}
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="anim-fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 20, animationFillMode: 'both', animationDelay: '50ms' }}>
        {[
          { label: 'Total Products', value: stat(total, productsUnknown),          color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Active',         value: stat(active, productsUnknown),         color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Inactive',       value: stat(total - active, productsUnknown), color: '#dc2626', bg: '#fef2f2' },
          { label: 'Featured',       value: stat(featured, productsUnknown),       color: '#d97706', bg: '#fef3c7' },
          { label: 'Categories',     value: stat(categories.length, catsUnknown),  color: '#0891b2', bg: '#ecfeff' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: '12px 16px', border: `1.5px solid ${s.bg}` }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.color, opacity: 0.7, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="anim-fade-in-up" style={{ display: 'flex', borderRadius: 10, background: '#f1f5f9', padding: 3, border: '1px solid #e2e8f0', width: 'fit-content', marginBottom: 20, animationFillMode: 'both', animationDelay: '80ms' }}>
        {[{ key: 'products', label: '📦 Products' }, { key: 'categories', label: '🏷️ Categories' }].map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
              border: 'none', cursor: 'pointer',
              background: tab === t.key ? '#fff' : 'transparent',
              color: tab === t.key ? '#15803d' : '#64748b',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
              transition: 'all 150ms',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════ PRODUCTS TAB ══════════════════════ */}
      {tab === 'products' && (
        <>
          {/* Filters + Search */}
          <div className="anim-fade-in-up" style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center', animationFillMode: 'both', animationDelay: '100ms' }}>
            {/* Search */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8' }}>🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                style={{
                  paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                  border: '1.5px solid var(--color-border)', borderRadius: 20,
                  fontSize: 13, outline: 'none', background: '#fff',
                  color: 'var(--color-text)', width: 200,
                }}
              />
            </div>

            {/* Category tabs */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[{ id: 'all', name: 'All', emoji: '🔲' }, ...categories].map(c => (
                <button
                  key={c.id}
                  onClick={() => setFilterCat(String(c.id))}
                  style={{
                    padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${filterCat === String(c.id) ? '#7c3aed' : 'var(--color-border)'}`,
                    background: filterCat === String(c.id) ? '#f5f3ff' : '#fff',
                    color: filterCat === String(c.id) ? '#7c3aed' : 'var(--color-text-muted)',
                    transition: 'all 120ms',
                  }}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>

            {/* Availability filter */}
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              {[['all', 'All'], ['active', '✅ Active'], ['inactive', '❌ Inactive']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setFilterAvail(val)}
                  style={{
                    padding: '6px 13px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    border: `1.5px solid ${filterAvail === val ? '#16a34a' : 'var(--color-border)'}`,
                    background: filterAvail === val ? '#f0fdf4' : '#fff',
                    color: filterAvail === val ? '#16a34a' : 'var(--color-text-muted)',
                    transition: 'all 120ms',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Table card */}
          <div className="anim-fade-in-up" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', animationFillMode: 'both', animationDelay: '120ms' }}>
            {productsLoading && !productsLoaded ? (
              <div style={{ padding: 64, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                Loading products...
              </div>
            ) : productsError && !productsLoaded ? (
              /* Never loaded — full error state (distinct from an empty table). */
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-red-600)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Couldn't load products</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 12 }}>{productsError.message}</div>
                {productsError.retryable && (
                  <button onClick={loadProducts} disabled={productsLoading} style={{ display: 'block', margin: '0 auto', padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
                    {productsLoading ? 'Retrying…' : '↻ Try Again'}
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Stale-data banner: prior products still shown, refresh failed. */}
                {productsError && productsLoaded && (
                  <div style={{ padding: '9px 20px', background: '#fef2f2', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#b91c1c' }}>
                    <span>⚠️ Couldn't refresh — showing last loaded data.</span>
                    {productsError.retryable && (
                      <button onClick={loadProducts} disabled={productsLoading} style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 20, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        {productsLoading ? 'Retrying…' : '↻ Retry'}
                      </button>
                    )}
                  </div>
                )}
                <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--color-border)', background: '#fafafa', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-semibold)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{visible.length} product{visible.length !== 1 ? 's' : ''} shown</span>
                  {search && <span style={{ fontSize: 12, color: '#7c3aed' }}>Filtered by: "{search}"</span>}
                </div>

                {/* ── Bulk Action Bar ── */}
                {selectedIds.size > 0 && (
                  <div style={{ padding: '10px 20px', background: '#eff6ff', borderBottom: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>
                      {selectedIds.size} selected
                    </span>
                    <button onClick={() => handleBulkAvailable(true)} disabled={bulkWorking}
                      style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: 'none', background: '#dcfce7', color: '#16a34a', cursor: 'pointer' }}>
                      ✅ Enable All
                    </button>
                    <button onClick={() => handleBulkAvailable(false)} disabled={bulkWorking}
                      style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: 'none', background: '#fef3c7', color: '#d97706', cursor: 'pointer' }}>
                      ⏸ Disable All
                    </button>
                    <button onClick={handleBulkDelete} disabled={bulkWorking}
                      style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer' }}>
                      🗑️ Delete All
                    </button>
                    <button onClick={clearSelection}
                      style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', marginLeft: 'auto' }}>
                      ✕ Clear
                    </button>
                  </div>
                )}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border)', background: '#fafafa' }}>
                        <th style={{ padding: '10px 10px 10px 16px', width: 36 }}>
                          <input type="checkbox"
                            checked={visible.length > 0 && selectedIds.size === visible.length}
                            onChange={toggleSelectAll}
                            style={{ cursor: 'pointer', width: 15, height: 15 }}
                          />
                        </th>
                        {['Product', 'Category', 'Price', 'Stock', 'Status', 'Featured', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visible.length === 0 ? (
                        <tr><td colSpan={7} style={{ padding: 52, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                          <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
                          No products found{search ? ` for "${search}"` : ''}
                        </td></tr>
                      ) : visible.map((p, i) => (
                        <tr key={p.id}
                          style={{ borderBottom: i < visible.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background 120ms', background: selectedIds.has(p.id) ? '#f0f9ff' : '' }}
                          onMouseEnter={e => { if (!selectedIds.has(p.id)) e.currentTarget.style.background = '#f8fafc' }}
                          onMouseLeave={e => { if (!selectedIds.has(p.id)) e.currentTarget.style.background = '' }}>

                          {/* Checkbox */}
                          <td style={{ padding: '11px 10px 11px 16px' }}>
                            <input type="checkbox"
                              checked={selectedIds.has(p.id)}
                              onChange={() => toggleSelect(p.id)}
                              style={{ cursor: 'pointer', width: 15, height: 15 }}
                            />
                          </td>

                          {/* Product */}
                          <td style={{ padding: '11px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {/* Image or emoji */}
                              <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }} title="Click to upload image">
                                <input type="file" accept="image/*" style={{ display: 'none' }}
                                  onChange={e => handleInlineUpload(p, e.target.files?.[0])}
                                />
                                <div style={{
                                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                  background: p.bgGradient || 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                                  overflow: 'hidden', position: 'relative',
                                }}>
                                  {p.imageUrl
                                    ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : (p.emoji || '📦')
                                  }
                                  {uploadingId === p.id && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff' }}>⏳</div>
                                  )}
                                </div>
                              </label>
                              <div>
                                <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>{p.unit}</div>
                              </div>
                              {p.tag && (
                                <span style={{
                                  fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 700,
                                  background: p.tagType === 'success' ? '#f0fdf4' : p.tagType === 'warning' ? '#fef3c7' : p.tagType === 'info' ? '#eff6ff' : '#fef2f2',
                                  color: p.tagType === 'success' ? '#16a34a' : p.tagType === 'warning' ? '#d97706' : p.tagType === 'info' ? '#1d4ed8' : '#dc2626',
                                }}>{p.tag}</span>
                              )}
                            </div>
                          </td>

                          {/* Category */}
                          <td style={{ padding: '11px 14px' }}>
                            {p.categoryEmoji && <span style={{ marginRight: 4 }}>{p.categoryEmoji}</span>}
                            <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{p.categoryName || '—'}</span>
                          </td>

                          {/* Price */}
                          <td style={{ padding: '11px 14px' }}>
                            <div style={{ fontWeight: 'var(--font-semibold)', color: '#16a34a' }}>{fmt(p.price)}</div>
                            {p.originalPrice && (
                              <div style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>{fmt(p.originalPrice)}</div>
                            )}
                          </td>

                          {/* Stock */}
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{
                              fontSize: 12, padding: '2px 8px', borderRadius: 10, fontWeight: 600,
                              background: p.stock > 20 ? '#f0fdf4' : p.stock > 5 ? '#fef3c7' : '#fef2f2',
                              color: p.stock > 20 ? '#16a34a' : p.stock > 5 ? '#d97706' : '#dc2626',
                            }}>{p.stock}</span>
                          </td>

                          {/* Toggle */}
                          <td style={{ padding: '11px 14px' }}>
                            <button
                              onClick={() => handleToggle(p)}
                              disabled={togglingId === p.id}
                              title={p.available ? 'Click to disable' : 'Click to enable'}
                              style={{
                                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                border: 'none',
                                background: p.available ? '#f0fdf4' : '#fef2f2',
                                color: p.available ? '#16a34a' : '#dc2626',
                                opacity: togglingId === p.id ? 0.6 : 1,
                                transition: 'opacity 150ms',
                              }}
                            >
                              {togglingId === p.id ? '...' : p.available ? '✅ Active' : '❌ Inactive'}
                            </button>
                          </td>

                          {/* Featured */}
                          <td style={{ padding: '11px 14px' }}>
                            {p.featured
                              ? <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: '#fef3c7', color: '#d97706', fontWeight: 700 }}>⭐ Yes</span>
                              : <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>—</span>}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '11px 14px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => openEdit(p)}
                                style={{ padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-text)', cursor: 'pointer' }}>
                                ✏️ Edit
                              </button>
                              <button onClick={() => handleDelete(p)} disabled={deletingId === p.id}
                                style={{ padding: '5px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, border: '1px solid var(--color-red-200)', background: 'var(--color-red-50)', color: 'var(--color-red-600)', cursor: deletingId === p.id ? 'not-allowed' : 'pointer', opacity: deletingId === p.id ? 0.6 : 1 }}>
                                {deletingId === p.id ? '...' : '🗑️'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════ CATEGORIES TAB ══════════════════════ */}
      {tab === 'categories' && (
        <div className="anim-fade-in-up" style={{ animationFillMode: 'both' }}>
          {catLoading && !catLoaded ? (
            <div style={{ padding: 64, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading categories...</div>
          ) : catError && !catLoaded ? (
            /* Load failure — NOT "No categories yet". */
            <div style={{ padding: 64, textAlign: 'center', color: 'var(--color-red-600)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Couldn't load categories</div>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>{catError.message}</p>
              {catError.retryable && (
                <button onClick={loadCategories} disabled={catLoading} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
                  {catLoading ? 'Retrying…' : '↻ Try Again'}
                </button>
              )}
            </div>
          ) : categories.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🏷️</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No categories yet</div>
              <p style={{ margin: 0, fontSize: 13 }}>Add your first category to organise products</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 14 }}>
              {categories.map((c, i) => (
                <div key={c.id}
                  className="anim-fade-in-up"
                  style={{
                    background: '#fff', borderRadius: 16, border: '1.5px solid var(--color-border)',
                    padding: '18px 20px', boxShadow: 'var(--shadow-sm)',
                    animationFillMode: 'both', animationDelay: `${i * 40}ms`,
                    transition: 'box-shadow 150ms, transform 150ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    {/* Category icon — click to upload image */}
                    <label style={{ cursor: 'pointer', flexShrink: 0, position: 'relative' }} title="Click to upload image">
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => handleCatInlineUpload(c, e.target.files?.[0])}
                      />
                      <div style={{
                        width: 56, height: 56, borderRadius: 14, overflow: 'hidden',
                        background: c.bgColor || '#f0fdf4',
                        border: `2px solid ${c.ringColor || '#86efac'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 26, position: 'relative',
                      }}>
                        {c.imageUrl
                          ? <img src={c.imageUrl} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (c.emoji || '🏷️')
                        }
                        {catUploadingId === c.id && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff' }}>⏳</div>
                        )}
                        {/* hover overlay hint */}
                        <div style={{
                          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', borderRadius: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, color: '#fff', fontWeight: 700,
                          transition: 'background 150ms',
                        }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                        >📷</div>
                      </div>
                    </label>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text)', marginBottom: 2 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {c.productCount ?? 0} active product{c.productCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  {c.description && (
                    <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{c.description}</p>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openCatEdit(c)}
                      style={{ flex: 1, padding: '7px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid var(--color-border)', background: '#fff', color: 'var(--color-text)', cursor: 'pointer' }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleCatDelete(c)} disabled={catDeletingId === c.id}
                      style={{ padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid var(--color-red-200)', background: 'var(--color-red-50)', color: 'var(--color-red-600)', cursor: catDeletingId === c.id ? 'not-allowed' : 'pointer', opacity: catDeletingId === c.id ? 0.6 : 1 }}>
                      {catDeletingId === c.id ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════ PRODUCT MODAL ══════════════════ */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="anim-scale-in" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 580, maxHeight: '90vh', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', animationFillMode: 'both' }}>

            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
                {modal === 'add' ? '+ Add Product' : `✏️ Edit: ${editTarget?.name}`}
              </h3>
              <button onClick={closeModal} style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: '#fff', cursor: 'pointer', fontSize: 16, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1 }}>
              <form onSubmit={handleSubmit} id="prod-form" style={{ padding: '18px 24px' }}>
                {modalErr && (
                  <div style={{ background: 'var(--color-red-50)', color: 'var(--color-red-700)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 14, fontSize: 'var(--text-sm)', border: '1px solid var(--color-red-200)' }}>
                    ⚠️ {modalErr}
                  </div>
                )}

                {/* Image Upload */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>
                    Product Image
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
                      background: form.bgGradient || 'linear-gradient(135deg,#f0fdf4,#dcfce7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 36, border: '2px dashed #e2e8f0',
                    }}>
                      {imagePreview
                        ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (form.emoji || '📦')}
                    </div>
                    <div style={{ flex: 1 }}>
                      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid var(--color-border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
                        📁 {imagePreview ? 'Change Image' : 'Upload Image'}
                      </button>
                      {imageFile && <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ {imageFile.name}</div>}
                      {!imageFile && <div style={{ fontSize: 11, color: '#94a3b8' }}>JPG / PNG / WebP · max 5 MB · or use emoji below</div>}
                      {imagePreview && !imageFile && <div style={{ fontSize: 11, color: '#64748b' }}>Current image saved</div>}
                    </div>
                  </div>
                </div>

                {/* Row 1: Name + Emoji */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: 12, marginBottom: 14 }}>
                  <MField label="Product Name *" error={formErr.name}>
                    <input value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Full Cream Milk" style={inp(formErr.name)} />
                  </MField>
                  <MField label="Emoji">
                    <input value={form.emoji} onChange={e => setField('emoji', e.target.value)} placeholder="🥛" style={{ ...inp(), fontSize: 24, textAlign: 'center' }} />
                  </MField>
                </div>

                {/* Description */}
                <MField label="Description" style={{ marginBottom: 14 }}>
                  <textarea value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Product description..." rows={2} style={{ ...inp(), resize: 'none', lineHeight: 1.5 }} />
                </MField>

                {/* Row 2: Price + Original Price + Unit + Stock */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 90px', gap: 12, marginBottom: 14 }}>
                  <MField label="Price (₹) *" error={formErr.price}>
                    <input type="number" step="0.01" value={form.price} onChange={e => setField('price', e.target.value)} placeholder="28.00" style={inp(formErr.price)} />
                  </MField>
                  <MField label="MRP / Original (₹)">
                    <input type="number" step="0.01" value={form.originalPrice} onChange={e => setField('originalPrice', e.target.value)} placeholder="32.00" style={inp()} />
                  </MField>
                  <MField label="Unit *" error={formErr.unit}>
                    <input value={form.unit} onChange={e => setField('unit', e.target.value)} placeholder="500ml" style={inp(formErr.unit)} />
                  </MField>
                  <MField label="Stock">
                    <input type="number" value={form.stock} onChange={e => setField('stock', e.target.value)} placeholder="100" style={inp()} />
                  </MField>
                </div>

                {/* Row 3: Category + Tag + TagType + Sort Order */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: 12, marginBottom: 14 }}>
                  <MField label="Category">
                    <select value={form.categoryId} onChange={e => setField('categoryId', e.target.value)} style={inp()}>
                      <option value="">— None —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                    </select>
                  </MField>
                  <MField label="Tag">
                    <input value={form.tag} onChange={e => setField('tag', e.target.value)} placeholder="BESTSELLER" style={inp()} />
                  </MField>
                  <MField label="Tag Style">
                    <select value={form.tagType} onChange={e => setField('tagType', e.target.value)} style={inp()}>
                      {TAG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </MField>
                  <MField label="Order">
                    <input type="number" value={form.sortOrder} onChange={e => setField('sortOrder', e.target.value)} placeholder="0" style={inp()} />
                  </MField>
                </div>

                {/* Background Gradient */}
                <MField label="Card Background" style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    {BG_PRESETS.map(bg => (
                      <button key={bg} type="button" onClick={() => setField('bgGradient', bg)}
                        style={{
                          width: 36, height: 36, borderRadius: 8, background: bg, cursor: 'pointer',
                          border: `2.5px solid ${form.bgGradient === bg ? '#16a34a' : '#e2e8f0'}`,
                          transition: 'border-color 150ms',
                        }} />
                    ))}
                  </div>
                  <input value={form.bgGradient} onChange={e => setField('bgGradient', e.target.value)} placeholder="linear-gradient(135deg,#f0fdf4,#dcfce7)" style={inp()} />
                </MField>

                {/* Toggles */}
                <div style={{ display: 'flex', gap: 24, marginTop: 4 }}>
                  <Toggle label="Available" checked={form.available} onChange={v => setField('available', v)} />
                  <Toggle label="⭐ Featured" checked={form.featured} onChange={v => setField('featured', v)} />
                </div>
              </form>
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10, flexShrink: 0 }}>
              <button type="button" onClick={closeModal} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', background: '#fff', color: 'var(--color-text-muted)', fontWeight: 'var(--font-medium)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                Cancel
              </button>
              <button form="prod-form" type="submit" disabled={submitting} style={{ flex: 2, padding: '10px', borderRadius: 'var(--radius-md)', border: 'none', background: submitting ? '#86efac' : 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', fontWeight: 'var(--font-semibold)', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}>
                {submitting ? 'Saving...' : modal === 'add' ? 'Add Product' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════ CATEGORY MODAL ══════════════════ */}
      {catModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget) closeCatModal() }}>
          <div className="anim-scale-in" style={{ background: '#fff', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', animationFillMode: 'both' }}>

            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-text)' }}>
                {catModal === 'add' ? '🏷️ Add Category' : `✏️ Edit: ${catEditTarget?.name}`}
              </h3>
              <button onClick={closeCatModal} style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: '#fff', cursor: 'pointer', fontSize: 16, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <form onSubmit={handleCatSubmit} id="cat-form" style={{ padding: '18px 24px' }}>
              {catModalErr && (
                <div style={{ background: 'var(--color-red-50)', color: 'var(--color-red-700)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 14, fontSize: 'var(--text-sm)', border: '1px solid var(--color-red-200)' }}>
                  ⚠️ {catModalErr}
                </div>
              )}

              {/* Name + Emoji */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12, marginBottom: 14 }}>
                <MField label="Category Name *" error={catFormErr.name}>
                  <input value={catForm.name} onChange={e => setCatField('name', e.target.value)} placeholder="Milk" style={inp(catFormErr.name)} autoFocus />
                </MField>
                <MField label="Emoji">
                  <input value={catForm.emoji} onChange={e => setCatField('emoji', e.target.value)} placeholder="🥛" style={{ ...inp(), fontSize: 24, textAlign: 'center' }} />
                </MField>
              </div>

              {/* Description */}
              <MField label="Description" style={{ marginBottom: 14 }}>
                <textarea value={catForm.description} onChange={e => setCatField('description', e.target.value)} placeholder="Short description..." rows={2} style={{ ...inp(), resize: 'none' }} />
              </MField>

              {/* Image Upload */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>Category Image (optional)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                    background: catForm.bgColor || '#f0fdf4',
                    border: `2px solid ${catForm.ringColor || '#86efac'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                  }}>
                    {catImagePreview
                      ? <img src={catImagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (catForm.emoji || '🏷️')
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <input ref={catFileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={handleCatImagePick} />
                    <button type="button"
                      onClick={() => catFileInputRef.current?.click()}
                      style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px dashed #cbd5e1', background: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                      {catImagePreview ? '🔄 Change Image' : '📷 Upload Image'}
                    </button>
                    {catImagePreview && (
                      <button type="button"
                        onClick={() => { setCatImagePreview(null); setCatImageFile(null) }}
                        style={{ marginTop: 6, padding: '5px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fef2f2', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                        ✕ Remove Image
                      </button>
                    )}
                    <div style={{ marginTop: 5, fontSize: 11, color: '#94a3b8' }}>JPG, PNG, WebP — max 5 MB</div>
                  </div>
                </div>
              </div>

              {/* Colors + Sort */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12, marginBottom: 4 }}>
                <MField label="BG Color">
                  <input value={catForm.bgColor} onChange={e => setCatField('bgColor', e.target.value)} placeholder="#f0fdf4" style={inp()} />
                </MField>
                <MField label="Ring Color">
                  <input value={catForm.ringColor} onChange={e => setCatField('ringColor', e.target.value)} placeholder="#86efac" style={inp()} />
                </MField>
                <MField label="Order">
                  <input type="number" value={catForm.sortOrder} onChange={e => setCatField('sortOrder', parseInt(e.target.value) || 0)} placeholder="0" style={inp()} />
                </MField>
              </div>

              {/* Preview */}
              {(catForm.name || catForm.emoji) && (
                <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preview</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10, overflow: 'hidden',
                      background: catForm.bgColor || '#f0fdf4',
                      border: `2px solid ${catForm.ringColor || '#86efac'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    }}>
                      {catImagePreview
                        ? <img src={catImagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : (catForm.emoji || '🏷️')
                      }
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{catForm.name || 'Category Name'}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{catForm.description || 'Description'}</div>
                    </div>
                  </div>
                </div>
              )}
            </form>

            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10 }}>
              <button type="button" onClick={closeCatModal} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--color-border)', background: '#fff', color: 'var(--color-text-muted)', fontWeight: 'var(--font-medium)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                Cancel
              </button>
              <button form="cat-form" type="submit" disabled={catSubmitting} style={{ flex: 2, padding: '10px', borderRadius: 'var(--radius-md)', border: 'none', background: catSubmitting ? '#86efac' : 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', fontWeight: 'var(--font-semibold)', cursor: catSubmitting ? 'not-allowed' : 'pointer', fontSize: 'var(--text-sm)', boxShadow: '0 4px 14px rgba(22,163,74,0.3)' }}>
                {catSubmitting ? 'Saving...' : catModal === 'add' ? 'Add Category' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Small helpers ────────────────────────────────────── */
function MField({ label, children, error }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 5, fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--color-text)' }}>{label}</label>
      {children}
      {error && <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--color-red-600)' }}>{error}</p>}
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <div onClick={() => onChange(!checked)}
        style={{ width: 44, height: 24, borderRadius: 12, position: 'relative', flexShrink: 0, background: checked ? '#16a34a' : '#d1d5db', transition: 'background 200ms' }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 200ms', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
      </div>
      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)', color: 'var(--color-text)' }}>{label}</span>
    </label>
  )
}

const inp = (err) => ({
  width: '100%', padding: '9px 11px', boxSizing: 'border-box',
  border: `1.5px solid ${err ? 'var(--color-red-400)' : 'var(--color-border)'}`,
  borderRadius: 'var(--radius-md)', fontSize: 'var(--text-base)',
  color: 'var(--color-text)', background: '#fff', outline: 'none', fontFamily: 'inherit',
})
