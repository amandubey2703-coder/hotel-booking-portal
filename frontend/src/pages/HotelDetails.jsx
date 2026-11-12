import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Star,
  Bed,
  Users,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  Sparkles,
} from 'lucide-react';
import { getHotelById, getAvailability } from '../services/api';
import AvailabilityDisplay from '../components/AvailabilityDisplay';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import {
  formatCurrency,
  formatDate,
  getTodayString,
  addDays,
  calculateNights,
} from '../utils/formatters';

export default function HotelDetails() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stay dates state
  const today = getTodayString();
  const initialCheckIn = searchParams.get('checkIn') || today;
  const initialCheckOut = searchParams.get('checkOut') || addDays(today, 2);

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);

  // Availability state
  const [availability, setAvailability] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availError, setAvailError] = useState(null);

  // Fetch hotel details
  useEffect(() => {
    async function loadHotel() {
      try {
        setLoading(true);
        setError(null);
        const data = await getHotelById(id);
        setHotel(data);
      } catch (err) {
        setError(err.message || 'Hotel details could not be loaded.');
      } finally {
        setLoading(false);
      }
    }
    loadHotel();
  }, [id]);

  // Check availability whenever dates change
  useEffect(() => {
    async function checkRoomAvailability() {
      if (!id || !checkIn || !checkOut || checkOut <= checkIn) {
        setAvailability(null);
        return;
      }

      try {
        setCheckingAvailability(true);
        setAvailError(null);
        const availData = await getAvailability(id, checkIn, checkOut);
        setAvailability(availData);
      } catch (err) {
        setAvailError(err.message || 'Failed to check room availability.');
        setAvailability(null);
      } finally {
        setCheckingAvailability(false);
      }
    }

    if (hotel) {
      checkRoomAvailability();
    }
  }, [id, checkIn, checkOut, hotel]);

  const handleDatesSelect = (newIn, newOut) => {
    setCheckIn(newIn);
    setCheckOut(newOut);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('checkIn', newIn);
    newParams.set('checkOut', newOut);
    setSearchParams(newParams);
  };

  const handleProceedToBooking = () => {
    if (!availability || !availability.isAvailable) return;
    navigate(`/book/${id}?checkIn=${checkIn}&checkOut=${checkOut}`);
  };

  if (loading) {
    return <LoadingSpinner message="Loading hotel details and amenities..." />;
  }

  if (error || !hotel) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <ErrorMessage message={error || 'Hotel not found.'} />
        <Link to="/" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          <ChevronLeft size={16} /> Back to Search
        </Link>
      </div>
    );
  }

  const nights = calculateNights(checkIn, checkOut);
  const pricePerNight = hotel.price_per_night || 0;
  const totalAmount = nights * pricePerNight;

  return (
    <div className="container hotel-details-container">
      {/* Back Link */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
          <ChevronLeft size={16} /> Back to all hotels
        </Link>
      </div>

      <div className="hotel-details-grid">
        {/* Left Column: Photos & Hotel Overview */}
        <div>
          <div className="details-gallery">
            <img
              src={hotel.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'}
              alt={hotel.name}
            />
          </div>

          <div className="hotel-info-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                <MapPin size={16} color="var(--primary)" />
                <span>{hotel.location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#fef3c7', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.9rem', color: '#b45309' }}>
                <Star size={15} fill="#f59e0b" color="#f59e0b" />
                <span>{hotel.rating || '4.8'} (Exceptional)</span>
              </div>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
              {hotel.name}
            </h1>

            <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '1rem', marginBottom: '2rem' }}>
              {hotel.description}
            </p>

            {/* Room Category Section */}
            <h2 className="section-title">
              <Bed size={20} color="var(--primary)" />
              Room Accommodation
            </h2>
            <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {hotel.room_type}
                </h3>
                <span className="badge badge-info">
                  Capacity: {hotel.total_capacity} rooms
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Includes complimentary breakfast, high-speed WiFi, premium bedding, and daily housekeeping.
              </p>
            </div>

            {/* Amenities Section */}
            <h2 className="section-title">
              <Sparkles size={20} color="var(--accent)" />
              Hotel Amenities & Services
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.85rem' }}>
              {(hotel.amenities_list || []).map((amenity, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f1f5f9', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                  <CheckCircle2 size={16} color="var(--primary)" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Card & Availability */}
        <div>
          <div className="booking-card">
            <div className="booking-price-header">
              <div>
                <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {formatCurrency(pricePerNight)}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}> / night</span>
              </div>
              <span className="badge badge-info">1 Room</span>
            </div>

            {/* Date Pickers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={13} /> Check-in
                </label>
                <input
                  type="date"
                  min={today}
                  className="form-input no-icon"
                  value={checkIn}
                  onChange={(e) => handleDatesSelect(e.target.value, checkOut)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar size={13} /> Check-out
                </label>
                <input
                  type="date"
                  min={checkIn ? addDays(checkIn, 1) : addDays(today, 1)}
                  className="form-input no-icon"
                  value={checkOut}
                  onChange={(e) => handleDatesSelect(checkIn, e.target.value)}
                />
              </div>
            </div>

            {/* Live Availability Display & Alternative Dates */}
            {availError && <ErrorMessage message={availError} />}
            <AvailabilityDisplay
              availability={availability}
              checkIn={checkIn}
              checkOut={checkOut}
              loading={checkingAvailability}
              onSelectAlternativeDates={handleDatesSelect}
            />

            {/* Stay & Pricing Summary */}
            {availability && (
              <div className="stay-summary-box" style={{ marginTop: '1.25rem' }}>
                <div className="stay-summary-row">
                  <span>Stay Duration:</span>
                  <strong>{nights} {nights === 1 ? 'night' : 'nights'}</strong>
                </div>
                <div className="stay-summary-row">
                  <span>Price per night:</span>
                  <span>{formatCurrency(pricePerNight)}</span>
                </div>
                <div className="stay-summary-row stay-summary-total">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            )}

            {/* Proceed to Booking Button */}
            <button
              onClick={handleProceedToBooking}
              disabled={!availability || !availability.isAvailable || checkingAvailability}
              className="btn btn-primary btn-full"
              style={{ padding: '0.9rem', fontSize: '1.05rem', marginTop: '1rem' }}
            >
              <span>{availability?.isAvailable ? 'Proceed to Booking' : 'Sold Out for Dates'}</span>
              <ArrowRight size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <ShieldCheck size={14} color="var(--success)" />
              <span>Real-time availability confirmed. No pre-payment required.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
