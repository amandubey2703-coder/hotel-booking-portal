import React from 'react';
import HotelCard from './HotelCard';
import { SearchX, Building } from 'lucide-react';

export default function HotelList({ hotels, checkIn, checkOut, onResetSearch }) {
  if (!hotels || hotels.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '4rem 1.5rem',
        background: '#fff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        marginTop: '2rem',
      }}>
        <div style={{
          width: 64,
          height: 64,
          background: 'var(--primary-light)',
          color: 'var(--primary)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
        }}>
          <SearchX size={32} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          No Hotels Found
        </h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: 450, margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
          We could not find any hotels matching your current search criteria. Try searching for a different destination or clearing your filters.
        </p>
        {onResetSearch && (
          <button onClick={onResetSearch} className="btn btn-secondary">
            View All Hotels
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', fontWeight: 600 }}>
          Showing <strong style={{ color: 'var(--text-main)' }}>{hotels.length}</strong> available {hotels.length === 1 ? 'property' : 'properties'}
        </p>
      </div>

      <div className="hotels-grid">
        {hotels.map((hotel) => (
          <HotelCard
            key={hotel.id}
            hotel={hotel}
            checkIn={checkIn}
            checkOut={checkOut}
          />
        ))}
      </div>
    </div>
  );
}

