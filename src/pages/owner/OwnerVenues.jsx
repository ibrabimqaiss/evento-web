import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BuildingOffice2Icon, UsersIcon, BanknotesIcon, CalendarDaysIcon,
  PlusIcon, PencilIcon, StarIcon,
} from '@heroicons/react/24/outline'
import { getOwnerVenues, fmtIQD, VENUE_TYPE_LABELS } from '../../lib/ownerApi'

const STATUS_LABELS = { active: 'نشط', inactive: 'غير نشط', under_review: 'قيد المراجعة' }
const STATUS_CLASS = { active: 'status-badge status-active', inactive: 'status-badge status-inactive', under_review: 'status-badge status-review' }

export default function OwnerVenues() {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getOwnerVenues()
      .then((res) => {
        const data = res.data?.data ?? res.data
        setVenues(Array.isArray(data) ? data : (data?.results ?? []))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="owner-page">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>القاعات</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
            إدارة قاعاتك وإعداداتها
          </p>
        </div>
        <Link to="/owner/venues/new" className="glass-btn glass-btn-primary">
          <PlusIcon style={{ width: 16, height: 16 }} /> قاعة جديدة
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 220, borderRadius: 20 }} />)}
        </div>
      ) : venues.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <BuildingOffice2Icon style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.3)', marginBottom: '16px' }} />
          <div style={{ fontSize: '18px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
            لا توجد قاعات بعد
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
            أضف قاعتك الأولى للبدء في استقبال الحجوزات
          </p>
          <Link to="/owner/venues/new" className="glass-btn glass-btn-primary"><PlusIcon style={{ width: 16, height: 16 }} /> إضافة قاعة</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {venues.map((v) => <VenueCard key={v.id} venue={v} />)}
        </div>
      )}
    </div>
  )
}

function VenueCard({ venue }) {
  const coverImg = venue.cover_image?.card_url || venue.cover_image?.image_url || null
  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      {/* Cover */}
      <div style={{
        height: '140px',
        background: coverImg
          ? `url(${coverImg}) center/cover`
          : 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.3))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!coverImg && <BuildingOffice2Icon style={{ width: 48, height: 48, color: 'rgba(255,255,255,0.35)' }} />}
      </div>

      <div style={{ padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              {venue.name_ar || venue.name}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
              {VENUE_TYPE_LABELS[venue.venue_type] || venue.venue_type} · {venue.city}
            </div>
          </div>
          <span className={STATUS_CLASS[venue.status] || 'status-badge status-review'}>
            {STATUS_LABELS[venue.status] || venue.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '14px 0' }}>
          <InfoChip Icon={UsersIcon} label="سعة قصوى" value={`${venue.max_capacity} شخص`} />
          <InfoChip Icon={BanknotesIcon} label="السعر الأساسي" value={fmtIQD(venue.base_price_iqd)} />
          <InfoChip Icon={CalendarDaysIcon} label="إجمالي الحجوزات" value={venue.total_bookings ?? 0} />
          <InfoChip Icon={StarIcon} label="التقييم" value={`${venue.avg_rating ?? 0} / 5`} />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to={`/owner/venues/${venue.slug}/edit`} className="glass-btn glass-btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
            <PencilIcon style={{ width: 14, height: 14 }} /> تعديل
          </Link>
          <Link to={`/owner/bookings?venue_id=${venue.id}`} className="glass-btn glass-btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
            <CalendarDaysIcon style={{ width: 14, height: 14 }} /> الحجوزات
          </Link>
        </div>
      </div>
    </div>
  )
}

function InfoChip({ Icon, label, value }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '8px 10px', minWidth: 0 }}>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        {Icon && <Icon style={{ width: 11, height: 11, flexShrink: 0 }} />}
        {label}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
    </div>
  )
}
