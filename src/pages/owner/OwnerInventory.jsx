import { useEffect, useState } from 'react'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import {
  getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem,
} from '../../lib/ownerApi'

const CATEGORIES = [
  ['', 'الكل'], ['furniture', 'أثاث'], ['audio', 'صوتيات'],
  ['lighting', 'إضاءة'], ['kitchen', 'مطبخ'], ['decor', 'ديكور'], ['other', 'أخرى'],
]

const CAT_AR = { furniture: 'أثاث', audio: 'صوتيات', lighting: 'إضاءة', kitchen: 'مطبخ', decor: 'ديكور', other: 'أخرى' }
const COND_AR = { good: 'جيد', fair: 'مقبول', needs_repair: 'يحتاج صيانة' }
const COND_COLOR = { good: '#34D399', fair: '#FBBF24', needs_repair: '#F87171' }

const emptyItem = { name: '', category: 'furniture', quantity: 1, min_quantity: 1, condition: 'good', location: '', notes: '' }

export default function OwnerInventory() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(emptyItem)
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    getInventory()
      .then(res => {
        const d = res.data?.data ?? res.data
        setItems(Array.isArray(d) ? d : (d?.results ?? []))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openAdd() { setForm(emptyItem); setModal('add') }
  function openEdit(item) { setForm({ ...item }); setModal(item.id) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal === 'add') await createInventoryItem(form)
      else await updateInventoryItem(modal, form)
      setModal(null)
      load()
    } catch { /* noop */ } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('هل تريد حذف هذا العنصر؟')) return
    await deleteInventoryItem(id)
    load()
  }

  const filtered = catFilter ? items.filter(i => i.category === catFilter) : items
  const lowStockCount = items.filter(i => i.is_low_stock).length

  return (
    <div className="owner-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>المخزون</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {items.length} عنصر
            {lowStockCount > 0 && (
              <span style={{ marginRight: '8px', color: '#FBBF24' }}>• {lowStockCount} عنصر منخفض المخزون</span>
            )}
          </p>
        </div>
        <button onClick={openAdd} className="glass-btn glass-btn-primary"><PlusIcon style={{ width: 16, height: 16 }} /> إضافة عنصر</button>
      </div>

      {/* Category filter */}
      <div className="glass-tabs" style={{ marginBottom: '20px', flexWrap: 'wrap' }}>
        {CATEGORIES.map(([v, l]) => (
          <button key={v} className={`glass-tab${catFilter === v ? ' active' : ''}`} onClick={() => setCatFilter(v)}>
            {l}
          </button>
        ))}
      </div>

      <div className="glass-card-static">
        {loading ? (
          <div style={{ padding: '30px' }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8, marginBottom: 8 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px' }}>
            لا توجد عناصر
          </div>
        ) : (
          <div className="glass-table-wrap">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>اسم العنصر</th>
                  <th>الفئة</th>
                  <th>الكمية</th>
                  <th>الحد الأدنى</th>
                  <th>الحالة</th>
                  <th>المستوى</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td>{CAT_AR[item.category] || item.category}</td>
                    <td>
                      <span style={{ color: item.is_low_stock ? '#FBBF24' : 'rgba(255,255,255,0.8)' }}>
                        {item.quantity}
                        {item.is_low_stock && ' !'}
                      </span>
                    </td>
                    <td>{item.min_quantity}</td>
                    <td>
                      <span style={{ color: COND_COLOR[item.condition] || 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: 600 }}>
                        ● {COND_AR[item.condition] || item.condition}
                      </span>
                    </td>
                    <td>
                      <div style={{ width: 80, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)' }}>
                        <div style={{
                          height: '100%', borderRadius: 3,
                          width: `${Math.min((item.quantity / Math.max(item.min_quantity * 3, 1)) * 100, 100)}%`,
                          background: item.is_low_stock ? '#FBBF24' : '#34D399',
                        }} />
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => openEdit(item)} className="glass-btn glass-btn-sm"><PencilIcon style={{ width: 14, height: 14 }} /></button>
                        <button onClick={() => handleDelete(item.id)} className="glass-btn glass-btn-sm glass-btn-danger"><TrashIcon style={{ width: 14, height: 14 }} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="glass-modal-overlay" onClick={() => setModal(null)}>
          <div className="glass-modal-panel" style={{ maxWidth: 480, padding: '28px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px' }}>
              {modal === 'add' ? 'إضافة عنصر جديد' : 'تعديل العنصر'}
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="glass-label">اسم العنصر</label>
                <input className="glass-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="glass-label">الفئة</label>
                  <select className="glass-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.slice(1).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="glass-label">الحالة</label>
                  <select className="glass-select" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                    <option value="good">جيد</option>
                    <option value="fair">مقبول</option>
                    <option value="needs_repair">يحتاج صيانة</option>
                  </select>
                </div>
                <div>
                  <label className="glass-label">الكمية</label>
                  <input className="glass-input" type="number" min={0} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))} />
                </div>
                <div>
                  <label className="glass-label">الحد الأدنى</label>
                  <input className="glass-input" type="number" min={0} value={form.min_quantity} onChange={e => setForm(f => ({ ...f, min_quantity: +e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="glass-label">الموقع (اختياري)</label>
                <input className="glass-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="المستودع، الغرفة..." />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModal(null)} className="glass-btn" style={{ flex: 1 }}>إلغاء</button>
                <button type="submit" disabled={saving} className="glass-btn glass-btn-primary" style={{ flex: 1 }}>
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
