import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function NotFoundPage() {
  return (
    <div className="page-wrap center p-6" style={{ paddingTop: 80 }}>
      <MagnifyingGlassIcon style={{ width: 72, height: 72, marginBottom: 16, opacity: 0.4 }} />
      <h1 className="h1">٤٠٤</h1>
      <h2 className="h2 mt-4">الصفحة غير موجودة</h2>
      <p className="small mt-4">
        الرابط الذي أدخلته غير صحيح أو لم يعد متاحاً
      </p>
    </div>
  )
}
