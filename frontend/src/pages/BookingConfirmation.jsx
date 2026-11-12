import React, { useState } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  Copy,
  Check,
  Calendar,
  User,
  Mail,
  Building2,
  Bed,
  ArrowRight,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function BookingConfirmation() {
  const { reference } = useParams();
  const location = useLocation();
  const booking = location.state?.booking;

  const [copied, setCopied] = useState(false);

  const bookingRef = booking?.bookingReference || reference;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container confirmation-container">
      <div className="confirmation-card">
        {/* Success Icon */}
        <div className="success-icon-badge">
          <CheckCircle size={44} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Booking Confirmed!
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
          Your room has been successfully reserved. Please present your booking reference upon check-in.
        </p>

        {/* Unique Booking Reference Box */}
        <div className="ref-banner">
          <div>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>
              Booking Reference
            </span>
            <span className="ref-code">{bookingRef}</span>
          </div>

          <button
            onClick={handleCopy}
            className="btn btn-sm btn-secondary"
            style={{ background: '#fff', border: '1px solid var(--border)' }}
            title="Copy Reference"
          >
            {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>

        {/* Booking Details Breakdown */}
        {booking && (
          <div style={{ textAlign: 'left', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              Stay & Guest Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>HOTEL</span>
                <strong style={{ fontSize: '0.95rem' }}>{booking.hotelName}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>ROOM TYPE</span>
                <strong style={{ fontSize: '0.95rem' }}>{booking.roomType}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>GUEST NAME</span>
                <span style={{ fontSize: '0.92rem' }}>{booking.guestName}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>EMAIL</span>
                <span style={{ fontSize: '0.92rem' }}>{booking.guestEmail}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', padding: '1rem 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>CHECK-IN</span>
                <strong>{formatDate(booking.checkInDate)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>CHECK-OUT</span>
                <strong>{formatDate(booking.checkOutDate)}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>NIGHTS</span>
                <strong>{booking.numberOfNights}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>TOTAL AMOUNT</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>
              <span className="badge badge-success">
                STATUS: {booking.status || 'CONFIRMED'}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={handlePrint} className="btn btn-secondary">
            <Printer size={16} />
            Print Receipt
          </button>

          <Link
            to={`/manage-booking?reference=${encodeURIComponent(bookingRef)}${booking?.guestEmail ? `&email=${encodeURIComponent(booking.guestEmail)}` : ''}`}
            className="btn btn-secondary"
          >
            Manage Booking
          </Link>

          <Link to="/" className="btn btn-primary">
            Explore More Hotels
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
