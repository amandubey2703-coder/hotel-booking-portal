import React from 'react';
import { Sparkles, Calendar, ArrowRight, Check } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/formatters';

export default function AlternativeDatesSuggestion({
  originalCheckIn,
  originalCheckOut,
  alternatives = [],
  onSelectDates,
}) {
  if (!alternatives || alternatives.length === 0) return null;

  return (
    <div className="alternative-dates-box">
      <div className="alt-header">
        <Sparkles size={18} color="#d97706" />
        <span>Surprise Feature: Flexible Date Suggestions</span>
      </div>
      <p className="alt-desc">
        Rooms are sold out for <strong>{formatDate(originalCheckIn)} → {formatDate(originalCheckOut)}</strong>. 
        Good news! We found available rooms on nearby alternative dates for the same stay duration:
      </p>

      <div className="alt-cards-list">
        {alternatives.map((alt, index) => (
          <div key={index} className="alt-card-item">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                <Calendar size={15} color="#d97706" />
                <span>{formatDate(alt.checkIn)} → {formatDate(alt.checkOut)}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                <strong style={{ color: '#059669' }}>{alt.availableRooms} {alt.availableRooms === 1 ? 'room' : 'rooms'} available</strong> • {alt.numberOfNights} {alt.numberOfNights === 1 ? 'night' : 'nights'} • {formatCurrency(alt.totalAmount)}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectDates(alt.checkIn, alt.checkOut)}
              className="btn btn-sm btn-primary"
              style={{ background: '#d97706' }}
            >
              <span>Select Dates</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

