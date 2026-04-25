import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVenueDetail } from '../../lib/api'
import { createVenue, updateVenue } from '../../lib/ownerApi'

const CITIES = ['Baghdad', 'Erbil', 'Basra', 'Mosul', 'Najaf', 'Karbala', 'Sulaymaniyah', 'Kirkuk']
const VENUE_TYPES = [
  ['wedding_hall', 'قاعة أفراح'], ['conference_center', 'مركز مؤتمرات'], ['restaurant', 'مطعم'],
  ['garden', 'حديقة'], ['hotel_ballroom', 'قاعة فندقية'], ['rooftop', 'سطح مفتوح'],
  ['outdoor_venue', 'قاعة خارجية'], ['community_hall', 'قاعة مجتمع'], ['other', 'أخرى'],
]
const AMENITIES_LIST = [
  { key: 'parking', label: 'مواقف سيارات' }, { key: 'catering', label: 'تقديم طعام' },
  { key: 'sound_system', label: 'نظام صوتي' }, { key: 'lighting', label: 'إضاءة احترافية' },
  { key: 'air_conditioning', label: 'تكييف هواء' }, { key: 'stage', label: 'منصة عرض' },
  { key: 'projector', label: 'جهاز عرض' }, { key: 'decoration', label: 'خدمات ديكور' },
  { key: 'security', label: 'أفراد أمن' }, { key: 'photographer', label: 'مصور' },
  { key: 'valet', label: 'خدمة صف سيارات' }, { key: 'wifi', label: 'واي فاي' },
]
const STEPS = ['المعلومات الأساسية', 'السعة والتسعير', 'المرافق', 'الإعدادات']

const empty = {
  name: '', name_ar: '', description_ar: '', venue_type: 'wedding_hall',
  city: 'Baghdad', address_ar: '', min_capacity: 50, max_capacity: 300,
  base_price_iqd: 1000000, amenities: [], cancellation_policy: '',
  status: 'active', is_published: false,
}

export default function VenueForm() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const isEdit = !!slug

  const [step, setStep] = useState(0)
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEdit)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    getVenueDetail(slug)
      .then((res) => {
        const d = res.data?.data ?? res.data
        setForm({
          name: d.name || '', name_ar: d.name_ar || '',
          description_ar: d.description_ar || d.description || '',
          venue_type: d.venue_type || 'wedding_hall',
          city: d.city || 'Baghdad', address_ar: d.address_ar || d.address || '',
          min_capacity: d.min_capacity || 50, max_capacity: d.max_capacity || 300,
          base_price_iqd: d.base_price_iqd || 1000000,
          amenities: Array.isArray(d.amenities) ? d.amenities : [],
          cancellation_policy: d.cancellation_policy || '',
          status: d.status || 'active', is_published: !!d.is_published,
        })
      })
      .finally(() => setFetchLoading(false))
  }, [slug, isEdit])

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function toggleAmenity(key) {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter(a => a !== key)
        : [...f.amenities, key],
    }))
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      if (isEdit) {
        await updateVenue(slug, form)
      } else {
        await createVenue(form)
      }
      navigate('/owner/venues')
    } catch (err) {
      const d = err.response?.data
      setError(
        d?.error?.message || d?.detail ||
        Object.values(d || {}).flat().join(' · ') ||
        'حدث خطأ، يرجى المحاولة مجدداً'
      )
    } finally {
      setLoading(false)
    }
  }

  if (fetchLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
      <div className="skeleton" style={{ width: 400, height: 500, borderRadius: 20 }} />
    </div>
  )

  return (
    <div className="owner-page" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
          {isEdit ? 'تعديل القاعة' : 'إضافة قاعة جديدة'}
        </h1>
      </div>

      {/* Step indicator */}
      <div className="glass-tabs" style={{ marginBottom: '24px' }}>
        {STEPS.map((s, i) => (
          <button key={s} className={`glass-tab${step === i ? ' active' : ''}`} onClick={() => i < step && setStep(i)}>
            <span style={{ marginLeft: '6px', opacity: 0.5 }}>{i + 1}</span> {s}
          </button>
        ))}
      </div>

      <div className="glass-card-static" style={{ padding: '28px' }}>
        {step === 0 && (
          <Step1 form={form} set={set} />
        )}
        {step === 1 && (
          <Step2 form={form} set={set} />
        )}
        {step === 2 && (
          <Step3 form={form} toggleAmenity={toggleAmenity} />
        )}
        {step === 3 && (
          <Step4 form={form} set={set} />
        )}

        {error && (
          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '12px', color: '#F87171', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'space-between' }}>
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/owner/venues')}
            className="glass-btn"
          >
            {step === 0 ? '✕ إلغاء' : '→ السابق'}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} className="glass-btn glass-btn-primary">
              التالي ←
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="glass-btn glass-btn-primary">
              {loading ? 'جاري الحفظ...' : isEdit ? '💾 حفظ التغييرات' : '✅ إنشاء القاعة'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label className="glass-label">{label}</label>
      {children}
    </div>
  )
}

