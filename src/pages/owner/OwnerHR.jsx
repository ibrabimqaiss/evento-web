import { useEffect, useState } from 'react'
import {
  getStaff, createStaffMember, updateStaffMember, deleteStaffMember,
  fmtIQD, fmtDate,
} from '../../lib/ownerApi'

const ROLES = [
  ['manager', 'مدير'], ['waiter', 'نادل'], ['chef', 'طاهي'],
  ['security', 'أمن'], ['cleaner', 'عمال نظافة'], ['photographer', 'مصور'],
  ['decorator', 'مزين'], ['driver', 'سائق'], ['other', 'أخرى'],
]
const EMP_TYPES = [['full_time', 'دوام كامل'], ['part_time', 'دوام جزئي'], ['contract', 'عقد']]
const ROLE_AR = Object.fromEntries(ROLES)
const TYPE_AR = Object.fromEntries(EMP_TYPES)

const empty = { full_name: '', phone: '', role: 'waiter', employment_type: 'full_time', salary: '', join_date: new Date().toISOString().slice(0, 10), notes: '' }

export default function OwnerHR() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')

  function load() {
    setLoading(true)
    getStaff()
      .then(res => {
        const d = res.data?.data ?? res.data
        setStaff(Array.isArray(d) ? d : (d?.results ?? []))
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openAdd() { setForm(empty); setModal('add') }
  function openEdit(s) { setForm({ ...s, salary: s.salary || '' }); setModal(s.id) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (modal === 'add') await createStaffMember({ ...form, salary: +form.salary })
      else await updateStaffMember(modal, { ...form, salary: +form.salary })
      setModal(null)
      load()
    } catch { /* noop */ } finally { setSaving(false) }
  }

  async function handleDeactivate(id) {
    if (!confirm('هل تريد إنهاء خدمة هذا الموظف؟')) return
    await deleteStaffMember(id)
    load()
  }

  const active = staff.filter(s => s.is_active !== false)
  const filtered = typeFilter ? active.filter(s => s.employment_type === typeFilter) : active
  const totalSalaries = active.reduce((s, m) => s + parseFloat(m.salary || 0), 0)

  return (
    <div className="owner-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>الموارد البشرية</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
            {active.length} موظف نشط · إجمالي الرواتب: {fmtIQD(totalSalaries)}
          </p>
        </div>
        <button onClick={openAdd} className="glass-btn glass-btn-primary">➕ إضافة موظف</button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {EMP_TYPES.map(([v, l]) => {
          const count = active.filter(s => s.employment_type === v).length
          return (
            <div key={v} className="glass-card-static" style={{ padding: '16px', cursor: 'pointer' }} onClick={() => setTypeFilter(v === typeFilter ? '' : v)}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{count}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>{l}</div>
            </div>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="glass-tabs" style={{ marginBottom: '20px' }}>
        <button className={`glass-tab${typeFilter === '' ? ' active' : ''}`} onClick={() => setTypeFilter('')}>الكل</button>
        {EMP_TYPES.map(([v, l]) => (
          <button key={v} className={`glass-tab${typeFilter === v ? ' active' : ''}`} onClick={() => setTypeFilter(v)}>{l}</button>
        ))}
      </div>

      <div className="glass-card-static">
        {loading ? (
          <div style={{ padding: '30px' }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8, marginBottom: 8 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '15px' }}>
            لا يوجد موظفون
          </div>
        ) : (
          <div className="glass-table-wrap">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>الدور</th>
                  <th>نوع التوظيف</th>
                  <th>الراتب</th>
                  <th>تاريخ الانضمام</th>
                  <th>الهاتف</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                    <td>{ROLE_AR[s.role] || s.role}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 600,
                        background: s.employment_type === 'full_time' ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)',
                        color: s.employment_type === 'full_time' ? '#34D399' : '#FBBF24',
                        border: `1px solid ${s.employment_type === 'full_time' ? 'rgba(52,211,153,0.3)' : 'rgba(251,191,36,0.3)'}`,
                      }}>
                        {TYPE_AR[s.employment_type] || s.employment_type}
                      </span>
                    </td>
                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{fmtIQD(s.salary)}</td>
                    <td>{fmtDate(s.join_date)}</td>
                    <td style={{ direction: 'ltr' }}>{s.phone || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => openEdit(s)} className="glass-btn glass-btn-sm">✏️</button>
                        <button onClick={() => handleDeactivate(s.id)} className="glass-btn glass-btn-sm glass-btn-danger">إنهاء</button>
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setModal(null)}>
          <div className="glass-card-static" style={{ maxWidth: 500, width: '100%', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: '20px' }}>
              {modal === 'add' ? 'إضافة موظف جديد' : 'تعديل بيانات الموظف'}
            </h3>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="glass-label">الاسم الكامل</label>
                  <input className="glass-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} required />
                </div>
                <div>
                  <label className="glass-label">الدور الوظيفي</label>
                  <select className="glass-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="glass-label">نوع التوظيف</label>
                  <select className="glass-select" value={form.employment_type} onChange={e => setForm(f => ({ ...f, employment_type: e.target.value }))}>
                    {EMP_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="glass-label">الراتب (د.ع)</label>
                  <input className="glass-input" type="number" min={0} value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} dir="ltr" />
                </div>
                <div>
                  <label className="glass-label">رقم الهاتف</label>
                  <input className="glass-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} dir="ltr" />
                </div>
                <div>
                  <label className="glass-label">تاريخ الانضمام</label>
                  <input className="glass-input" type="date" value={form.join_date} onChange={e => setForm(f => ({ ...f, join_date: e.target.value }))} dir="ltr" />
                </div>
              </div>
              <div>
                <label className="glass-label">ملاحظات (اختياري)</label>
                <textarea className="glass-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ minHeight: '70px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setModal(null)} className="glass-btn" style={{ flex: 1 }}>إلغاء</button>
                <button type="submit" disabled={saving} className="glass-btn glass-btn-primary" style={{ flex: 1 }}>
                  {saving ? 'جاري الحفظ...' : '💾 حفظ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
