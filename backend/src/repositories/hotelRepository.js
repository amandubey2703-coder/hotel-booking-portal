const { pool } = require('../config/database');

class HotelRepository {
  /**
   * Retrieves all hotels with their primary room type details.
   * Optionally filters by location (case-insensitive substring match).
   * @param {{ location?: string }} filters
   * @returns {Promise<Array>}
   */
  async findAll({ location } = {}) {
    let query = `
      SELECT 
        h.id,
        h.name,
        h.location,
        h.description,
        h.amenities,
        h.image_url,
        h.rating,
        r.id AS room_type_id,
        r.name AS room_type,
        r.price_per_night,
        r.total_capacity
      FROM hotels h
      LEFT JOIN room_types r ON h.id = r.hotel_id
    `;
    const params = [];

    if (location && location.trim().length > 0) {
      query += ` WHERE LOWER(h.location) LIKE ? `;
      params.push(`%${location.trim().toLowerCase()}%`);
    }

    query += ` ORDER BY h.id ASC;`;

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Retrieves a single hotel by ID with its room type details.
   * @param {number} id 
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    const query = `
      SELECT 
        h.id,
        h.name,
        h.location,
        h.description,
        h.amenities,
        h.image_url,
        h.rating,
        r.id AS room_type_id,
        r.name AS room_type,
        r.price_per_night,
        r.total_capacity
      FROM hotels h
      LEFT JOIN room_types r ON h.id = r.hotel_id
      WHERE h.id = ?;
    `;
    const [rows] = await pool.query(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Finds the room type for a given hotel ID.
   * @param {number} hotelId 
   * @param {Object} [connection] Optional transaction connection
   * @returns {Promise<Object|null>}
   */
  async findRoomTypeByHotelId(hotelId, connection = pool) {
    const query = `
      SELECT id, hotel_id, name, price_per_night, total_capacity
      FROM room_types
      WHERE hotel_id = ?
      LIMIT 1;
    `;
    const [rows] = await connection.query(query, [hotelId]);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Selects and locks the room type row FOR UPDATE to protect simultaneous bookings.
   * @param {number} roomTypeId 
   * @param {Object} connection Required transaction connection
   * @returns {Promise<Object|null>}
   */
  async findRoomTypeByIdForUpdate(roomTypeId, connection) {
    const query = `
      SELECT id, hotel_id, name, price_per_night, total_capacity
      FROM room_types
      WHERE id = ?
      FOR UPDATE;
    `;
    const [rows] = await connection.query(query, [roomTypeId]);
    return rows.length > 0 ? rows[0] : null;
  }
}

module.exports = new HotelRepository();