function Step1({ form, set }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="الاسم بالعربية">
          <input className="glass-input" value={form.name_ar} onChange={e => set('name_ar', e.target.value)} placeholder="اسم القاعة بالعربية" />
        </Field>
        <Field label="الاسم بالإنجليزية">
          <input className="glass-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Venue name in English" dir="ltr" />
        </Field>
      </div>
      <Field label="نوع القاعة">
        <select className="glass-select" value={form.venue_type} onChange={e => set('venue_type', e.target.value)}>
          {VENUE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="المدينة">
          <select className="glass-select" value={form.city} onChange={e => set('city', e.target.value)}>
            {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="العنوان التفصيلي">
          <input className="glass-input" value={form.address_ar} onChange={e => set('address_ar', e.target.value)} placeholder="الحي، الشارع..." />
        </Field>
      </div>
      <Field label="وصف القاعة">
        <textarea className="glass-textarea" value={form.description_ar} onChange={e => set('description_ar', e.target.value)} placeholder="اكتب وصفاً جذاباً للقاعة..." style={{ minHeight: '100px' }} />
      </Field>
    </div>
  )
}

function Step2({ form, set }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Field label="الحد الأدنى للضيوف">
          <input className="glass-input" type="number" min={1} value={form.min_capacity} onChange={e => set('min_capacity', +e.target.value)} />
        </Field>
        <Field label="الحد الأقصى للضيوف">
          <input className="glass-input" type="number" min={1} value={form.max_capacity} onChange={e => set('max_capacity', +e.target.value)} />
        </Field>
      </div>
      <Field label="السعر الأساسي (د.ع)">
        <input className="glass-input" type="number" min={0} value={form.base_price_iqd} onChange={e => set('base_price_iqd', +e.target.value)} dir="ltr" />
      </Field>
      <Field label="سياسة الإلغاء">
        <textarea className="glass-textarea" value={form.cancellation_policy} onChange={e => set('cancellation_policy', e.target.value)} placeholder="اكتب شروط الإلغاء واسترداد المبلغ..." />
      </Field>
    </div>
  )
}

function Step3({ form, toggleAmenity }) {
  return (
    <div>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px' }}>
        اختر المرافق والخدمات المتوفرة في قاعتك
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
        {AMENITIES_LIST.map(({ key, label }) => {
          const active = form.amenities.includes(key)
          return (
            <button
              key={key}
              onClick={() => toggleAmenity(key)}
              style={{
                padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                border: active ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.1)',
                background: active ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                color: active ? '#A78BFA' : 'rgba(255,255,255,0.6)',
                fontSize: '13px', fontWeight: 600, transition: 'all 0.2s',
                textAlign: 'right', fontFamily: 'Cairo, sans-serif',
              }}
            >
              {active ? '✓ ' : ''}{label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Step4({ form, set }) {
  return (
    <div>
      <Field label="حالة القاعة">
        <select className="glass-select" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="active">نشطة</option>
          <option value="inactive">غير نشطة</option>
        </select>
      </Field>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px', borderRadius: '14px',
        background: form.is_published ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${form.is_published ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.08)'}`,
        cursor: 'pointer', transition: 'all 0.2s',
      }} onClick={() => set('is_published', !form.is_published)}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>نشر القاعة</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
            {form.is_published ? 'القاعة ظاهرة للمستخدمين (تتطلب موافقة الإدارة)' : 'القاعة مخفية عن المستخدمين'}
          </div>
        </div>
        <div style={{
          width: 46, height: 26, borderRadius: 13,
          background: form.is_published ? '#7C3AED' : 'rgba(255,255,255,0.12)',
          position: 'relative', transition: 'background 0.3s',
        }}>
          <div style={{
            position: 'absolute', top: 3, borderRadius: '50%',
            width: 20, height: 20, background: 'white',
            right: form.is_published ? 3 : 23, transition: 'right 0.3s',
          }} />
        </div>
      </div>

      {/* Summary */}
      <div style={{ marginTop: '20px', padding: '16px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>ملخص القاعة</div>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 2 }}>
          <div>🏛️ {form.name_ar || form.name || '—'}</div>
          <div>📍 {form.city} · {form.address_ar || '—'}</div>
          <div>👥 {form.min_capacity} – {form.max_capacity} ضيف</div>
          <div>💰 {form.base_price_iqd?.toLocaleString('ar-IQ')} د.ع</div>
          <div>✅ {form.amenities.length} مرفق محدد</div>
        </div>
      </div>
    </div>
  )
}
