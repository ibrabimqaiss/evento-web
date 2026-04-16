import { Link } from 'react-router-dom'

export default function VenueCard({ venue }) {
  const cover = venue.cover_image || venue.images?.[0]?.image || null

  return (
    <Link to={`/venues/${venue.slug}`} className="card block hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative">
        {cover ? (
          <img
            src={cover}
            alt={venue.name}
            className="w-full h-44 object-cover"
          />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <span className="text-white text-4xl">🏛</span>
          </div>
        )}
        {venue.city && (
          <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
            {venue.city}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base mb-1 truncate">{venue.name}</h3>
        {venue.address && (
          <p className="text-gray-500 text-sm truncate mb-2">{venue.address}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          {venue.min_price != null && (
            <span className="text-primary font-semibold text-sm">
              يبدأ من {Number(venue.min_price).toLocaleString('ar-IQ')} د.ع
            </span>
          )}
          {venue.capacity && (
            <span className="text-gray-400 text-xs">
              حتى {venue.capacity} شخص
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
