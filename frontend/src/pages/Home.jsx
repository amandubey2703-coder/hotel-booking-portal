import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchForm from '../components/SearchForm';
import HotelList from '../components/HotelList';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { getHotels } from '../services/api';
import { getTodayString, addDays } from '../utils/formatters';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') || getTodayString());
  const [checkOut, setCheckOut] = useState(
    searchParams.get('checkOut') || addDays(getTodayString(), 2)
  );

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHotels = async (searchLocation = location) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHotels(searchLocation);
      setHotels(data);
    } catch (err) {
      setError(err.message || 'Failed to load hotels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels(location);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    setSearchParams(params);

    fetchHotels(location);
  };

  const handleClear = () => {
    setLocation('');
    setCheckIn(getTodayString());
    setCheckOut(addDays(getTodayString(), 2));
    setSearchParams({});
    fetchHotels('');
  };

  return (
    <div>
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="container">
          <h1 className="hero-title">Experience Unforgettable Stays</h1>
          <p className="hero-subtitle">
            Book hand-picked boutique hotels, luxury palace resorts, and scenic chalets across India with guaranteed room availability.
          </p>
        </div>
      </section>

      {/* Floating Search Card */}
      <div className="search-container">
        <SearchForm
          location={location}
          setLocation={setLocation}
          checkIn={checkIn}
          setCheckIn={setCheckIn}
          checkOut={checkOut}
          setCheckOut={setCheckOut}
          onSearch={handleSearch}
          onClear={handleClear}
        />
      </div>

      {/* Main Hotel Listings */}
      <main className="container">
        {loading && <LoadingSpinner message="Searching best hotels for you..." />}
        {error && <ErrorMessage message={error} onRetry={() => fetchHotels(location)} />}
        {!loading && !error && (
          <HotelList
            hotels={hotels}
            checkIn={checkIn}
            checkOut={checkOut}
            onResetSearch={handleClear}
          />
        )}
      </main>
    </div>
  );
}

