import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CheckIcon, XMarkIcon, PhotoIcon, TrashIcon, PlusIcon,
  ArrowRightIcon, VideoCameraIcon, WrenchScrewdriverIcon, QueueListIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import Modal from '../../components/Modal'
import {
  getOwnerVenueDetail,
  updateVenue, deleteVenue,
  uploadVenuePhoto, deleteVenuePhoto,
  uploadVenueVideo, deleteVenueVideo,
  getVenueServices, createVenueService, deleteVenueService,
  getVenueMenu, createMenuItem, updateMenuItem, deleteMenuItem,
  fmtIQD,
} from '../../lib/ownerApi'

const VENUE_TYPES = [
  ['wedding_hall', 'قاعة أفراح'], ['conference_center', 'مركز مؤتمرات'],
  ['restaurant', 'مطعم'], ['garden', 'حديقة'], ['hotel_ballroom', 'قاعة فندقية'],
  ['rooftop', 'سطح مفتوح'], ['outdoor_venue', 'قاعة خارجية'],
  ['community_hall', 'قاعة مجتمع'], ['other', 'أخرى'],
]

const MENU_CATS = [
  { key: 'appetizers', label: 'المقبلات' },
  { key: 'mains', label: 'الأطباق الرئيسية' },
  { key: 'desserts', label: 'الحلويات' },
  { key: 'drinks', label: 'المشروبات' },
]

const TABS = [
  { key: 'info', label: 'المعلومات الأساسية', Icon: WrenchScrewdriverIcon },
  { key: 'media', label: 'الصور والفيديو', Icon: PhotoIcon },
  { key: 'services', label: 'الخدمات', Icon: WrenchScrewdriverIcon },
  { key: 'menu', label: 'القائمة', Icon: QueueListIcon },
]

// ── Tab 1: Basic Info ─────────────────────────────────────────────────────────
function InfoTab({ slug }) {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getOwnerVenueDetail(slug)
      .then(res => {
        const d = res.data?.data ?? res.data
        setForm({
          name: d.name || '',
          name_ar: d.name_ar || '',
          venue_type: d.venue_type || 'wedding_hall',
          city: d.city || '',
          address: d.address_ar || d.address || '',
          description: d.description_ar || d.description || '',
          min_capacity: d.min_capacity || 50,
          max_capacity: d.max_capacity || 300,
          base_price_iqd: d.base_price_iqd || 0,
        })
      })
      .catch(err => {
        setError(err.response?.data?.error?.message || err.response?.data?.detail || 'فشل تحميل بيانات القاعة')
      })
      .finally(() => setLoading(false))
  }, [slug])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const formData = {
        name: form.name,
        name_ar: form.name_ar,
        venue_type: form.venue_type,
        city: form.city,
        address_ar: form.address,
        description_ar: form.description,
        min_capacity: +form.min_capacity,
        max_capacity: +form.max_capacity,
        base_price_iqd: +form.base_price_iqd,
      }
      await updateVenue(slug, formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.detail || 'فشل الحفظ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />
  if (!form) return <ErrorMsg msg={error || 'فشل التحميل'} />

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label className="glass-label">اسم القاعة (عربي)</label>
          <input className="glass-input" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} placeholder="مثال: قاعة النخيل" />
        </div>
        <div>
          <label className="glass-label">اسم القاعة (إنجليزي)</label>
          <input className="glass-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Al-Nakheel Hall" dir="ltr" />
        </div>
        <div>
          <label className="glass-label">نوع القاعة</label>
          <select className="glass-select" value={form.venue_type} onChange={e => setForm(f => ({ ...f, venue_type: e.target.value }))}>
            {VENUE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="glass-label">المدينة</label>
          <input className="glass-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="glass-label">العنوان</label>
          <input className="glass-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="glass-label">الوصف</label>
          <textarea className="glass-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ minHeight: '100px' }} />
        </div>
        <div>
          <label className="glass-label">السعة الدنيا</label>
          <input className="glass-input" type="number" min={1} value={form.min_capacity} onChange={e => setForm(f => ({ ...f, min_capacity: e.target.value }))} dir="ltr" />
        </div>
        <div>
          <label className="glass-label">السعة القصوى</label>
          <input className="glass-input" type="number" min={1} value={form.max_capacity} onChange={e => setForm(f => ({ ...f, max_capacity: e.target.value }))} dir="ltr" />
        </div>
        <div>
          <label className="glass-label">السعر الأساسي (د.ع / اليوم)</label>
          <input className="glass-input" type="number" min={0} value={form.base_price_iqd} onChange={e => setForm(f => ({ ...f, base_price_iqd: e.target.value }))} dir="ltr" />
        </div>
      </div>

      {error && <ErrorMsg msg={error} />}

      <button type="submit" disabled={saving} className="glass-btn glass-btn-primary" style={{ alignSelf: 'flex-start', minWidth: 140 }}>
        {saving ? 'جاري الحفظ...' : saved ? <><CheckIcon style={{ width: 15, height: 15 }} /> تم الحفظ!</> : <><CheckIcon style={{ width: 15, height: 15 }} /> حفظ التغييرات</>}
      </button>
    </form>
  )
}

