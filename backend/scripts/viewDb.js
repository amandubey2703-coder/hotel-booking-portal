/**
 * Quick Database Viewer Utility
 * Displays current MySQL tables and records in clean console tables
 */
const { pool } = require('../src/config/database');

async function viewDatabase() {
  try {
    console.log('\n================== 🏨 HOTELS ==================');
    const [hotels] = await pool.query(`
      SELECT id, name, location, rating 
      FROM hotels 
      ORDER BY id ASC
    `);
    console.table(hotels);

    console.log('\n================ 🛏️ ROOM TYPES & CAPACITIES ================');
    const [rooms] = await pool.query(`
      SELECT r.id, h.name AS hotel_name, r.name AS room_type, r.price_per_night, r.total_capacity
      FROM room_types r
      JOIN hotels h ON r.hotel_id = h.id
      ORDER BY r.id ASC
    `);
    console.table(rooms);

    console.log('\n================ 📋 BOOKINGS ================');
    const [bookings] = await pool.query(`
      SELECT 
        b.booking_reference,
        h.name AS hotel,
        b.guest_name,
        b.guest_email,
        b.check_in_date,
        b.check_out_date,
        b.number_of_nights AS nights,
        b.total_amount,
        b.status
      FROM bookings b
      JOIN hotels h ON b.hotel_id = h.id
      ORDER BY b.id DESC
    `);
    
    if (bookings.length === 0) {
      console.log('No bookings recorded yet.');
    } else {
      console.table(bookings);
    }
    
    console.log('\n');
  } catch (err) {
    console.error('Error viewing database:', err.message);
  } finally {
    await pool.end();
  }
}

viewDatabase();

