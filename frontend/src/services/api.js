/**
 * Centralized API Service for Hotel Booking Portal
 * Handles all HTTP requests, standardizes error responses, and supports environment configuration.
 */
const BASE_URL = 'http://localhost:5000/api';

/**
 * Generic request helper with JSON parsing and standardized error handling.
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMsg = data?.error?.message || `HTTP ${response.status}: Request failed`;
      const errorCode = data?.error?.code || 'REQUEST_FAILED';
      const error = new Error(errorMsg);
      error.code = errorCode;
      error.status = response.status;
      error.details = data?.error;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) {
      throw err;
    }
    // Network or connection failure
    const networkError = new Error('Unable to connect to the server. Please check your connection.');
    networkError.code = 'NETWORK_ERROR';
    networkError.status = 0;
    throw networkError;
  }
}

/**
 * Fetch list of hotels, with optional location search filter.
 * @param {string} [location] 
 * @returns {Promise<Array>}
 */
export async function getHotels(location = '') {
  const query = location ? `?location=${encodeURIComponent(location.trim())}` : '';
  const response = await request(`/hotels${query}`);
  return response.data;
}

/**
 * Fetch a single hotel by ID.
 * @param {number|string} id 
 * @returns {Promise<Object>}
 */
export async function getHotelById(id) {
  const response = await request(`/hotels/${id}`);
  return response.data;
}

/**
 * Check real-time room availability and alternative dates for a hotel.
 * @param {number|string} id 
 * @param {string} checkIn YYYY-MM-DD
 * @param {string} checkOut YYYY-MM-DD
 * @returns {Promise<Object>}
 */
export async function getAvailability(id, checkIn, checkOut) {
  const query = `?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`;
  const response = await request(`/hotels/${id}/availability${query}`);
  return response.data;
}

/**
 * Create a new room booking.
 * @param {Object} bookingData
 * @param {number} bookingData.hotelId
 * @param {string} bookingData.guestName
 * @param {string} bookingData.guestEmail
 * @param {string} bookingData.checkIn
 * @param {string} bookingData.checkOut
 * @returns {Promise<Object>}
 */
export async function createBooking(bookingData) {
  const response = await request('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
  return response.data;
}

/**
 * Retrieve booking details using booking reference and guest email.
 * @param {string} reference 
 * @param {string} email 
 * @returns {Promise<Object>}
 */
export async function getBooking(reference, email) {
  const query = `?email=${encodeURIComponent(email.trim())}`;
  const response = await request(`/bookings/${encodeURIComponent(reference.trim())}${query}`);
  return response.data;
}

/**
 * Cancel a booking using booking reference and verified guest email.
 * @param {string} reference 
 * @param {string} email 
 * @returns {Promise<Object>}
 */
export async function cancelBooking(reference, email) {
  const response = await request(`/bookings/${encodeURIComponent(reference.trim())}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() }),
  });
  return response;
}

