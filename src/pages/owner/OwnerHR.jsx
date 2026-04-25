import { useEffect, useState } from 'react'
import {
  PlusIcon, PencilIcon, UsersIcon, ListBulletIcon,
  CheckCircleIcon, ClockIcon, XCircleIcon,
  BuildingOffice2Icon, CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import {
  getStaff, createStaffMember, updateStaffMember, deleteStaffMember,
  getOwnerBookings, fmtIQD, fmtDate, BOOKING_STATUS_LABELS,
} from '../../lib/ownerApi'

const ROLES = [
  ['manager','مدير'],['waiter','نادل'],['chef','طاهي'],
  ['security','أمن'],['cleaner','عمال نظافة'],['photographer','مصور'],
  ['decorator','مزين'],['driver','سائق'],['other','أخرى'],
]
const EMP_TYPES = [['full_time','دوام كامل'],['part_time','دوام جزئي'],['contract','عقد']]
const ROLE_AR = Object.fromEntries(ROLES)
const TYPE_AR = Object.fromEntries(EMP_TYPES)

const EVENT_TYPE_AR = {
  wedding:'حفل زفاف', graduation:'تخرج', conference:'مؤتمر',
  party:'حفلة', birthday:'عيد ميلاد', other:'أخرى',
}

const ATTENDANCE_OPTIONS = [
  { key: 'present', label: 'حضر', Icon: CheckCircleIcon, color: '#34D399' },
  { key: 'late',    label: 'متأخر', Icon: ClockIcon, color: '#FBBF24' },
  { key: 'absent',  label: 'غاب', Icon: XCircleIcon, color: '#F87171' },
]

const empty = { full_name:'', phone:'', role:'waiter', employment_type:'full_time', salary:'', join_date: new Date().toISOString().slice(0,10), notes:'' }

// ── Schedule localStorage helpers ────────────────────────────────────────────
function scheduleKey(date) { return `evento_schedule_${date}` }
function loadSched(date) {
  try { return JSON.parse(localStorage.getItem(scheduleKey(date)) || '{}') } catch { return {} }
}
function saveSched(date, data) { localStorage.setItem(scheduleKey(date), JSON.stringify(data)) }

// ── Staff Tab ────────────────────────────────────────────────────────────────
function StaffTab({ staff, loading, typeFilter, setTypeFilter, openAdd, openEdit, handleDeactivate }) {
  const active = staff.filter(s => s.is_active !== false)
  const filtered = typeFilter ? active.filter(s => s.employment_type === typeFilter) : active
  const totalSalaries = active.reduce((s, m) => s + parseFloat(m.salary || 0), 0)

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
          {active.length} موظف نشط · إجمالي الرواتب: {fmtIQD(totalSalaries)}
        </p>
        <button onClick={openAdd} className="glass-btn glass-btn-primary"><PlusIcon style={{ width: 16, height: 16 }} /> إضافة موظف</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
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

      <div className="glass-tabs" style={{ marginBottom: '16px' }}>
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
          <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '15px' }}>لا يوجد موظفون</div>
        ) : (
          <div className="glass-table-wrap">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>الاسم</th><th>الدور</th><th>نوع التوظيف</th>
                  <th>الراتب</th><th>تاريخ الانضمام</th><th>الهاتف</th><th>الإجراءات</th>
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
                      }}>{TYPE_AR[s.employment_type] || s.employment_type}</span>
                    </td>
                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{fmtIQD(s.salary)}</td>
                    <td>{fmtDate(s.join_date)}</td>
                    <td style={{ direction: 'ltr' }}>{s.phone || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => openEdit(s)} className="glass-btn glass-btn-sm"><PencilIcon style={{ width: 14, height: 14 }} /></button>
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
    </>
  )
}

