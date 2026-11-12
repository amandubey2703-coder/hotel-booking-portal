import React from 'react';
import { CheckCircle2, AlertCircle, Calendar, BedDouble } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import AlternativeDatesSuggestion from './AlternativeDatesSuggestion';

export default function AvailabilityDisplay({
  availability,
  checkIn,
  checkOut,
  loading,
  onSelectAlternativeDates,
}) {
  if (loading) {
    return (
      <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Checking live room availability...</p>
      </div>
    );
  }

  if (!availability) {
    return (
      <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Select check-in and check-out dates to view live availability and calculate totals.
        </p>
      </div>
    );
  }

  const { availableRooms, totalCapacity, isAvailable, suggestedAlternatives } = availability;

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        background: isAvailable ? 'var(--success-light)' : 'var(--danger-light)',
        border: `1px solid ${isAvailable ? '#a7f3d0' : '#fecaca'}`,
        marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isAvailable ? (
            <CheckCircle2 size={18} color="var(--success)" />
          ) : (
            <AlertCircle size={18} color="var(--danger)" />
          )}
          <span style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: isAvailable ? 'var(--success)' : 'var(--danger)',
          }}>
            {isAvailable
              ? `${availableRooms} of ${totalCapacity} Rooms Available`
              : 'Sold Out for Selected Dates'}
          </span>
        </div>

        <span style={{ fontSize: '0.8rem', color: isAvailable ? '#065f46' : '#991b1b', fontWeight: 600 }}>
          {availability.numberOfNights} {availability.numberOfNights === 1 ? 'Night' : 'Nights'}
        </span>
      </div>

      {/* Surprise Feature: If Sold Out, show Alternative Date Suggestions */}
      {!isAvailable && (
        <AlternativeDatesSuggestion
          originalCheckIn={checkIn}
          originalCheckOut={checkOut}
          alternatives={suggestedAlternatives}
          onSelectDates={onSelectAlternativeDates}
        />
      )}
    </div>
  );
}

