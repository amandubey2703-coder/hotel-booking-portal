import React from 'react';
import { MapPin, Calendar, Search, RotateCcw } from 'lucide-react';
import { getTodayString, addDays } from '../utils/formatters';

const POPULAR_DESTINATIONS = ['Mumbai', 'Jaipur', 'Goa', 'Bengaluru', 'Manali', 'New Delhi'];

export default function SearchForm({
  location,
  setLocation,
  checkIn,
  setCheckIn,
  checkOut,
  setCheckOut,
  onSearch,
  onClear,
}) {
  const today = getTodayString();
  const minCheckOut = checkIn ? addDays(checkIn, 1) : addDays(today, 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const handleCheckInChange = (e) => {
    const newCheckIn = e.target.value;
    setCheckIn(newCheckIn);
    // If checkOut is now <= newCheckIn, automatically advance checkOut to newCheckIn + 1 day
    if (checkOut && checkOut <= newCheckIn) {
      setCheckOut(addDays(newCheckIn, 1));
    }
  };

  return (
    <div className="search-card">
      <form onSubmit={handleSubmit} className="search-form">
        {/* Location Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="search-location">
            <MapPin size={14} />
            Destination
          </label>
          <div className="input-wrapper">
            <MapPin size={18} className="input-icon" />
            <input
              id="search-location"
              type="text"
              className="form-input"
              placeholder="Where are you going? (e.g. Mumbai, Goa)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        {/* Check-in Date */}
        <div className="form-group">
          <label className="form-label" htmlFor="search-checkin">
            <Calendar size={14} />
            Check-in
          </label>
          <div className="input-wrapper">
            <Calendar size={18} className="input-icon" />
            <input
              id="search-checkin"
              type="date"
              min={today}
              className="form-input"
              value={checkIn}
              onChange={handleCheckInChange}
            />
          </div>
        </div>

        {/* Check-out Date */}
        <div className="form-group">
          <label className="form-label" htmlFor="search-checkout">
            <Calendar size={14} />
            Check-out
          </label>
          <div className="input-wrapper">
            <Calendar size={18} className="input-icon" />
            <input
              id="search-checkout"
              type="date"
              min={minCheckOut}
              className="form-input"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn btn-primary">
            <Search size={18} />
            Search
          </button>
          {(location || checkIn || checkOut) && (
            <button
              type="button"
              onClick={onClear}
              className="btn btn-secondary"
              title="Reset Search"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </form>

      {/* Quick Location Pills */}
      <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Trending:
        </span>
        {POPULAR_DESTINATIONS.map((dest) => (
          <button
            key={dest}
            type="button"
            onClick={() => {
              setLocation(dest);
            }}
            style={{
              fontSize: '0.78rem',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: location.toLowerCase() === dest.toLowerCase() ? 'var(--primary-light)' : '#f8fafc',
              color: location.toLowerCase() === dest.toLowerCase() ? 'var(--primary)' : 'var(--text-muted)',
              border: '1px solid var(--border)',
              fontWeight: 500,
            }}
          >
            {dest}
          </button>
        ))}
      </div>
    </div>
  );
}

