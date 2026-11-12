-- ============================================================================
-- Hotel Booking Portal - Seed Data
-- 6 Realistic Hotels across major destinations with Room Types & Sample Bookings
-- ============================================================================

USE hotel_booking;

-- Disable foreign key checks for clean truncation/insertion
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE bookings;
TRUNCATE TABLE room_types;
TRUNCATE TABLE hotels;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- Insert Hotels
-- ----------------------------------------------------------------------------
INSERT INTO hotels (id, name, location, description, amenities, image_url, rating) VALUES
(1, 'Grand Horizon Hotel', 'Mumbai', 
 'A modern luxury city hotel located near Marine Drive and Nariman Point. Offers panoramic Arabian Sea views, a rooftop infinity pool, and fine dining.', 
 'WiFi, Breakfast, Parking, Pool, Gym, Room Service', 
 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', 
 4.8),

(2, 'The Royal Heritage Palace', 'Jaipur', 
 'An authentic Rajasthani heritage palace hotel featuring royal courtyard suites, traditional folk music performances, tranquil fountains, and regal dining.', 
 'WiFi, Breakfast, Parking, Pool, Spa, Cultural Shows', 
 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', 
 4.9),

(3, 'Emerald Bay Resort & Spa', 'Goa', 
 'A tropical beachfront paradise nestled along the pristine white sands of South Goa. Features private beach access, coconut grove cabanas, and fresh seafood.', 
 'WiFi, Breakfast, Pool, Beach Access, Spa, Bar', 
 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80', 
 4.7),

(4, 'Silicon Valley Grand Hotel', 'Bengaluru', 
 'A contemporary business hotel situated right in Whitefield. Features ergonomic workstations, high-speed fiber internet, artisanal coffee lounge, and gym.', 
 'WiFi, Breakfast, Parking, Gym, EV Charging, Workspaces', 
 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80', 
 4.6),

(5, 'The Himalayan Pine Retreat', 'Manali', 
 'A serene mountain haven surrounded by towering deodar cedar forests and snow-capped Himalayan peaks. Features wood fireplaces, bonfire patio, and hiking guides.', 
 'WiFi, Breakfast, Parking, Fireplace, Bonfire, Heating', 
 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80', 
 4.8),

(6, 'The Imperial Residency', 'New Delhi', 
 'An elegant colonial-era boutique hotel in central New Delhi near Connaught Place and India Gate. Boasts lush manicured gardens and high-tea salons.', 
 'WiFi, Breakfast, Parking, Concierge, Restaurant, Garden', 
 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80', 
 4.7);

-- ----------------------------------------------------------------------------
-- Insert Room Types (1 per Hotel as required)
-- ----------------------------------------------------------------------------
INSERT INTO room_types (id, hotel_id, name, price_per_night, total_capacity) VALUES
(1, 1, 'Deluxe Ocean View Room', 5000.00, 5),
(2, 2, 'Heritage Royal Suite', 7200.00, 4),
(3, 3, 'Beachfront Premium Villa', 6500.00, 6),
(4, 4, 'Executive Business Suite', 4500.00, 5),
(5, 5, 'Alpine Pine Chalet', 4200.00, 4),
(6, 6, 'Imperial Premier Room', 5800.00, 5);

-- ----------------------------------------------------------------------------
-- Insert Sample Bookings for testing availability & cancellation
-- Sample dates around late 2026
-- ----------------------------------------------------------------------------
INSERT INTO bookings 
(booking_reference, hotel_id, room_type_id, guest_name, guest_email, check_in_date, check_out_date, number_of_nights, price_per_night, total_amount, status)
VALUES
-- Mumbai Hotel: 2 confirmed bookings for Dec 10-15, 2026 (Leaving 3 of 5 available)
('HB-20261210-9A1F2', 1, 1, 'Aarav Sharma', 'aarav.sharma@example.com', '2026-12-10', '2026-12-15', 5, 5000.00, 25000.00, 'CONFIRMED'),
('HB-20261210-3C8E4', 1, 1, 'Priya Patel', 'priya.patel@example.com', '2026-12-12', '2026-12-16', 4, 5000.00, 20000.00, 'CONFIRMED'),

-- Mumbai Hotel: 1 CANCELLED booking (Should NOT count towards availability!)
('HB-20261210-5B7D1', 1, 1, 'Rohan Mehta', 'rohan.mehta@example.com', '2026-12-10', '2026-12-14', 4, 5000.00, 20000.00, 'CANCELLED'),

-- Jaipur Hotel: 1 confirmed booking
('HB-20261220-7D4F9', 2, 2, 'Vikram Rathore', 'vikram.rathore@example.com', '2026-12-20', '2026-12-24', 4, 7200.00, 28800.00, 'CONFIRMED'),

-- Goa Hotel: 1 confirmed booking
('HB-20261224-2E6B8', 3, 3, 'Ananya Sen', 'ananya.sen@example.com', '2026-12-24', '2026-12-28', 4, 6500.00, 26000.00, 'CONFIRMED');

