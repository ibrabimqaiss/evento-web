import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, login } from '../lib/api'

const ROLES = [
  { value: 'customer', label: 'عميل' },
  { value: 'business_owner', label: 'صاحب نشاط' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    role: 'customer',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      // Auto-login after registration
      await login(form.phone, form.password)
      navigate('/home', { replace: true })
    } catch (err) {
      const data = err.response?.data
      const msg =
        data?.error?.message ||
        data?.detail ||
        (data?.phone && data.phone[0]) ||
        (data?.email && data.email[0]) ||
        'حدث خطأ أثناء التسجيل. يرجى المحاولة مجدداً.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-white text-3xl font-black mb-4">
            إ
          </div>
          <h1 className="text-2xl font-black text-gray-900">إنشاء حساب</h1>
          <p className="text-gray-500 text-sm mt-1">انضم إلى إيفنتو</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                الاسم الكامل
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                placeholder="أحمد محمد"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="07xxxxxxxxx"
                required
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="example@email.com"
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                كلمة المرور
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="8 أحرف على الأقل"
                required
                minLength={8}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                نوع الحساب
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => set('role', r.value)}
                    className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                      form.role === r.value
                        ? 'border-primary bg-primary-light text-primary'
                        : 'border-gray-200 text-gray-600 hover:border-primary/50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary rounded-xl py-3 text-base font-bold disabled:opacity-60"
            >
              {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            سجّل دخولك
          </Link>
        </p>
      </div>
    </div>
  )
}
