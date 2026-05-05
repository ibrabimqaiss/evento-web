import { useEffect, useState } from 'react'
import { PlusIcon, TrashIcon, CheckIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import {
  getFinanceSummary, getFinanceTransactions, getExpenses, createExpense, deleteExpense,
  fmtIQD, fmtDate,
} from '../../lib/ownerApi'
import { DEMO_FINANCE_SUMMARY } from '../../lib/demoData'

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

function getPeriodDates(period) {
  const now = new Date()
  const fmt = d => d.toISOString().slice(0, 10)
  if (period === 'today') return { from: fmt(now), to: fmt(now) }
  if (period === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay())
    return { from: fmt(start), to: fmt(now) }
  }
  if (period === 'month') {
    return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: fmt(now) }
  }
  if (period === 'year') {
    return { from: fmt(new Date(now.getFullYear(), 0, 1)), to: fmt(now) }
  }
  return {}
}

function exportCSV(expenses, transactions, summary) {
  const rows = [['النوع', 'الوصف', 'المبلغ (د.ع)', 'التاريخ']]
  transactions.forEach(t => rows.push(['إيراد', `${t.venue_name} – ${t.customer_name}`, t.amount, t.event_date]))
  expenses.forEach(e => rows.push(['مصروف', e.description, e.amount, e.date]))
  rows.push([])
  rows.push(['إجمالي الإيرادات', '', summary?.month ?? 0, ''])
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
  a.download = `evento_finance_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function SummaryCard({ label, value, color, icon }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: 16, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, direction: 'ltr', textAlign: 'right' }}>{value}</div>
    </div>
  )
}

function RevenueRow({ tx }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
        💰
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.venue_name}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{tx.customer_name} · {fmtDate(tx.event_date)}</div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#34D399', direction: 'ltr', flexShrink: 0 }}>{fmtIQD(tx.amount)}</div>
    </div>
  )
}

function ExpenseRow({ exp, catLabel, onDelete }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(248,113,113,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
        📉
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exp.description}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{catLabel} · {fmtDate(exp.date)}</div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#F87171', direction: 'ltr', flexShrink: 0 }}>{fmtIQD(exp.amount)}</div>
      {onDelete && (
        <button onClick={onDelete} className="glass-btn glass-btn-sm glass-btn-danger" style={{ padding: '4px 8px', flexShrink: 0 }}>
          <TrashIcon style={{ width: 13, height: 13 }} />
        </button>
      )}
    </div>
  )
}

function SubtotalRow({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color: color || '#F87171', direction: 'ltr' }}>{fmtIQD(value)}</span>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OwnerFinance() {
  const [period, setPeriod] = useState('month')
  const [summary, setSummary] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [txLoading, setTxLoading] = useState(true)
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
        setSummary(s && (s.month !== undefined || s.year !== undefined) ? s : DEMO_FINANCE_SUMMARY)
        const eData = eRes.data?.data ?? eRes.data
        setExpenses(Array.isArray(eData) ? eData : (eData?.results ?? []))
      })
      .catch(() => setSummary(DEMO_FINANCE_SUMMARY))
      .finally(() => setLoading(false))
  }

  function loadTransactions(p) {
    setTxLoading(true)
    const { from, to } = getPeriodDates(p)
    getFinanceTransactions(from && to ? { date_from: from, date_to: to } : {})
      .then(res => {
        const d = res.data?.results ?? res.data?.data ?? []
        setTransactions(Array.isArray(d) ? d : [])
      })
      .catch(() => setTransactions([]))
      .finally(() => setTxLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => { loadTransactions(period) }, [period])

  async function handleAddExpense(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await createExpense({ description: form.description, category: form.category, amount: +form.amount, date: form.date })
      setForm(emptyExpense); setShowAdd(false); load()
    } catch { /* noop */ } finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('هل تريد حذف هذا المصروف؟')) return
    await deleteExpense(id); load()
  }

  function updateFixed(key, val) {
    const next = { ...fixedExp, [key]: val }
    setFixedExp(next); saveFixedExp(next)
  }

  // Calculations
  const revenue = summary ? (summary[period] ?? 0) : 0
  const totalVariable = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
  const totalFixed = FIXED_EXP_DEFS.reduce((s, d) => s + parseFloat(fixedExp[d.key] || 0), 0)
  const salaryCost = summary?.total_salary_expenses ?? 0
  const totalExpenses = totalVariable + totalFixed + salaryCost
  const profit = revenue - totalExpenses
  const bookingCount = transactions.length
  const txRevenue = transactions.reduce((s, t) => s + (t.amount || 0), 0)

  return (
    <div className="owner-page">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>المالية</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>متابعة الإيرادات والمصروفات</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => { setForm(emptyExpense); setShowAdd(true) }} className="glass-btn glass-btn-primary" style={{ fontWeight: 700 }}>
            <PlusIcon style={{ width: 16, height: 16 }} /> إضافة مصروف
          </button>
          <button onClick={() => exportCSV(expenses, transactions, summary)} className="glass-btn glass-btn-sm" disabled={loading}>
            <ArrowDownTrayIcon style={{ width: 15, height: 15 }} /> تصدير CSV
          </button>
        </div>
      </div>

      {/* ── Add Expense Modal ── */}
      {showAdd && (
        <div className="glass-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="glass-modal-panel" style={{ maxWidth: 480, padding: '28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>إضافة مصروف جديد</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
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
                  style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', background: form.is_recurring ? 'linear-gradient(135deg,#7C3AED,#6D28D9)' : 'rgba(255,255,255,0.12)', transition: 'background 0.2s' }}
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

      {/* ── Period Tabs ── */}
      <div className="glass-tabs" style={{ marginBottom: '20px' }}>
        {PERIOD_TABS.map(t => (
          <button key={t.key} className={`glass-tab${period === t.key ? ' active' : ''}`} onClick={() => setPeriod(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 4 Summary Cards ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 96, borderRadius: 16 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          <SummaryCard label="إجمالي الإيرادات" value={fmtIQD(revenue)} color="#34D399" icon="💰" />
          <SummaryCard label="إجمالي المصاريف" value={fmtIQD(totalExpenses)} color="#F87171" icon="📉" />
          <SummaryCard label="صافي الربح" value={fmtIQD(profit)} color={profit >= 0 ? '#A78BFA' : '#F87171'} icon="📊" />
          <SummaryCard label="عدد الحجوزات" value={bookingCount} color="#60A5FA" icon="📅" />
        </div>
      )}

      {/* ── Two-column: Revenue | Expenses ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* LEFT — Revenue */}
        <div className="glass-card-static" style={{ padding: '20px 24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>الإيرادات</h2>
          {txLoading ? (
            <div>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 8, marginBottom: 8 }} />)}</div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>
              لا توجد حجوزات مؤكدة في هذه الفترة
            </div>
          ) : (
            <>
              <div style={{ maxHeight: 340, overflowY: 'auto', marginBottom: 12 }}>
                {transactions.map(tx => <RevenueRow key={tx.id} tx={tx} />)}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', fontWeight: 700 }}>
                <span style={{ color: 'var(--text-secondary)' }}>الإجمالي</span>
                <span style={{ color: '#34D399', fontSize: 16, direction: 'ltr' }}>{fmtIQD(txRevenue)}</span>
              </div>
            </>
          )}
        </div>

        {/* RIGHT — Expenses */}
        <div className="glass-card-static" style={{ padding: '20px 24px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>المصاريف</h2>
          <div style={{ maxHeight: 340, overflowY: 'auto', marginBottom: 12 }}>
            {/* Salary sub-total row */}
            {salaryCost > 0 && <SubtotalRow label="🧑‍💼 الرواتب" value={salaryCost} />}
            {/* Fixed expenses sub-total */}
            {totalFixed > 0 && <SubtotalRow label="🏢 المصاريف الثابتة" value={totalFixed} color="#FBBF24" />}
            {/* Variable expenses list */}
            {expenses.length === 0 && salaryCost === 0 && totalFixed === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 14 }}>لا توجد مصاريف مسجلة</div>
            ) : (
              expenses.map(exp => (
                <ExpenseRow
                  key={exp.id}
                  exp={exp}
                  catLabel={EXPENSE_CATS.find(([v]) => v === exp.category)?.[1] || exp.category}
                  onDelete={() => handleDelete(exp.id)}
                />
              ))
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', fontWeight: 700 }}>
            <span style={{ color: 'var(--text-secondary)' }}>الإجمالي</span>
            <span style={{ color: '#F87171', fontSize: 16, direction: 'ltr' }}>{fmtIQD(totalExpenses)}</span>
          </div>
        </div>
      </div>

      {/* ── Fixed Expenses Editor ── */}
      <div className="glass-card-static" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '20px 24px', borderBottom: showFixed ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>المصاريف الثابتة الشهرية</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>إجمالي: {fmtIQD(totalFixed)}</p>
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
                <input className="glass-input" type="number" min={0} value={fixedExp[d.key] || ''} onChange={e => updateFixed(d.key, e.target.value)} dir="ltr" placeholder="0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Variable Expenses Table (full list with delete) ── */}
      <div className="glass-card-static">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>المصاريف المتغيرة</h2>
          <button onClick={() => { setForm(emptyExpense); setShowAdd(true) }} className="glass-btn glass-btn-sm glass-btn-primary">
            <PlusIcon style={{ width: 15, height: 15 }} /> إضافة
          </button>
        </div>
        {loading ? (
          <div style={{ padding: '30px' }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 50, borderRadius: 8, marginBottom: 8 }} />)}
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
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