// ── Tab 2: Photos & Video ─────────────────────────────────────────────────────
function MediaTab({ slug }) {
  const [images, setImages] = useState([])
  const [video, setVideo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [photoProgress, setPhotoProgress] = useState(null)
  const [videoProgress, setVideoProgress] = useState(null)
  const photoRef = useRef()
  const videoRef = useRef()

  useEffect(() => {
    getOwnerVenueDetail(slug)
      .then(res => {
        const d = res.data?.data ?? res.data
        setImages(d.images || [])
        setVideo(d.video_url || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug])

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setPhotoProgress(0)
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData()
      fd.append('image', files[i])
      try {
        const res = await uploadVenuePhoto(slug, fd)
        const img = res.data?.data ?? res.data
        setImages(prev => [...prev, img])
      } catch { /* skip failed uploads */ }
      setPhotoProgress(Math.round(((i + 1) / files.length) * 100))
    }
    setPhotoProgress(null)
    e.target.value = ''
  }

  async function handleDeletePhoto(imgId) {
    if (!confirm('هل تريد حذف هذه الصورة؟')) return
    try {
      await deleteVenuePhoto(slug, imgId)
      setImages(prev => prev.filter(i => i.id !== imgId))
    } catch { /* noop */ }
  }

  async function handleVideoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setVideoProgress(0)
    const fd = new FormData()
    fd.append('video', file)
    try {
      await uploadVenueVideo(slug, fd)
      setVideoProgress(100)
      setVideo('pending')
      setTimeout(() => setVideoProgress(null), 1500)
    } catch {
      setVideoProgress(null)
    }
    e.target.value = ''
  }

  async function handleDeleteVideo() {
    if (!confirm('هل تريد حذف الفيديو؟')) return
    try {
      await deleteVenueVideo(slug)
      setVideo(null)
    } catch { /* noop */ }
  }

  const getImageUrl = (img) => {
    if (!img) return ''
    if (typeof img === 'string') return img
    const url = img.full_url || img.image_url || img.card_url || img.thumbnail_url || img.url || img.image || ''
    if (url && !url.startsWith('http')) return `https://evento-media-iq.s3.eu-north-1.amazonaws.com/${url}`
    return url
  }

  if (loading) return <Spinner />

  return (
    <div>
      {/* Photos */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>الصور ({images.length})</h3>
          <button className="glass-btn glass-btn-sm glass-btn-primary" onClick={() => photoRef.current?.click()}>
            <PlusIcon style={{ width: 13, height: 13 }} /> إضافة صور
          </button>
          <input ref={photoRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoUpload} />
        </div>

        {photoProgress !== null && (
          <ProgressBar pct={photoProgress} label="جاري رفع الصور..." />
        )}

        {images.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
            <PhotoIcon style={{ width: 40, height: 40, marginBottom: '10px', opacity: 0.4 }} />
            <div>لا توجد صور بعد</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {images.map(img => (
              <div key={img.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/3', background: 'rgba(255,255,255,0.05)' }}>
                {getImageUrl(img) && <img src={getImageUrl(img)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e) => { e.target.style.display = 'none' }} />}
                <button
                  onClick={() => handleDeletePhoto(img.id)}
                  style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: '#F87171', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <XMarkIcon style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>الفيديو</h3>
          <button className="glass-btn glass-btn-sm glass-btn-primary" onClick={() => videoRef.current?.click()}>
            <VideoCameraIcon style={{ width: 13, height: 13 }} /> رفع فيديو
          </button>
          <input ref={videoRef} type="file" accept="video/*" hidden onChange={handleVideoUpload} />
        </div>

        {videoProgress !== null && <ProgressBar pct={videoProgress} label="جاري رفع الفيديو..." />}

        {video && video !== 'pending' ? (
          <div style={{ position: 'relative' }}>
            <video src={video} controls style={{ width: '100%', borderRadius: '14px', background: '#000', maxHeight: '340px', display: 'block' }} />
            <button
              onClick={handleDeleteVideo}
              className="glass-btn glass-btn-sm glass-btn-danger"
              style={{ marginTop: '10px' }}
            >
              <TrashIcon style={{ width: 13, height: 13 }} /> حذف الفيديو
            </button>
          </div>
        ) : video === 'pending' ? (
          <div style={{ padding: '20px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '12px', color: '#FBBF24', fontSize: '13px' }}>
            تم رفع الفيديو — قيد المراجعة من الإدارة
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
            <VideoCameraIcon style={{ width: 40, height: 40, marginBottom: '10px', opacity: 0.4 }} />
            <div>لا يوجد فيديو بعد</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab 3: Services ───────────────────────────────────────────────────────────
function ServicesTab({ slug }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', type: 'included', price: '' })
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    getVenueServices(slug)
      .then(res => {
        const d = res.data?.data ?? res.data
        setServices(Array.isArray(d) ? d : (d?.results ?? []))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [slug])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await createVenueService(slug, {
        name: form.name,
        is_included: form.type === 'included',
        is_paid: form.type === 'paid',
        price: form.type === 'paid' ? +form.price : null,
      })
      setForm({ name: '', type: 'included', price: '' })
      setShowForm(false)
      load()
    } catch { /* noop */ }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('حذف هذه الخدمة؟')) return
    try {
      await deleteVenueService(slug, id)
      setServices(prev => prev.filter(s => s.id !== id))
    } catch { /* noop */ }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>الخدمات ({services.length})</h3>
        <button className="glass-btn glass-btn-sm glass-btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? <><XMarkIcon style={{ width: 13, height: 13 }} /> إغلاق</> : <><PlusIcon style={{ width: 13, height: 13 }} /> إضافة خدمة</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '20px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="glass-label">اسم الخدمة</label>
            <input className="glass-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: موقف سيارات" required />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[['included', 'مشمول'], ['paid', 'مدفوع']].map(([v, l]) => (
              <button
                key={v} type="button"
                onClick={() => setForm(f => ({ ...f, type: v }))}
                className={`glass-btn glass-btn-sm${form.type === v ? ' glass-btn-primary' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {l}
              </button>
            ))}
          </div>
          {form.type === 'paid' && (
            <div>
              <label className="glass-label">السعر (د.ع)</label>
              <input className="glass-input" type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} dir="ltr" required />
            </div>
          )}
          <button type="submit" disabled={saving} className="glass-btn glass-btn-primary" style={{ alignSelf: 'flex-start' }}>
            {saving ? 'جاري الإضافة...' : <><CheckIcon style={{ width: 14, height: 14 }} /> إضافة</>}
          </button>
        </form>
      )}

      {services.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.35)' }}>لا توجد خدمات بعد</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {services.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '13px 16px' }}>
              <span style={{ flex: 1, fontSize: '14px', color: 'rgba(255,255,255,0.85)' }}>{s.name}</span>
              {s.is_included && <span style={{ fontSize: '12px', fontWeight: 700, color: '#34D399', background: 'rgba(52,211,153,0.12)', padding: '2px 10px', borderRadius: '20px' }}>مشمول</span>}
              {s.is_paid && <span style={{ fontSize: '13px', fontWeight: 700, color: '#FBBF24' }}>{fmtIQD(s.price)}</span>}
              <button onClick={() => handleDelete(s.id)} className="glass-btn glass-btn-sm glass-btn-danger">
                <TrashIcon style={{ width: 13, height: 13 }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab 4: Menu ───────────────────────────────────────────────────────────────
function MenuTab({ slug }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('appetizers')
  const [modal, setModal] = useState(null)
  const [showMenu, setShowMenu] = useState(false)
  const [toggling, setToggling] = useState(false)

  function load() {
    setLoading(true)
    Promise.all([
      getVenueMenu(slug),
      getOwnerVenueDetail(slug),
    ]).then(([menuRes, venueRes]) => {
      const d = menuRes.data?.data ?? menuRes.data
      setItems(Array.isArray(d) ? d : (d?.results ?? []))
      const venue = venueRes.data?.data ?? venueRes.data
      setShowMenu(venue?.show_menu_on_page ?? false)
    }).finally(() => setLoading(false))
  }

  async function handleToggleShowMenu() {
    setToggling(true)
    try {
      await updateVenue(slug, { show_menu_on_page: !showMenu })
      setShowMenu(prev => !prev)
    } catch { /* noop */ }
    setToggling(false)
  }

  useEffect(() => { load() }, [slug])

  async function handleDelete(id) {
    if (!confirm('حذف هذا الصنف؟')) return
    try {
      await deleteMenuItem(slug, id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch { /* noop */ }
  }

  function handleSave(saved, isEdit) {
    if (isEdit) setItems(prev => prev.map(i => i.id === saved.id ? saved : i))
    else setItems(prev => [...prev, saved])
  }

  const tabItems = items.filter(i => i.category === activeTab)

  if (loading) return <Spinner />

  return (
    <div>
      {/* Show menu on public page toggle */}
      <div style={{ marginBottom: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>عرض القائمة في الصفحة العامة</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>يتيح لزوار صفحة القاعة رؤية قائمة الطعام</div>
        </div>
        <button
          dir="ltr"
          onClick={handleToggleShowMenu}
          disabled={toggling}
          style={{
            width: 50, height: 28, borderRadius: 14, flexShrink: 0,
            background: showMenu ? '#7C3AED' : 'rgba(255,255,255,0.12)',
            border: showMenu ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(255,255,255,0.15)',
            cursor: toggling ? 'not-allowed' : 'pointer',
            position: 'relative', transition: 'background 0.25s, border 0.25s',
            opacity: toggling ? 0.6 : 1,
          }}
        >
          <div style={{
            position: 'absolute', top: 3,
            left: showMenu ? 25 : 3,
            width: 22, height: 22, borderRadius: '50%',
            background: '#fff', transition: 'left 0.25s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
          }} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>قائمة الطعام ({items.length})</h3>
        <button className="glass-btn glass-btn-sm glass-btn-primary" onClick={() => setModal({ item: null })}>
          <PlusIcon style={{ width: 13, height: 13 }} /> إضافة صنف
        </button>
      </div>

      <div className="glass-tabs" style={{ marginBottom: '20px' }}>
        {MENU_CATS.map(c => (
          <button key={c.key} className={`glass-tab${activeTab === c.key ? ' active' : ''}`} onClick={() => setActiveTab(c.key)}>
            {c.label}
            {items.filter(i => i.category === c.key).length > 0 && (
              <span style={{ marginRight: '6px', fontSize: '11px', background: 'rgba(124,58,237,0.3)', padding: '1px 6px', borderRadius: '10px' }}>
                {items.filter(i => i.category === c.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tabItems.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
          لا توجد أصناف في هذا القسم
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
          {tabItems.map(item => {
            const photoUrl = item.photo_url || item.photo || item.image_url || ''
            return (
              <div key={item.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', overflow: 'hidden' }}>
                {photoUrl ? (
                  <img src={photoUrl} alt={item.name_ar || item.name} style={{ width: '100%', height: '110px', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '60px', background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <QueueListIcon style={{ width: 20, height: 20, opacity: 0.4 }} />
                  </div>
                )}
                <div style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>{item.name_ar || item.name}</div>
                  {item.service_price_iqd && <div style={{ fontSize: '13px', fontWeight: 700, color: '#A78BFA', marginBottom: '8px' }}>{fmtIQD(item.service_price_iqd)}</div>}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setModal({ item })} className="glass-btn glass-btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: '12px' }}>تعديل</button>
                    <button onClick={() => handleDelete(item.id)} className="glass-btn glass-btn-sm glass-btn-danger">
                      <TrashIcon style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <MenuModal
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

// ── Menu Item Modal ───────────────────────────────────────────────────────────
function MenuModal({ slug, activeTab, item, onSave, onClose }) {
  const isEdit = !!item
  const [form, setForm] = useState({
    name: item?.name_ar || item?.name || '',
    description: item?.description_ar || item?.description || '',
    price: item?.service_price_iqd ? String(Math.round(Number(item.service_price_iqd))) : '',
    photo: null,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const photoRef = useRef()

  async function save() {
    if (!form.name.trim() || !form.price) return
    setSaving(true)
    setError('')
    const priceStr = String(Math.round(Number(form.price)))
    try {
      let res
      if (isEdit) {
        if (form.photo) {
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
      setError(d?.error?.message || d?.detail || 'فشل الحفظ')
    }
    setSaving(false)
  }

  return (
    <Modal isOpen={true} onClose={onClose} title={isEdit ? 'تعديل الصنف' : 'إضافة صنف جديد'} maxWidth="460px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label className="glass-label">اسم الصنف *</label>
          <input className="glass-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: شوربة عدس" />
        </div>
        <div>
          <label className="glass-label">السعر (د.ع) *</label>
          <input className="glass-input" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} dir="ltr" />
        </div>
        <div>
          <label className="glass-label">الوصف</label>
          <input className="glass-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
        <div>
          <label className="glass-label">صورة الصنف</label>
          <button className="glass-btn glass-btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => photoRef.current?.click()}>
            <PhotoIcon style={{ width: 13, height: 13 }} /> {form.photo ? form.photo.name : 'اختر صورة'}
          </button>
          <input ref={photoRef} type="file" accept="image/*" hidden onChange={e => setForm(f => ({ ...f, photo: e.target.files[0] || null }))} />
          {!form.photo && item?.photo_url && (
            <img src={item.photo_url} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', marginTop: '8px' }} />
          )}
        </div>
      </div>

      {error && <ErrorMsg msg={error} />}

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button className="glass-btn" onClick={onClose} style={{ flex: 1 }}>إلغاء</button>
        <button className="glass-btn glass-btn-primary" onClick={save} disabled={saving || !form.name.trim() || !form.price} style={{ flex: 1 }}>
          {saving ? 'جاري الحفظ...' : <><CheckIcon style={{ width: 14, height: 14 }} /> حفظ</>}
        </button>
      </div>
    </Modal>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7C3AED', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
    </div>
  )
}

function DeleteVenueModal({ slug, onClose, onDeleted }) {
  const [step, setStep] = useState(1)
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')
    try {
      await deleteVenue(slug)
      onDeleted()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'حدث خطأ، يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#1a1035', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: '32px 28px', maxWidth: 440, width: '100%' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Warning icon + title */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <ExclamationTriangleIcon style={{ width: 48, height: 48, marginBottom: 12, color: '#FCA5A5' }} />
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#FCA5A5' }}>تحذير: حذف القاعة نهائياً</h3>
        </div>

        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, textAlign: 'center', marginBottom: 24 }}>
          هذا الإجراء لا يمكن التراجع عنه. سيتم حذف القاعة وجميع بياناتها بشكل نهائي بما في ذلك الصور والحجوزات والقائمة.
        </p>

        {step === 1 && (
          <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
            <button
              onClick={() => setStep(2)}
              style={{ padding: '12px', borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}
            >
              متابعة الحذف
            </button>
            <button
              onClick={onClose}
              style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}
            >
              إلغاء
            </button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block' }}>
              للتأكيد، اكتب كلمة <span style={{ color: '#FCA5A5', fontFamily: 'monospace' }}>EVENTO</span> أدناه
            </label>
            <input
              dir="ltr"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="EVENTO"
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#fff', fontSize: 15, fontFamily: 'monospace', outline: 'none', letterSpacing: 2 }}
            />
            {error && <div style={{ fontSize: 13, color: '#FCA5A5' }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleDelete}
                disabled={confirm !== 'EVENTO' || loading}
                style={{ flex: 1, padding: '12px', borderRadius: 12, background: confirm === 'EVENTO' ? '#DC2626' : 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', color: confirm === 'EVENTO' ? '#fff' : 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 15, cursor: confirm === 'EVENTO' && !loading ? 'pointer' : 'not-allowed', fontFamily: 'Cairo, sans-serif', transition: 'all 0.2s' }}
              >
                {loading ? 'جاري الحذف...' : 'حذف نهائياً'}
              </button>
              <button
                onClick={onClose}
                style={{ padding: '12px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ErrorMsg({ msg }) {
  return (
    <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '10px', color: '#FCA5A5', fontSize: '13px' }}>
      {msg}
    </div>
  )
}

function ProgressBar({ pct, label }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>{label} {pct}%</div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#7C3AED', borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EditVenuePage() {
  const { slug: rawSlug } = useParams()
  const slug = rawSlug?.replace(/^item-/, '') || rawSlug
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('info')
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteToast, setDeleteToast] = useState(false)

  function handleDeleted() {
    setDeleteModal(false)
    setDeleteToast(true)
    setTimeout(() => navigate('/owner/venues'), 1800)
  }

  return (
    <div className="owner-page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/owner/venues')} className="glass-btn glass-btn-sm">
          <ArrowRightIcon style={{ width: 15, height: 15 }} />
        </button>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>تعديل القاعة</h1>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '3px 0 0' }}>{slug}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-tabs" style={{ marginBottom: '28px', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`glass-tab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass-card-static" style={{ padding: '28px' }}>
        {activeTab === 'info'     && <InfoTab slug={slug} />}
        {activeTab === 'media'    && <MediaTab slug={slug} />}
        {activeTab === 'services' && <ServicesTab slug={slug} />}
        {activeTab === 'menu'     && <MenuTab slug={slug} />}
      </div>

      {/* Delete zone */}
      <div style={{ marginTop: 40, padding: '24px 28px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#FCA5A5', marginBottom: 4 }}>منطقة الخطر</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>حذف القاعة يزيل جميع البيانات المرتبطة بها بشكل نهائي.</div>
        </div>
        <button
          onClick={() => setDeleteModal(true)}
          style={{ padding: '10px 22px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#FCA5A5', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <TrashIcon style={{ width: 16, height: 16 }} />
          حذف القاعة
        </button>
      </div>

      {deleteModal && (
        <DeleteVenueModal
          slug={slug}
          onClose={() => setDeleteModal(false)}
          onDeleted={handleDeleted}
        />
      )}

      {deleteToast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: '#065F46', border: '1px solid #34D399', borderRadius: 12, padding: '14px 28px', color: '#fff', fontWeight: 700, fontSize: 15, zIndex: 9999, fontFamily: 'Cairo, sans-serif' }}>
          <CheckIcon style={{ width: 20, height: 20, display: 'inline', verticalAlign: 'middle', marginLeft: 8 }} /> تم حذف القاعة بنجاح
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
