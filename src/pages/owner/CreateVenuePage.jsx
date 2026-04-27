import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckIcon, PhotoIcon, VideoCameraIcon, PlusIcon, XMarkIcon,
  TrashIcon, PencilIcon, ArrowRightIcon, ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import {
  createVenue, uploadVenuePhoto, deleteVenuePhoto, uploadVenueVideo,
  createVenueService, deleteVenueService,
  createMenuItem, deleteMenuItem, fmtIQD,
} from '../../lib/ownerApi'

const STEPS = ['المعلومات الأساسية', 'الصور والفيديو', 'الخدمات', 'القائمة']

const CITIES = ['بغداد','البصرة','الموصل','أربيل','النجف','كربلاء','السليمانية','كركوك','الأنبار','ديالى','ذي قار','واسط','بابل','صلاح الدين','المثنى','القادسية','ميسان','دهوك','حلبجة']
const VENUE_TYPES = [
  ['wedding_hall','قاعة أفراح'],['conference_center','مركز مؤتمرات'],['restaurant','مطعم'],
  ['garden','حديقة'],['hotel_ballroom','قاعة فندقية'],['rooftop','سطح مفتوح'],
  ['outdoor_venue','قاعة خارجية'],['community_hall','قاعة مجتمع'],['other','أخرى'],
]
const MENU_CATS = [
  { key: 'appetizers', label: 'المقبلات' },
  { key: 'mains', label: 'الأطباق الرئيسية' },
  { key: 'desserts', label: 'الحلويات' },
  { key: 'drinks', label: 'المشروبات' },
]

