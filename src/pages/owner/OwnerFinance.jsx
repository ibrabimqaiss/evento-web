import { useEffect, useState } from 'react'
import { PlusIcon, TrashIcon, CheckIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import {
  getFinanceSummary, getExpenses, createExpense, deleteExpense,
  fmtIQD, fmtDate,
} from '../../lib/ownerApi'
import { DEMO_FINANCE_SUMMARY } from '../../lib/demoData'

function exportCSV(expenses, summary) {
  const rows = [['الوصف', 'الفئة', 'المبلغ (د.ع)', 'التاريخ']]
  expenses.forEach(e => rows.push([e.description, e.category, e.amount, e.date]))
  rows.push([])
  rows.push(['إجمالي الإيرادات (الشهر)', '', summary?.month ?? 0, ''])
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = `evento_finance_${new Date().toISOString().slice(0,10)}.csv`; a.click()
}

const PERIOD_TABS = [
  { key: 'today', label: 'اليوم' },
  { key: 'week', label: 'الأسبوع' },
  { key: 'month', label: 'الشهر' },
  { key: 'year', label: 'السنة' },
]

const EXPENSE_CATS = [
  ['rent', 'إيجار'],
  ['utilities', 'كهرباء وماء'],
  ['salaries', 'رواتب'],
  ['maintenance', 'صيانة'],
  ['marketing', 'تسويق'],
  ['other', 'أخرى'],
]

const emptyExpense = { description: '', category: 'rent', amount: '', date: new Date().toISOString().slice(0, 10), is_recurring: false }

const FIXED_EXP_DEFS = [
  { key: 'rent', label: 'إيجار القاعة' },
  { key: 'electricity', label: 'الكهرباء' },
  { key: 'water', label: 'الماء' },
  { key: 'insurance', label: 'التأمين' },
  { key: 'other_fixed', label: 'أخرى ثابتة' },
]

function loadFixedExp() {
  try { return JSON.parse(localStorage.getItem('evento_fixed_exp') || '{}') } catch { return {} }
}
function saveFixedExp(data) { localStorage.setItem('evento_fixed_exp', JSON.stringify(data)) }

export default function OwnerFinance() {
  const [period, setPeriod] = useState('month')
  const [summary, setSummary] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState(emptyExpense)
  const [saving, setSaving] = useState(false)
  const [fixedExp, setFixedExp] = useState(loadFixedExp)
  const [showFixed, setShowFixed] = useState(false)

  function load() {
    setLoading(true)
    Promise.all([getFinanceSummary(), getExpenses()])
      .then(([sRes, eRes]) => {
        const s = sRes.data?.data ?? sRes.data
        // Fall back to demo data if API returns empty
        setSummary(s && (s.month !== undefined || s.year !== undefined) ? s : DEMO_FINANCE_SUMMARY)
        const eData = eRes.data?.data ?? eRes.data
        setExpenses(Array.isArray(eData) ? eData : (eData?.results ?? []))
      })
      .catch(() => setSummary(DEMO_FINANCE_SUMMARY))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleAddExpense(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await createExpense({ description: form.description, category: form.category, amount: +form.amount, date: form.date })
      setForm(emptyExpense)
      setShowAdd(false)
      load()
    } catch { /* noop */ } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('هل تريد حذف هذا المصروف؟')) return
    await deleteExpense(id)
    load()
  }

  const revenue = summary ? summary[period] ?? 0 : 0

  const totalVariable = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const totalFixed = FIXED_EXP_DEFS.reduce((s, d) => s + (parseFloat(fixedExp[d.key] || 0)), 0)
  // Use backend salary total if available, else fall back to local fixed expenses
  const salaryCost = summary?.total_salary_expenses ?? 0
  const totalExpenses = totalVariable + totalFixed + salaryCost
  const profit = summary?.net_profit ?? (parseFloat(summary?.month ?? revenue) - totalExpenses)

  function updateFixed(key, val) {
    const next = { ...fixedExp, [key]: val }
    setFixedExp(next); saveFixedExp(next)
  }

  return (
    <div className="owner-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>المالية</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>متابعة الإيرادات والمصروفات</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setForm(emptyExpense); setShowAdd(true) }}
            className="glass-btn glass-btn-primary"
            style={{ fontWeight: 700 }}
          >
            <PlusIcon style={{ width: 16, height: 16 }} /> إضافة مصروف
          </button>
          <button onClick={() => exportCSV(expenses, summary)} className="glass-btn glass-btn-sm" disabled={loading}>
            <ArrowDownTrayIcon style={{ width: 15, height: 15 }} /> تصدير CSV
          </button>
        </div>
      </div>

      {/* ── Add Expense Modal ── */}
      {showAdd && (
        <div className="glass-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="glass-modal-panel" style={{ maxWidth: 480, padding: '28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', margin: 0 }}>إضافة مصروف جديد</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
            </div>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="glass-label">العنوان *</label>
                <input className="glass-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="مثال: إيجار أبريل، فاتورة كهرباء..." required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="glass-label">المبلغ (د.ع) *</label>
                  <input className="glass-input" type="number" min={0} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required dir="ltr" placeholder="0" />
                </div>
                <div>
                  <label className="glass-label">التاريخ *</label>
                  <input className="glass-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} dir="ltr" required />
                </div>
              </div>
              <div>
                <label className="glass-label">الفئة</label>
                <select className="glass-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {EXPENSE_CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>متكرر شهرياً</span>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_recurring: !f.is_recurring }))}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
                    background: form.is_recurring ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : 'rgba(255,255,255,0.12)',
                    transition: 'background 0.2s',
                  }}
                >
                  <span style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'left 0.2s', left: form.is_recurring ? 23 : 3 }} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowAdd(false)} className="glass-btn" style={{ flex: 1 }}>إلغاء</button>
                <button type="submit" disabled={saving} className="glass-btn glass-btn-primary" style={{ flex: 1 }}>
                  {saving ? 'جاري الحفظ...' : <><CheckIcon style={{ width: 15, height: 15 }} /> حفظ</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revenue Summary */}
      <div className="glass-card-static" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginBottom: '16px' }}>إجمالي الإيرادات</div>
        <div className="glass-tabs" style={{ marginBottom: '20px' }}>
          {PERIOD_TABS.map(t => (
            <button key={t.key} className={`glass-tab${period === t.key ? ' active' : ''}`} onClick={() => setPeriod(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="skeleton" style={{ height: 60, borderRadius: 12 }} />
        ) : (
          <div style={{ fontSize: '42px', fontWeight: 700, color: '#34D399' }}>
            {fmtIQD(revenue)}
          </div>
        )}

        {/* Profit summary */}
        {!loading && summary && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginTop: '20px' }}>
              <MetricBox label="الإيرادات (الشهر)" value={fmtIQD(summary.month ?? 0)} color="#34D399" />
              <MetricBox label="الرواتب" value={fmtIQD(salaryCost)} color="#F87171" />
              <MetricBox label="المصروفات المتغيرة" value={fmtIQD(totalVariable)} color="#F87171" />
              <MetricBox label="المصروفات الثابتة" value={fmtIQD(totalFixed)} color="#FBBF24" />
            </div>
            {/* Net profit breakdown */}
            <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', fontWeight: 600 }}>تفصيل صافي الربح</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>الإيرادات</span>
                  <span style={{ color: '#34D399', direction: 'ltr' }}>{fmtIQD(summary.month ?? 0)}</span>
                </div>
                {salaryCost > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.55)' }}>- الرواتب</span>
                    <span style={{ color: '#F87171', direction: 'ltr' }}>{fmtIQD(salaryCost)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>- المصروفات المتغيرة</span>
                  <span style={{ color: '#F87171', direction: 'ltr' }}>{fmtIQD(totalVariable)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.55)' }}>- المصروفات الثابتة</span>
                  <span style={{ color: '#FBBF24', direction: 'ltr' }}>{fmtIQD(totalFixed)}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                  <span style={{ color: 'rgba(255,255,255,0.85)' }}>= صافي الربح</span>
                  <span style={{ color: profit >= 0 ? '#34D399' : '#F87171', direction: 'ltr', fontSize: '16px' }}>{fmtIQD(profit)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Fixed Expenses */}
      <div className="glass-card-static" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '20px 24px', borderBottom: showFixed ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>المصاريف الثابتة الشهرية</h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>إجمالي: {fmtIQD(totalFixed)}</p>
          </div>
          <button onClick={() => setShowFixed(v => !v)} className="glass-btn glass-btn-sm">
            {showFixed ? 'إخفاء' : 'تعديل'}
          </button>
        </div>
        {showFixed && (
          <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
            {FIXED_EXP_DEFS.map(d => (
              <div key={d.key}>
                <label className="glass-label">{d.label} (د.ع/شهر)</label>
                <input
                  className="glass-input"
                  type="number"
                  min={0}
                  value={fixedExp[d.key] || ''}
                  onChange={e => updateFixed(d.key, e.target.value)}
                  dir="ltr"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variable Expenses */}
      <div className="glass-card-static">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>المصاريف المتغيرة</h2>
          <button onClick={() => { setForm(emptyExpense); setShowAdd(true) }} className="glass-btn glass-btn-sm glass-btn-primary">
            <PlusIcon style={{ width: 15, height: 15 }} /> إضافة
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ padding: '30px' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 50, borderRadius: 8, marginBottom: 8 }} />)}
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '14px' }}>
            لا توجد مصروفات مسجلة
          </div>
        ) : (
          <div className="glass-table-wrap">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>الوصف</th>
                  <th>الفئة</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp.id}>
                    <td>{exp.description}</td>
                    <td>{EXPENSE_CATS.find(([v]) => v === exp.category)?.[1] || exp.category}</td>
                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{fmtIQD(exp.amount)}</td>
                    <td>{fmtDate(exp.date)}</td>
                    <td>
                      <button onClick={() => handleDelete(exp.id)} className="glass-btn glass-btn-sm glass-btn-danger">
                        <TrashIcon style={{ width: 14, height: 14 }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function MetricBox({ label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px' }}>
      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
