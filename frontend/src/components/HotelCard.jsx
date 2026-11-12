import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Bed, ArrowRight, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export default function HotelCard({ hotel, checkIn, checkOut }) {
  const queryParams = new URLSearchParams();
  if (checkIn) queryParams.set('checkIn', checkIn);
  if (checkOut) queryParams.set('checkOut', checkOut);
  const detailLink = `/hotels/${hotel.id}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  return (
    <div className="hotel-card">
      <div className="hotel-image-wrapper">
        <img
          src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
          alt={hotel.name}
          className="hotel-image"
          loading="lazy"
        />
        <div className="hotel-badge-location">
          <MapPin size={13} />
          {hotel.location}
        </div>
        <div className="hotel-badge-rating">
          <Star size={13} fill="#f59e0b" color="#f59e0b" />
          {hotel.rating || '4.8'}
        </div>
      </div>

      <div className="hotel-body">
        <div className="hotel-header">
          <h3 className="hotel-title">{hotel.name}</h3>
          <div className="room-type-tag">
            <Bed size={15} />
            <span>{hotel.room_type || 'Standard Room'}</span>
          </div>
        </div>

        <p className="hotel-desc">{hotel.description}</p>

        <div className="amenities-container">
          {(hotel.amenities_list || []).slice(0, 4).map((amenity, idx) => (
            <span key={idx} className="amenity-pill">
              {amenity}
            </span>
          ))}
          {(hotel.amenities_list || []).length > 4 && (
            <span className="amenity-pill" style={{ background: 'none', color: 'var(--text-light)' }}>
              +{hotel.amenities_list.length - 4} more
            </span>
          )}
        </div>

        <div className="hotel-footer">
          <div className="hotel-price-box">
            <span className="price-label">Starting from</span>
            <div>
              <span className="price-value">{formatCurrency(hotel.price_per_night)}</span>
              <span className="price-unit"> / night</span>
            </div>
          </div>

          <Link to={detailLink} className="btn btn-primary btn-sm">
            <span>View Details</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}