// ── Schedule Tab ─────────────────────────────────────────────────────────────
function ScheduleTab({ allStaff }) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const [selDate, setSelDate] = useState(todayStr)
  const [bookings, setBookings] = useState([])
  const [bookLoading, setBookLoading] = useState(false)
  const [sched, setSched] = useState({})

  useEffect(() => {
    setSched(loadSched(selDate))
    setBookLoading(true)
    getOwnerBookings({ date_from: selDate, date_to: selDate })
      .then(res => {
        const d = res.data?.data ?? res.data
        setBookings(Array.isArray(d) ? d : (d?.results ?? []))
      })
      .finally(() => setBookLoading(false))
  }, [selDate])

  function update(bookingId, staffId, key, val) {
    setSched(prev => {
      const next = {
        ...prev,
        [bookingId]: {
          ...(prev[bookingId] || {}),
          [staffId]: {
            ...(prev[bookingId]?.[staffId] || { assigned: false, role: '', attendance: null }),
            [key]: val,
          },
        },
      }
      saveSched(selDate, next)
      return next
    })
  }

  function toggleAssign(bookingId, staffId) {
    const cur = sched[bookingId]?.[staffId]?.assigned || false
    update(bookingId, staffId, 'assigned', !cur)
    if (cur) update(bookingId, staffId, 'attendance', null)
  }

  function setAttendance(bookingId, staffId, val) {
    const cur = sched[bookingId]?.[staffId]?.attendance
    update(bookingId, staffId, 'attendance', cur === val ? null : val)
  }

  // Count unique staff assigned today
  const assignedToday = new Set()
  Object.values(sched).forEach(bSched => {
    Object.entries(bSched).forEach(([sId, s]) => { if (s.assigned) assignedToday.add(sId) })
  })

  const activeStaff = allStaff.filter(s => s.is_active !== false)

  return (
    <div>
      {/* Date picker + summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <label className="glass-label" style={{ marginBottom: '4px' }}>اختر التاريخ</label>
          <input
            type="date"
            className="glass-input"
            value={selDate}
            onChange={e => setSelDate(e.target.value)}
            style={{ width: 'auto', direction: 'ltr' }}
          />
        </div>
        <div className="glass-card-static" style={{ padding: '12px 20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#A78BFA' }}>{bookings.length}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>فعاليات اليوم</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#34D399' }}>{assignedToday.size}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>موظفين مجدولين</div>
          </div>
        </div>
      </div>

      {bookLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#7C3AED', animation: 'spin 0.7s linear infinite', margin: '0 auto' }} />
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-card-static" style={{ padding: '60px', textAlign: 'center' }}>
          <CalendarDaysIcon style={{ width: 36, height: 36, color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }} />
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px' }}>لا توجد فعاليات في هذا اليوم</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bookings.map(b => {
            const vname = b.venue_detail?.name_ar || b.venue_detail?.name || b.venue_name || '—'
            const bSched = sched[b.id] || {}

            return (
              <div key={b.id} className="glass-card-static" style={{ padding: '0', overflow: 'hidden' }}>
                {/* Event header */}
                <div style={{ padding: '16px 20px', background: 'rgba(124,58,237,0.1)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontSize: '15px' }}>
                        {EVENT_TYPE_AR[b.event_type] || b.event_type} — {b.customer_name || '—'}
                      </div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '3px' }}>
                        {vname} · {b.guest_count} ضيف · {b.start_time || '—'}
                      </div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {BOOKING_STATUS_LABELS[b.status] || b.status}
                    </span>
                  </div>
                </div>

                {/* Staff assignment */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    تعيين الموظفين
                  </div>
                  {activeStaff.length === 0 ? (
                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>لا يوجد موظفون نشطون</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {activeStaff.map(st => {
                        const entry = bSched[st.id] || { assigned: false, attendance: null }
                        const isAssigned = entry.assigned

                        return (
                          <div
                            key={st.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                              padding: '10px 14px', borderRadius: '12px', transition: 'background 0.2s',
                              background: isAssigned ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
                              border: `1px solid ${isAssigned ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)'}`,
                            }}
                          >
                            {/* Assign checkbox */}
                            <button
                              onClick={() => toggleAssign(b.id, st.id)}
                              style={{
                                width: 22, height: 22, borderRadius: '6px', border: 'none', cursor: 'pointer',
                                background: isAssigned ? '#7C3AED' : 'rgba(255,255,255,0.1)',
                                color: 'white', fontSize: '13px', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}
                            >
                              {isAssigned ? '✓' : ''}
                            </button>

                            {/* Name + role */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: isAssigned ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)' }}>
                                {st.full_name}
                              </div>
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                                {ROLE_AR[st.role] || st.role}
                              </div>
                            </div>

                            {/* Attendance buttons — only if assigned */}
                            {isAssigned && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {ATTENDANCE_OPTIONS.map(opt => {
                                  const isActive = entry.attendance === opt.key
                                  return (
                                    <button
                                      key={opt.key}
                                      onClick={() => setAttendance(b.id, st.id, opt.key)}
                                      title={opt.label}
                                      style={{
                                        padding: '4px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                        fontFamily: 'Cairo, sans-serif', fontSize: '12px', fontWeight: 600,
                                        background: isActive ? `${opt.color}22` : 'rgba(255,255,255,0.06)',
                                        color: isActive ? opt.color : 'rgba(255,255,255,0.4)',
                                        border: `1px solid ${isActive ? opt.color + '55' : 'rgba(255,255,255,0.08)'}`,
                                        transition: 'all 0.15s',
                                      }}
                                    >
                                      <opt.Icon style={{ width: 13, height: 13, display: 'inline', verticalAlign: 'middle' }} /> {opt.label}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main OwnerHR ─────────────────────────────────────────────────────────────
export default function OwnerHR() {
  const [hrTab, setHrTab] = useState('staff')
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
    } catch { } finally { setSaving(false) }
  }

  async function handleDeactivate(id) {
    if (!confirm('هل تريد إنهاء خدمة هذا الموظف؟')) return
    await deleteStaffMember(id)
    load()
  }

  return (
    <div className="owner-page">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>الموارد البشرية</h1>
      </div>

      {/* Main tabs */}
      <div className="glass-tabs" style={{ marginBottom: '24px' }}>
        <button className={`glass-tab${hrTab === 'staff' ? ' active' : ''}`} onClick={() => setHrTab('staff')}>
          الموظفون
        </button>
        <button className={`glass-tab${hrTab === 'schedule' ? ' active' : ''}`} onClick={() => setHrTab('schedule')}>
          جدول العمل اليومي
        </button>
      </div>

      {hrTab === 'staff' ? (
        <StaffTab
          staff={staff} loading={loading}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          openAdd={openAdd} openEdit={openEdit} handleDeactivate={handleDeactivate}
        />
      ) : (
        <ScheduleTab allStaff={staff} />
      )}

      {/* Staff modal */}
      {modal && (
        <div className="glass-modal-overlay" onClick={() => setModal(null)}>
          <div className="glass-modal-panel" style={{ maxWidth: 500, padding: '28px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', marginBottom: '20px' }}>
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
