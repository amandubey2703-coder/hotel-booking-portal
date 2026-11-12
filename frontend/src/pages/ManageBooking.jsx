import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  Calendar,
  User,
  Mail,
  Building2,
  Bed,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import { getBooking, cancelBooking } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate } from '../utils/formatters';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ManageBooking() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [referenceInput, setReferenceInput] = useState(searchParams.get('reference') || '');
  const [emailInput, setEmailInput] = useState(searchParams.get('email') || '');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cancellation states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState(null);

  // Auto-search if both reference and email are in query params
  useEffect(() => {
    const ref = searchParams.get('reference');
    const em = searchParams.get('email');
    if (ref && em) {
      handleLookup(ref, em);
    }
  }, []);

  const handleLookup = async (ref = referenceInput, em = emailInput) => {
    if (!ref.trim()) {
      setError('Please provide a booking reference (e.g. HB-20261210-9A1F2).');
      return;
    }

    if (!em.trim() || !EMAIL_REGEX.test(em.trim())) {
      setError('Please provide the valid email address associated with this booking.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setCancelSuccessMsg(null);
      const data = await getBooking(ref, em);
      setBooking(data);

      // Sync URL
      setSearchParams({ reference: ref.trim(), email: em.trim() });
    } catch (err) {
      setBooking(null);
      setError(
        err.message || 'Unable to retrieve booking. Please verify your reference and email address.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleLookup(referenceInput, emailInput);
  };

  const handleConfirmCancel = async () => {
    if (!booking) return;

    try {
      setCancelling(true);
      setError(null);
      const res = await cancelBooking(booking.bookingReference, booking.guestEmail);
      // cancelBooking returns the full response; .data contains the updated booking object
      setBooking(res.data || res);
      setCancelSuccessMsg(
        'Your booking has been cancelled successfully. Your previously reserved room capacity is now released.'
      );
      setShowCancelModal(false);
    } catch (err) {
      setError(err.message || 'Failed to cancel booking. Please try again.');
      setShowCancelModal(false);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="container manage-booking-wrapper">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
          <ChevronLeft size={16} /> Return to Home
        </Link>
      </div>

      <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
        Manage Your Booking
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
        Look up your reservation details or cancel an existing stay. Both reference and email are required for verification.
      </p>

      {/* Lookup Card */}
      <div className="booking-lookup-card">
        <form onSubmit={handleFormSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr auto', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="lookup-ref">
                Booking Reference *
              </label>
              <input
                id="lookup-ref"
                type="text"
                className="form-input no-icon"
                placeholder="e.g. HB-20261210-9A1F2"
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value.toUpperCase())}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lookup-email">
                Guest Email *
              </label>
              <input
                id="lookup-email"
                type="email"
                className="form-input no-icon"
                placeholder="e.g. guest@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
              <Search size={16} />
              <span>{loading ? 'Searching...' : 'Find Booking'}</span>
            </button>
          </div>
        </form>
      </div>

      {error && <ErrorMessage message={error} />}
      {cancelSuccessMsg && (
        <div className="alert alert-success">
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
          <div>
            <strong>Booking Cancelled</strong>
            <p style={{ fontSize: '0.88rem', marginTop: 2 }}>{cancelSuccessMsg}</p>
          </div>
        </div>
      )}

      {loading && <LoadingSpinner message="Retrieving booking details..." />}

      {/* Booking Details Card */}
      {booking && !loading && (
        <div className="booking-details-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                Booking Reference
              </span>
              <strong style={{ fontSize: '1.25rem', fontFamily: 'monospace', color: 'var(--primary)' }}>
                {booking.bookingReference}
              </strong>
            </div>

            <span className={`badge ${booking.status === 'CONFIRMED' ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
              {booking.status === 'CONFIRMED' ? (
                <>
                  <CheckCircle2 size={16} /> CONFIRMED
                </>
              ) : (
                <>
                  <XCircle size={16} /> CANCELLED
                </>
              )}
            </span>
          </div>

          {/* Hotel & Stay Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                {booking.hotelName}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                <MapPin size={15} color="var(--primary)" />
                <span>{booking.hotelLocation}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                <Bed size={15} />
                <span>{booking.roomType}</span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Guest Name</div>
              <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '0.75rem' }}>{booking.guestName}</strong>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Registered Email</div>
              <strong style={{ fontSize: '0.95rem' }}>{booking.guestEmail}</strong>
            </div>
          </div>

          {/* Stay Dates & Pricing */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', padding: '1.25rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '2rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>CHECK-IN</span>
              <strong style={{ fontSize: '0.95rem' }}>{formatDate(booking.checkInDate)}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>CHECK-OUT</span>
              <strong style={{ fontSize: '0.95rem' }}>{formatDate(booking.checkOutDate)}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>DURATION</span>
              <strong style={{ fontSize: '0.95rem' }}>{booking.numberOfNights} {booking.numberOfNights === 1 ? 'Night' : 'Nights'}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>TOTAL AMOUNT</span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>{formatCurrency(booking.totalAmount)}</strong>
            </div>
          </div>

          {/* Cancellation Button / Status note */}
          {booking.status === 'CONFIRMED' ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Need to change your plans? Free cancellation is available.
              </span>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="btn btn-danger"
              >
                Cancel Booking
              </button>
            </div>
          ) : (
            <div className="alert alert-warning" style={{ margin: 0 }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>This booking was cancelled.</strong>
                <p style={{ fontSize: '0.85rem', marginTop: 2 }}>
                  The reserved room capacity has been restored to the hotel's available inventory.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for Cancellation */}
      {showCancelModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            maxWidth: 480,
            width: '100%',
            boxShadow: 'var(--shadow-xl)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--danger-light)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Confirm Cancellation
              </h3>
            </div>

            <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to cancel booking <strong>{booking.bookingReference}</strong> for <strong>{booking.hotelName}</strong>?
              This will release your reserved room back to the hotel inventory.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="btn btn-secondary"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="btn btn-danger"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Reservation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