function StepBar({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '36px' }}>
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: done ? 'rgba(52,211,153,0.25)' : active ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.07)',
                border: `2px solid ${done ? '#34D399' : active ? '#A78BFA' : 'rgba(255,255,255,0.15)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
              }}>
                {done
                  ? <CheckIcon style={{ width: 16, height: 16, color: '#34D399' }} />
                  : <span style={{ fontSize: '13px', fontWeight: 700, color: active ? '#A78BFA' : 'rgba(255,255,255,0.35)' }}>{i + 1}</span>
                }
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 48, height: 2, background: done ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)', margin: '0 8px', marginBottom: '18px' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: Basic Info ───────────────────────────────────────────────────────
function Step1({ form, setForm, onNext, loading }) {
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="glass-label">اسم القاعة *</label>
          <input className="glass-input" value={form.name_ar} onChange={e => set('name_ar', e.target.value)} placeholder="مثال: قاعة الفردوس" />
        </div>
        <div>
          <label className="glass-label">النوع *</label>
          <select className="glass-select" value={form.venue_type} onChange={e => set('venue_type', e.target.value)}>
            {VENUE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="glass-label">المدينة *</label>
          <select className="glass-select" value={form.city} onChange={e => set('city', e.target.value)}>
            <option value="">اختر مدينة</option>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="glass-label">العنوان التفصيلي</label>
          <input className="glass-input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="مثال: شارع الكرادة، قرب دوار الكندي" />
        </div>
        <div>
          <label className="glass-label">الطاقة الاستيعابية الدنيا *</label>
          <input className="glass-input" type="number" min="1" value={form.min_capacity} onChange={e => set('min_capacity', e.target.value)} placeholder="50" />
        </div>
        <div>
          <label className="glass-label">الطاقة الاستيعابية القصوى *</label>
          <input className="glass-input" type="number" min="1" value={form.max_capacity} onChange={e => set('max_capacity', e.target.value)} placeholder="500" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="glass-label">السعر الأساسي (IQD) *</label>
          <input className="glass-input" type="number" min="0" value={form.base_price_iqd} onChange={e => set('base_price_iqd', e.target.value)} placeholder="1000000" />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="glass-label">وصف القاعة</label>
          <textarea className="glass-textarea" rows={4} value={form.description_ar} onChange={e => set('description_ar', e.target.value)} placeholder="اكتب وصفاً موجزاً للقاعة وما تقدمه..." />
        </div>
      </div>
      <button
        className="glass-btn glass-btn-primary"
        style={{ marginTop: '8px', alignSelf: 'flex-end' }}
        onClick={onNext}
        disabled={loading}
      >
        {loading ? 'جاري الحفظ...' : 'التالي'} <ArrowLeftIcon style={{ width: 16, height: 16 }} />
      </button>
    </div>
  )
}

// ── Step 2: Photos & Video ───────────────────────────────────────────────────
function Step2({ slug, images, setImages, video, setVideo, onNext, onBack }) {
  const photoRef = useRef()
  const videoRef = useRef()
  const [uploading, setUploading] = useState(false)
  const [videoUploading, setVideoUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  async function handlePhotos(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    let done = 0
    for (const file of files) {
      if (images.length >= 20) break
      const fd = new FormData()
      fd.append('image', file)
      try {
        const res = await uploadVenuePhoto(slug, fd)
        const img = res.data?.data ?? res.data
        setImages(prev => [...prev, img])
      } catch {}
      done++
      setUploadProgress(Math.round((done / files.length) * 100))
    }
    setUploading(false)
    setUploadProgress(0)
    e.target.value = ''
  }

  async function handleDeletePhoto(imgId) {
    try {
      await deleteVenuePhoto(slug, imgId)
      setImages(prev => prev.filter(i => i.id !== imgId))
    } catch {}
  }

  async function handleVideo(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 200 * 1024 * 1024) { alert('حجم الفيديو يتجاوز 200 ميغابايت'); return }
    setVideoUploading(true)
    const fd = new FormData()
    fd.append('video', file)
    try {
      await uploadVenueVideo(slug, fd)
      setVideo({ name: file.name })
    } catch {}
    setVideoUploading(false)
    e.target.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Photos */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <label className="glass-label" style={{ margin: 0 }}>الصور ({images.length}/20)</label>
          <button className="glass-btn glass-btn-sm" onClick={() => photoRef.current?.click()} disabled={uploading || images.length >= 20}>
            <PlusIcon style={{ width: 14, height: 14 }} /> رفع صور
          </button>
          <input ref={photoRef} type="file" accept="image/*" multiple hidden onChange={handlePhotos} />
        </div>
        {uploading && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${uploadProgress}%`, background: 'linear-gradient(90deg,#7C3AED,#A78BFA)', transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>جاري الرفع... {uploadProgress}%</div>
          </div>
        )}
        {images.length === 0 ? (
          <div
            style={{ border: '2px dashed rgba(255,255,255,0.12)', borderRadius: '16px', padding: '40px', textAlign: 'center', cursor: 'pointer' }}
            onClick={() => photoRef.current?.click()}
          >
            <PhotoIcon style={{ width: 40, height: 40, color: 'rgba(255,255,255,0.25)', marginBottom: '12px' }} />
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>اضغط لرفع الصور (حتى 20 صورة)</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '10px' }}>
            {images.map(img => (
              <div key={img.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/3' }}>
                <img src={img.card_url || img.image_url || img.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  onClick={() => handleDeletePhoto(img.id)}
                  style={{ position: 'absolute', top: 4, left: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(239,68,68,0.85)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <XMarkIcon style={{ width: 12, height: 12, color: '#fff' }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <label className="glass-label" style={{ margin: 0 }}>فيديو القاعة (اختياري، حتى 200MB)</label>
          {!video && (
            <button className="glass-btn glass-btn-sm" onClick={() => videoRef.current?.click()} disabled={videoUploading}>
              <VideoCameraIcon style={{ width: 14, height: 14 }} /> رفع فيديو
            </button>
          )}
          <input ref={videoRef} type="file" accept="video/mp4,video/mpeg" hidden onChange={handleVideo} />
        </div>
        {videoUploading && <div style={{ fontSize: '13px', color: 'rgba(167,139,250,0.9)' }}>جاري رفع الفيديو...</div>}
        {video && (
          <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <VideoCameraIcon style={{ width: 18, height: 18, color: '#34D399' }} />
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', flex: 1 }}>{video.name}</span>
            <CheckIcon style={{ width: 16, height: 16, color: '#34D399' }} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <button className="glass-btn" onClick={onBack}><ArrowRightIcon style={{ width: 16, height: 16 }} /> السابق</button>
        <button className="glass-btn glass-btn-primary" onClick={onNext}>التالي <ArrowLeftIcon style={{ width: 16, height: 16 }} /></button>
      </div>
    </div>
  )
}

// ── Step 3: Services ─────────────────────────────────────────────────────────
function Step3({ slug, services, setServices, onNext, onBack }) {
  const [form, setForm] = useState({ name: '', type: 'included', price: '' })
  const [saving, setSaving] = useState(false)

  async function addService() {
    if (!form.name.trim()) return
    setSaving(true)
    const payload = {
      name: form.name,
      is_included: form.type === 'included',
      is_paid: form.type === 'paid',
      price: form.type === 'paid' ? form.price : null,
    }
    try {
      const res = await createVenueService(slug, payload)
      const svc = res.data?.data ?? res.data
      setServices(prev => [...prev, svc])
      setForm({ name: '', type: 'included', price: '' })
    } catch {}
    setSaving(false)
  }

  async function removeService(id) {
    try {
      await deleteVenueService(slug, id)
      setServices(prev => prev.filter(s => s.id !== id))
    } catch {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <label className="glass-label">اسم الخدمة</label>
        <input className="glass-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: موقف سيارات، واي فاي، نظام صوتي..." />
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className={`glass-btn glass-btn-sm ${form.type === 'included' ? 'glass-btn-primary' : ''}`}
            onClick={() => setForm(f => ({ ...f, type: 'included' }))}
          >
            مجاني / مشمول
          </button>
          <button
            className={`glass-btn glass-btn-sm ${form.type === 'paid' ? 'glass-btn-primary' : ''}`}
            onClick={() => setForm(f => ({ ...f, type: 'paid' }))}
          >
            مدفوع
          </button>
        </div>
        {form.type === 'paid' && (
          <div>
            <label className="glass-label">السعر (IQD)</label>
            <input className="glass-input" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="مثال: 50000" />
          </div>
        )}
        <button className="glass-btn glass-btn-primary" onClick={addService} disabled={saving || !form.name.trim()}>
          <PlusIcon style={{ width: 14, height: 14 }} /> {saving ? 'جاري الإضافة...' : 'إضافة الخدمة'}
        </button>
      </div>

      {services.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {services.map(s => (
            <div key={s.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '14px' }}>{s.name}</span>
              </div>
              <span style={{
                fontSize: '12px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px',
                background: s.is_included ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                color: s.is_included ? '#34D399' : '#FBBF24',
                border: `1px solid ${s.is_included ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)'}`,
              }}>
                {s.is_included ? 'مشمول' : `${fmtIQD(s.price)}`}
              </span>
              <button onClick={() => removeService(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,113,113,0.7)', padding: '4px' }}>
                <TrashIcon style={{ width: 15, height: 15 }} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <button className="glass-btn" onClick={onBack}><ArrowRightIcon style={{ width: 16, height: 16 }} /> السابق</button>
        <button className="glass-btn glass-btn-primary" onClick={onNext}>التالي <ArrowLeftIcon style={{ width: 16, height: 16 }} /></button>
      </div>
    </div>
  )
}

// ── Step 4: Menu ─────────────────────────────────────────────────────────────
function Step4({ slug, menuItems, setMenuItems, onBack, onFinish }) {
  const [activeTab, setActiveTab] = useState('appetizers')
  const [form, setForm] = useState({ name: '', description: '', price: '', photo: null })
  const [saving, setSaving] = useState(false)
  const photoRef = useRef()

  const tabItems = menuItems.filter(i => i.category === activeTab)

  async function addItem() {
    if (!form.name.trim() || !form.price) return
    setSaving(true)
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('name_ar', form.name)
    fd.append('description', form.description)
    fd.append('description_ar', form.description)
    fd.append('category', activeTab)
    fd.append('service_type', 'paid')
    fd.append('service_price_iqd', form.price)
    if (form.photo) fd.append('image', form.photo)
    try {
      const res = await createMenuItem(slug, fd)
      const item = res.data?.data ?? res.data
      setMenuItems(prev => [...prev, item])
      setForm({ name: '', description: '', price: '', photo: null })
    } catch {}
    setSaving(false)
  }

  async function removeItem(id) {
    try {
      await deleteMenuItem(slug, id)
      setMenuItems(prev => prev.filter(i => i.id !== id))
    } catch {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Category tabs */}
      <div className="glass-tabs">
        {MENU_CATS.map(c => (
          <button key={c.key} className={`glass-tab ${activeTab === c.key ? 'active' : ''}`} onClick={() => setActiveTab(c.key)}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Add form */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="glass-label">اسم الصنف *</label>
            <input className="glass-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: شوربة عدس" />
          </div>
          <div>
            <label className="glass-label">السعر (IQD) *</label>
            <input className="glass-input" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="5000" />
          </div>
          <div>
            <label className="glass-label">صورة الصنف</label>
            <button className="glass-btn glass-btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => photoRef.current?.click()}>
              <PhotoIcon style={{ width: 14, height: 14 }} /> {form.photo ? form.photo.name : 'اختر صورة'}
            </button>
            <input ref={photoRef} type="file" accept="image/*" hidden onChange={e => setForm(f => ({ ...f, photo: e.target.files[0] || null }))} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="glass-label">الوصف</label>
            <input className="glass-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف مختصر..." />
          </div>
        </div>
        <button className="glass-btn glass-btn-primary" onClick={addItem} disabled={saving || !form.name.trim() || !form.price}>
          <PlusIcon style={{ width: 14, height: 14 }} /> {saving ? 'جاري الإضافة...' : 'إضافة الصنف'}
        </button>
      </div>

      {/* Items list */}
      {tabItems.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {tabItems.map(item => (
            <div key={item.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
              {item.photo_url && (
                <img src={item.photo_url} alt={item.name} style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
              )}
              <div style={{ padding: '12px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>{item.name_ar || item.name}</div>
                {item.description_ar && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '6px' }}>{item.description_ar}</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#A78BFA' }}>{fmtIQD(item.service_price_iqd)}</span>
                  <button onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,113,113,0.7)' }}>
                    <TrashIcon style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
        <button className="glass-btn" onClick={onBack}><ArrowRightIcon style={{ width: 16, height: 16 }} /> السابق</button>
        <button className="glass-btn glass-btn-primary" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderColor: 'rgba(16,185,129,0.3)' }} onClick={onFinish}>
          <CheckIcon style={{ width: 16, height: 16 }} /> نشر القاعة
        </button>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function CreateVenuePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [basicForm, setBasicForm] = useState({
    name_ar: '', name: '', venue_type: 'wedding_hall', city: '',
    location: '', min_capacity: '', max_capacity: '',
    base_price_iqd: '', description_ar: '', description: '',
  })
  const [createdVenue, setCreatedVenue] = useState(null)
  const [images, setImages] = useState([])
  const [video, setVideo] = useState(null)
  const [services, setServices] = useState([])
  const [menuItems, setMenuItems] = useState([])

  async function handleStep1Next() {
    if (!basicForm.name_ar.trim() || !basicForm.city || !basicForm.min_capacity || !basicForm.max_capacity || !basicForm.base_price_iqd) {
      setError('يرجى تعبئة جميع الحقول الإلزامية (*)'); return
    }
    setError('')
    setLoading(true)
    try {
      const payload = {
        name: basicForm.name_ar,
        name_ar: basicForm.name_ar,
        venue_type: basicForm.venue_type,
        city: basicForm.city,
        location: basicForm.location,
        min_capacity: parseInt(basicForm.min_capacity),
        max_capacity: parseInt(basicForm.max_capacity),
        base_price_iqd: basicForm.base_price_iqd,
        description: basicForm.description_ar,
        description_ar: basicForm.description_ar,
      }
      const res = await createVenue(payload)
      const data = res.data?.data ?? res.data
      setCreatedVenue(data)
      setStep(1)
    } catch (e) {
      const msg = e.response?.data?.error?.message || e.response?.data?.detail || 'حدث خطأ، تحقق من البيانات'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="owner-page">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>إضافة قاعة جديدة</h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>اتبع الخطوات الأربع لإضافة قاعتك</p>
      </div>

      <div className="glass-card" style={{ maxWidth: '680px', margin: '0 auto', padding: '32px' }}>
        <StepBar current={step} />

        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', color: '#FCA5A5', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {step === 0 && <Step1 form={basicForm} setForm={setBasicForm} onNext={handleStep1Next} loading={loading} />}
        {step === 1 && <Step2 slug={createdVenue?.slug} images={images} setImages={setImages} video={video} setVideo={setVideo} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
        {step === 2 && <Step3 slug={createdVenue?.slug} services={services} setServices={setServices} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
        {step === 3 && <Step4 slug={createdVenue?.slug} menuItems={menuItems} setMenuItems={setMenuItems} onBack={() => setStep(2)} onFinish={() => navigate('/owner/venues')} />}
      </div>
    </div>
  )
}
