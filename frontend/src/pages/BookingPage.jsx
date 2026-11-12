import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Calendar,
  User,
  Mail,
  ShieldCheck,
  ChevronLeft,
  Lock,
  Bed,
  MapPin,
} from 'lucide-react';
import { getHotelById, createBooking } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import {
  formatCurrency,
  formatDate,
  calculateNights,
  getTodayString,
} from '../utils/formatters';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BookingPage() {
  const { hotelId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');

  const [hotel, setHotel] = useState(null);
  const [loadingHotel, setLoadingHotel] = useState(true);
  const [pageError, setPageError] = useState(null);

  // Guest inputs
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Validate dates from URL
  const today = getTodayString();
  const nights = checkIn && checkOut ? calculateNights(checkIn, checkOut) : 0;
  const areDatesValid = checkIn && checkOut && checkIn >= today && nights > 0;

  useEffect(() => {
    async function loadHotel() {
      try {
        setLoadingHotel(true);
        setPageError(null);
        const data = await getHotelById(hotelId);
        setHotel(data);
      } catch (err) {
        setPageError(err.message || 'Hotel details could not be loaded.');
      } finally {
        setLoadingHotel(false);
      }
    }
    loadHotel();
  }, [hotelId]);

  const validateForm = () => {
    const errors = {};
    if (!guestName.trim()) {
      errors.guestName = 'Guest name is required.';
    } else if (guestName.trim().length < 2) {
      errors.guestName = 'Guest name must be at least 2 characters.';
    }

    if (!guestEmail.trim()) {
      errors.guestEmail = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(guestEmail.trim())) {
      errors.guestEmail = 'Please provide a valid email address.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || !areDatesValid) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const bookingPayload = {
        hotelId: parseInt(hotelId, 10),
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim().toLowerCase(),
        checkIn,
        checkOut,
      };

      const bookingResponse = await createBooking(bookingPayload);

      // Navigate to confirmation page passing booking details
      navigate(`/confirmation/${bookingResponse.bookingReference}`, {
        state: { booking: bookingResponse },
      });
    } catch (err) {
      setSubmitError(
        err.message || 'Unable to confirm booking. Please try again or select alternative dates.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingHotel) {
    return <LoadingSpinner message="Preparing booking overview..." />;
  }

  if (pageError || !hotel) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <ErrorMessage message={pageError || 'Hotel could not be found.'} />
        <Link to="/" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          <ChevronLeft size={16} /> Return to Search
        </Link>
      </div>
    );
  }

  if (!areDatesValid) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <div className="alert alert-danger">
          Invalid stay dates. Please select valid future dates for check-in and check-out.
        </div>
        <Link to={`/hotels/${hotelId}`} className="btn btn-primary">
          <ChevronLeft size={16} /> Select Dates on Hotel Page
        </Link>
      </div>
    );
  }

  const pricePerNight = hotel.price_per_night || 0;
  const totalAmount = nights * pricePerNight;

  return (
    <div className="container" style={{ paddingTop: '2.5rem', maxWidth: 960 }}>
      {/* Back button */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to={`/hotels/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}
        >
          <ChevronLeft size={16} /> Back to hotel details
        </Link>
      </div>

      <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '1.75rem', color: 'var(--text-main)' }}>
        Complete Your Reservation
      </h1>

      {submitError && <ErrorMessage message={submitError} />}

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Left Column: Guest Information Form */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--primary)" />
            Guest Details
          </h2>

          <form onSubmit={handleBookingSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label" htmlFor="guestName">
                Full Name *
              </label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="guestName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rahul Sharma"
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    if (formErrors.guestName) {
                      setFormErrors((prev) => ({ ...prev, guestName: null }));
                    }
                  }}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.guestName && (
                <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', fontWeight: 600 }}>
                  {formErrors.guestName}
                </span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" htmlFor="guestEmail">
                Email Address *
              </label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="guestEmail"
                  type="email"
                  className="form-input"
                  placeholder="e.g. rahul.sharma@example.com"
                  value={guestEmail}
                  onChange={(e) => {
                    setGuestEmail(e.target.value);
                    if (formErrors.guestEmail) {
                      setFormErrors((prev) => ({ ...prev, guestEmail: null }));
                    }
                  }}
                  disabled={isSubmitting}
                />
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Your unique booking reference will be tied to this email for lookup and cancellation.
              </span>
              {formErrors.guestEmail && (
                <span style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem', fontWeight: 600 }}>
                  {formErrors.guestEmail}
                </span>
              )}
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 600 }}>
                <Lock size={15} color="var(--primary)" />
                <span>Zero Payment Required Now</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Pay upon arrival at the hotel front desk. Free cancellation anytime with your booking reference.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-full"
              style={{ padding: '0.9rem', fontSize: '1.05rem', fontWeight: 700 }}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                  <span>Confirming Reservation...</span>
                </>
              ) : (
                <span>Confirm Booking • {formatCurrency(totalAmount)}</span>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Hotel & Stay Pricing Summary */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem' }}>
            Booking Summary
          </h2>

          {/* Hotel thumbnail info */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <img
              src={hotel.image_url}
              alt={hotel.name}
              style={{ width: 72, height: 72, borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
            />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {hotel.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                <MapPin size={13} />
                <span>{hotel.location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.2rem' }}>
                <Bed size={13} />
                <span>{hotel.room_type}</span>
              </div>
            </div>
          </div>

          {/* Stay Dates */}
          <div style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Check-in:</span>
              <strong>{formatDate(checkIn)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Check-out:</span>
              <strong>{formatDate(checkOut)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Duration:</span>
              <strong>{nights} {nights === 1 ? 'Night' : 'Nights'}</strong>
            </div>
          </div>

          {/* Price Breakdown */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(pricePerNight)} × {nights} nights</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Taxes & Fees</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Included</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: '0.85rem', marginTop: '0.85rem', borderTop: '2px solid var(--border)' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>Total Payable:</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
