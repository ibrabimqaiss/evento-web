import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  PlusIcon, TrashIcon, PencilIcon, CheckIcon, XMarkIcon,
  PhotoIcon, LinkIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline'
import {
  getOwnerVenues, getVenueMenu, createMenuItem, updateMenuItem, deleteMenuItem, fmtIQD,
} from '../../lib/ownerApi'

const MENU_CATS = [
  { key: 'appetizers', label: 'المقبلات' },
  { key: 'mains', label: 'الأطباق الرئيسية' },
  { key: 'desserts', label: 'الحلويات' },
  { key: 'drinks', label: 'المشروبات' },
]

const SHARE_BASE = 'https://evento-iq.com/venue'

function MenuItemCard({ item, onDelete, onEdit }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {item.photo_url ? (
        <img src={item.photo_url} alt={item.name} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
      ) : (
        <div style={{ width: '100%', height: '80px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PhotoIcon style={{ width: 28, height: 28, color: 'rgba(255,255,255,0.2)' }} />
        </div>
      )}
      <div style={{ padding: '12px', flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '14px', color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>{item.name_ar || item.name}</div>
        {item.description_ar && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px', lineHeight: 1.4 }}>{item.description_ar}</div>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#A78BFA' }}>{fmtIQD(item.service_price_iqd)}</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => onEdit(item)} style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '8px', padding: '5px', cursor: 'pointer', color: '#A78BFA', display: 'flex', alignItems: 'center' }}>
              <PencilIcon style={{ width: 13, height: 13 }} />
            </button>
            <button onClick={() => onDelete(item.id)} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '8px', padding: '5px', cursor: 'pointer', color: '#FCA5A5', display: 'flex', alignItems: 'center' }}>
              <TrashIcon style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AddEditModal({ slug, activeTab, item, onSave, onClose }) {
  const isEdit = !!item
  const [form, setForm] = useState({
    name: item?.name_ar || item?.name || '',
    description: item?.description_ar || item?.description || '',
    price: item?.service_price_iqd ? String(Math.round(Number(item.service_price_iqd))) : '',
    photo: null,
  })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const photoRef = useRef()

  async function save() {
    if (!form.name.trim() || !form.price) return
    setSaving(true)
    setSaveError('')
    const priceStr = String(Math.round(Number(form.price)))
    try {
      let res
      if (isEdit) {
        if (form.photo) {
          // New file selected — must use FormData (multipart) for file upload
          const fd = new FormData()
          fd.append('name', form.name)
          fd.append('name_ar', form.name)
          fd.append('description', form.description)
          fd.append('description_ar', form.description)
          fd.append('category', activeTab)
          fd.append('service_type', 'paid')
          fd.append('service_price_iqd', priceStr)
          fd.append('image', form.photo)
          res = await updateMenuItem(slug, item.id, fd)
        } else {
          // No new file — send JSON to avoid multipart "not a file" errors
          res = await updateMenuItem(slug, item.id, {
            name: form.name, name_ar: form.name,
            description: form.description, description_ar: form.description,
            category: activeTab, service_type: 'paid',
            service_price_iqd: priceStr,
          })
        }
        onSave(res.data?.data ?? res.data, true)
      } else {
        const fd = new FormData()
        fd.append('name', form.name)
        fd.append('name_ar', form.name)
        fd.append('description', form.description)
        fd.append('description_ar', form.description)
        fd.append('category', activeTab)
        fd.append('service_type', 'paid')
        fd.append('service_price_iqd', priceStr)
        if (form.photo) fd.append('image', form.photo)
        res = await createMenuItem(slug, fd)
        onSave(res.data?.data ?? res.data, false)
      }
      onClose()
    } catch (err) {
      const d = err.response?.data
      setSaveError(d?.error?.message || d?.detail || JSON.stringify(d) || 'فشل الحفظ')
    }
    setSaving(false)
  }

  return (
    <div className="glass-modal-overlay" onClick={onClose}>
      <div className="glass-modal-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90vw', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
            {isEdit ? 'تعديل الصنف' : 'إضافة صنف جديد'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
            <XMarkIcon style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label className="glass-label">اسم الصنف *</label>
            <input className="glass-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: شوربة عدس" />
          </div>
          <div>
            <label className="glass-label">السعر (IQD) *</label>
            <input className="glass-input" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="5000" />
          </div>
          <div>
            <label className="glass-label">الوصف</label>
            <input className="glass-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف مختصر..." />
          </div>
          <div>
            <label className="glass-label">صورة الصنف</label>
            <button className="glass-btn glass-btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => photoRef.current?.click()}>
              <PhotoIcon style={{ width: 14, height: 14 }} /> {form.photo ? form.photo.name : 'اختر صورة'}
            </button>
            <input ref={photoRef} type="file" accept="image/*" hidden onChange={e => setForm(f => ({ ...f, photo: e.target.files[0] || null }))} />
            {!form.photo && item?.photo_url && (
              <img src={item.photo_url} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }} />
            )}
          </div>
        </div>

        {saveError && (
          <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', color: '#FCA5A5', fontSize: '13px' }}>
            {saveError}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', justifyContent: 'flex-start' }}>
          <button className="glass-btn glass-btn-primary" onClick={save} disabled={saving || !form.name.trim() || !form.price}>
            <CheckIcon style={{ width: 15, height: 15 }} /> {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          <button className="glass-btn" onClick={onClose}>إلغاء</button>
        </div>
      </div>
    </div>
  )
}

export default function VenueMenuPage() {
  const { slug: rawSlug } = useParams()
  const slug = rawSlug?.replace(/^item-/, '') || rawSlug
  const [venue, setVenue] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('appetizers')
  const [modal, setModal] = useState(null) // null | { item: null|obj }
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([getOwnerVenues(), getVenueMenu(slug)])
      .then(([vRes, mRes]) => {
        const venues = vRes.data?.data ?? vRes.data
        const list = Array.isArray(venues) ? venues : (venues?.results ?? [])
        setVenue(list.find(v => v.slug === slug) || null)
        const mData = mRes.data?.data ?? mRes.data
        setItems(Array.isArray(mData) ? mData : (mData?.results ?? []))
      })
      .finally(() => setLoading(false))
  }, [slug])

  function copyShareLink() {
    if (!venue?.share_token) return
    const link = `${SHARE_BASE}/${venue.share_token}`
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function handleSave(saved, isEdit) {
    if (isEdit) {
      setItems(prev => prev.map(i => i.id === saved.id ? saved : i))
    } else {
      setItems(prev => [...prev, saved])
    }
  }

  async function handleDelete(id) {
    try {
      await deleteMenuItem(slug, id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch {}
  }

  const tabItems = items.filter(i => i.category === activeTab)

  if (loading) {
    return (
      <div className="owner-page">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 14 }} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="owner-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
            قائمة الطعام — {venue?.name_ar || venue?.name || slug}
          </h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>أضف وعدّل أصناف قائمة الطعام</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="glass-btn"
            onClick={copyShareLink}
            style={copied ? { borderColor: 'rgba(52,211,153,0.4)', color: '#34D399' } : {}}
          >
            <LinkIcon style={{ width: 15, height: 15 }} />
            {copied ? 'تم النسخ!' : 'نسخ رابط القاعة'}
          </button>
          <button className="glass-btn glass-btn-primary" onClick={() => setModal({ item: null })}>
            <PlusIcon style={{ width: 15, height: 15 }} /> إضافة صنف
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-tabs" style={{ marginBottom: '24px' }}>
        {MENU_CATS.map(c => (
          <button key={c.key} className={`glass-tab ${activeTab === c.key ? 'active' : ''}`} onClick={() => setActiveTab(c.key)}>
            {c.label}
            {items.filter(i => i.category === c.key).length > 0 && (
              <span style={{ marginRight: '6px', fontSize: '11px', background: 'rgba(124,58,237,0.3)', padding: '1px 7px', borderRadius: '20px' }}>
                {items.filter(i => i.category === c.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {tabItems.length === 0 ? (
        <div className="glass-card" style={{ padding: '50px 30px', textAlign: 'center' }}>
          <PhotoIcon style={{ width: 40, height: 40, color: 'rgba(255,255,255,0.2)', marginBottom: '12px' }} />
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', marginBottom: '16px' }}>لا توجد أصناف في هذا القسم</div>
          <button className="glass-btn glass-btn-primary" onClick={() => setModal({ item: null })}>
            <PlusIcon style={{ width: 14, height: 14 }} /> إضافة أول صنف
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
          {tabItems.map(item => (
            <MenuItemCard key={item.id} item={item} onDelete={handleDelete} onEdit={i => setModal({ item: i })} />
          ))}
        </div>
      )}

      {modal && (
        <AddEditModal
          slug={slug}
          activeTab={activeTab}
          item={modal.item}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
