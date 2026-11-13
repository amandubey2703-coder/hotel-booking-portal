# Hotel Booking Portal

> A robust, full-stack hotel booking platform built with **React.js**, **Node.js + Express.js**, and **MySQL**. Features atomic transaction-based concurrency protection for last-room reservations, authoritative backend pricing, and an intelligent **Flexible Date Suggestion** engine.

---

## 1. Overview

The **Hotel Booking Portal** is an interview-grade full-stack web application designed to deliver an end-to-end hotel room reservation experience. The system enables users to:
1. Search and explore hotels across top Indian destinations with responsive filtering.
2. Select stay dates (check-in and check-out) with real-time room availability calculations.
3. Book a room with guest details and view guaranteed backend pricing before confirming.
4. Receive a tamper-resistant, collision-free unique booking reference (`HB-YYYYMMDD-XXXXX`).
5. Securely retrieve reservations using both the booking reference and verified guest email.
6. Cancel bookings at any time, instantly releasing reserved capacity back to the inventory.
7. Discover **Flexible Alternative Dates** when a property is sold out for requested dates (Surprise Feature).

---

## 2. Key Features

- **Destination & Date Search:** Search by destination (Mumbai, Jaipur, Goa, Bengaluru, Manali, New Delhi) and date range.
- **Authoritative Backend Pricing & Nights:** Client-submitted prices or totals are never trusted; nights and totals are computed strictly from database rates.
- **Overlap-Aware Availability Management:** Evaluates active confirmed reservations and determines peak nightly room occupancy against total room capacity.
- **Simultaneous Booking Concurrency Protection:** Employs MySQL InnoDB ACID transactions with row-level pessimistic write locking (`SELECT ... FOR UPDATE`) and `READ COMMITTED` isolation, preventing double-booking race conditions when two users simultaneously attempt to book the last room.
- **Secure Retrieval & Verification:** Lookups strictly require both the booking reference and guest email.
- **Instant Capacity Release:** Cancelling an active reservation updates its status to `CANCELLED` and immediately restores room inventory for other guests.
- **Surprise Feature (Flexible Date Suggestions):** Automatically analyzes and recommends nearby date windows with the same stay duration where rooms are available when a requested period is sold out.
- **Automated Test Coverage:** Comprehensive test suite with 41 automated tests covering date arithmetic, pricing, availability math, overbooking rejections, cancellations, REST endpoints (Supertest), and simultaneous booking race conditions.

---

## 3. Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18,Vite, Lucide Icons, Modern CSS Design System |
| **Backend** | Node.js, Express.js, REST API, dotenv, cors |
| **Database** | MySQL 8.0+ (InnoDB engine, foreign keys, compound indexes, ACID transactions) |
| **Testing** | Jest, Supertest |
| **Tooling** | Puppeteer Core (headless screenshot automation), Git |

---

## 4. Prerequisites

Before running the application locally, ensure you have:
- **Node.js:** v18.0.0 or later (v25+ supported)
- **npm:** v9.0.0 or later
- **MySQL Server:** v8.0 or later running on port `3306`
- **Git**

---

## 5. Project Structure

```text
hotel-booking-portal/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # MySQL connection pool configuration
│   │   ├── controllers/
│   │   │   ├── hotelController.js   # HTTP controllers for hotels & availability
│   │   │   └── bookingController.js # HTTP controllers for bookings & cancellations
│   │   ├── services/
│   │   │   ├── hotelService.js     # Hotel business logic & date suggestions
│   │   │   └── bookingService.js   # Booking transactions, pricing & capacity logic
│   │   ├── repositories/
│   │   │   ├── hotelRepository.js   # SQL queries for hotels and room locking
│   │   │   └── bookingRepository.js # SQL queries for bookings & status updates
│   │   ├── routes/
│   │   │   ├── hotelRoutes.js       # /api/hotels route definitions
│   │   │   └── bookingRoutes.js     # /api/bookings route definitions
│   │   ├── validators/
│   │   │   ├── hotelValidator.js    # Hotel parameter & date query validation
│   │   │   └── bookingValidator.js  # Booking payload, email & reference validation
│   │   ├── middleware/
│   │   │   └── errorHandler.js      # Centralized error handler & AppError
│   │   ├── utils/
│   │   │   ├── bookingReference.js  # Alphanumeric collision-free reference generator
│   │   │   └── dateUtils.js         # Date arithmetic, overlap checks, nightly occupancy
│   │   ├── app.js                   # Express app setup, CORS & health check
│   │   └── server.js                # Server entry point
│   ├── tests/
│   │   ├── dateUtils.test.js        # Unit tests for date arithmetic & overlap math
│   │   ├── bookingService.test.js   # Business logic, pricing & cancellation tests
│   │   ├── bookingApi.test.js       # Supertest REST API integration test suite
│   │   └── concurrency.test.js      # Simultaneous last-room booking race condition test
│   ├── scripts/
│   │   └── takeScreenshots.js       # Automated end-to-end flow screenshot generator
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── SearchForm.jsx
│   │   │   ├── HotelCard.jsx
│   │   │   ├── HotelList.jsx
│   │   │   ├── AvailabilityDisplay.jsx
│   │   │   ├── AlternativeDatesSuggestion.jsx  # Surprise Feature UI
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorMessage.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Hotel search & cards grid
│   │   │   ├── HotelDetails.jsx     # Overview, amenities & live availability
│   │   │   ├── BookingPage.jsx      # Guest form & total amount summary
│   │   │   ├── BookingConfirmation.jsx # Confirmation banner & unique reference
│   │   │   └── ManageBooking.jsx    # Secure lookup & cancellation
│   │   ├── services/
│   │   │   └── api.js               # Centralized API service
│   │   ├── styles/
│   │   │   └── index.css            # Responsive luxury hospitality CSS
│   │   ├── utils/
│   │   │   └── formatters.js        # Currency (INR) and date formatters
│   │   ├── App.jsx                  # Route definitions
│   │   └── main.jsx                 # React root mount
│   ├── index.html
│   ├── vite.config.js               # Vite config with API proxy
│   ├── .env.example
│   └── package.json
├── database/
│   ├── schema.sql                   # MySQL tables, indexes & constraints
│   ├── seed.sql                     # 6 realistic sample hotels & bookings
│   └── setup.js                     # Cross-platform automated DB migration/seeder
├── screenshots/                     # Captures of complete user journey & surprise feature
├── .env.example                     # Root environment template
├── .gitignore                       # Production gitignore
├── README.md                        # Project documentation
└── DESIGN.md                        # Architecture & design decisions specification
```

---

## 6. Environment Setup

Copy `.env.example` to `.env` in the `backend` directory (and root if desired):

```bash
# backend/.env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=hotel_booking
DB_USER=root
DB_PASSWORD=admin

CLIENT_URL=http://localhost:5173
```

> **Security Note:** `.env` is ignored by Git in `.gitignore`. Never commit database passwords or private credentials.

---

## 7. Database Setup

Ensure your local MySQL service is running. Run the cross-platform setup script to create the database schema and populate sample hotels:

```bash
cd backend
npm run db:setup
```

Or execute directly via the MySQL CLI:

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

The database seeds **6 realistic hotels** across Mumbai, Jaipur, Goa, Bengaluru, Manali, and New Delhi with room types, prices, and room capacities (4 to 6 rooms).

---

## 8. Backend Setup & Startup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# Or start standard production server
npm start
```

The backend server runs on: `http://localhost:5000`  
Health check endpoint: `http://localhost:5000/api/health`

---

## 9. Frontend Setup & Startup

```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start the Vite development server
npm run dev
```

The frontend will start at: `http://localhost:5173`

---

## 10. API Documentation

All responses follow a consistent JSON format:
```json
{
  "success": true,
  "data": { ... }
}
```
Error format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description."
  }
}
```

### Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint |
| `GET` | `/api/hotels` | Retrieve all hotels (supports optional `?location=Mumbai`) |
| `GET` | `/api/hotels/:id` | Retrieve hotel details by ID |
| `GET` | `/api/hotels/:id/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD` | Calculate live availability & alternative date suggestions |
| `POST` | `/api/bookings` | Create a confirmed booking with backend pricing |
| `GET` | `/api/bookings/:reference?email=guest@example.com` | Retrieve booking details (requires matching email) |
| `POST` / `PATCH` | `/api/bookings/:reference/cancel` | Cancel booking and release room capacity |

#### Example: Create Booking Request
```http
POST /api/bookings
Content-Type: application/json

{
  "hotelId": 1,
  "guestName": "Aman Sharma",
  "guestEmail": "aman.sharma@example.com",
  "checkIn": "2026-11-20",
  "checkOut": "2026-11-23"
}
```

#### Example: Create Booking Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": 5,
    "bookingReference": "HB-20261112-9F2K1",
    "hotelId": 1,
    "hotelName": "Grand Horizon Hotel",
    "hotelLocation": "Mumbai",
    "roomType": "Deluxe Ocean View Room",
    "guestName": "Aman Sharma",
    "guestEmail": "aman.sharma@example.com",
    "checkInDate": "2026-11-20",
    "checkOutDate": "2026-11-23",
    "numberOfNights": 3,
    "pricePerNight": 5000,
    "totalAmount": 15000,
    "status": "CONFIRMED",
    "message": "Booking successfully confirmed!"
  }
}
```

---

## 11. Automated Testing

Run the complete automated test suite using Jest:

```bash
cd backend
npm test
```

For live watch mode during development:
```bash
npm run test:watch
```

### Test Suite Summary (41 Tests Passed)
- **`dateUtils.test.js`**: Validates date parsing, past date rejections, night arithmetic, assignment overlap condition `(existing_in < req_out && existing_out > req_in)`, and peak nightly occupancy.
- **`bookingService.test.js`**: Validates unique reference generation (`HB-YYYYMMDD-XXXXX`), independent backend price calculation, secure retrieval by reference + email, email mismatch rejection (403), capacity decrement, overbooking rejection (409), capacity release upon cancellation, and double-cancellation prevention.
- **`bookingApi.test.js`**: End-to-end Supertest API integration tests covering health check, hotel listings, location search, date validation errors, booking creation, retrieval, and cancellation.
- **`concurrency.test.js`**: Verifies InnoDB transaction row-level locking by simulating two users simultaneously attempting to book the last available room at the exact same millisecond: **exactly one succeeds (201) and the second receives a 409 Conflict (`ROOM_UNAVAILABLE`)**.

---

## 12. Booking Business Logic

1. **Date Validation:**
   - Check-in cannot be in the past (`checkIn >= today`).
   - Check-out must be strictly after check-in (`checkOut > checkIn`, nights $\ge 1$).
2. **Number of Nights Calculation:**
   $$\text{nights} = \frac{\text{checkOutDate} - \text{checkInDate}}{24 \times 3600 \times 1000}$$
3. **Authoritative Backend Pricing:**
   $$\text{totalAmount} = \text{numberOfNights} \times \text{pricePerNight}$$
   The server always queries `room_types.price_per_night` directly from MySQL. Any client-submitted total amount is ignored.
4. **Availability & Overlap Logic:**
   - Overlap condition: `existing_check_in < requested_check_out AND existing_check_out > requested_check_in`.
   - Only `CONFIRMED` bookings consume capacity; `CANCELLED` bookings are completely excluded.
   - For every night in the requested range, nightly occupancy is evaluated.
   - $\text{availableRooms} = \max(0, \text{totalCapacity} - \text{peakNightlyOccupancy})$.
5. **Simultaneous Booking Protection:**
   Uses a MySQL transaction with `READ COMMITTED` isolation and row-level locking (`SELECT ... FOR UPDATE` on `room_types` and `bookings`). If remaining capacity $\le 0$, the transaction rolls back immediately and returns `409 Conflict` (`ROOM_UNAVAILABLE`).

---

## 13. Surprise Feature: Flexible Date Suggestions

### What it does:
When a user selects a date range for a hotel that is completely sold out (0 rooms available), the system automatically computes nearby available date windows of the exact same stay duration (e.g. shifts of $+1, -1, +2, -2, +3, -3, +7$ days) that have active database capacity.

### Why it was selected:
In real-world hotel booking systems, encountering a "Sold Out" message without alternatives causes user bounce and frustration. Recommending alternative dates with guaranteed room availability directly solves user friction and maximizes booking conversion.

### Technical Implementation:
- Implemented in `hotelService.findAlternativeDates()` and rendered via `AlternativeDatesSuggestion.jsx`.
- Evaluates real database availability for candidate offsets while ensuring check-in is never in the past.
- The UI presents clickable cards showing alternative dates, remaining room counts, and total prices with a 1-click **"Select Dates"** button that immediately recalculates availability and enables reservation.

---

## 14. Screenshots

Visual captures of the key flows are preserved in the `screenshots/` directory:
- `01-hotel-search-home.png`: Home page with destination search and hotel cards.
- `02-hotel-search-filtered.png`: Filtered search results for Goa.
- `03-hotel-details.png`: Hotel details page with amenities, room type, and availability.
- `04-booking-form-pricing.png`: Booking form showing stay dates, guest fields, and total amount.
- `05-booking-confirmation.png`: Booking confirmation with unique booking reference.
- `06-manage-booking-retrieval.png`: Manage Booking lookup using reference + email.
- `07-booking-cancellation.png`: Cancellation confirmation releasing room capacity.
- `08-surprise-feature-flexible-dates.png`: Sold out stay displaying the Flexible Date Suggestions.

---

## 15. Assumptions

1. **Date Granularity:** Hotel reservations operate on calendar day boundaries (check-in afternoon to check-out morning). Same-day check-in and check-out is rejected because hotel stays require at least 1 overnight stay.
2. **Back-to-back Stays:** A guest checking out on date $D$ does not overlap with a guest checking in on date $D$ (since `existing_check_out > requested_check_in` requires strictly greater).
3. **Room Categories:** Each hotel maintains a primary room category with a defined total room capacity.
4. **Soft Deletions:** Cancelled bookings are updated to status `CANCELLED` (rather than deleted) to preserve audit trails while releasing inventory.

---

## 16. Development Effort & Unfinished Items

- **Approximate Development Time:** 14 hours.
- **Intentionally Unfinished / Out of Scope (per assignment guidelines):**
  - User authentication and login/registration.
  - Third-party payment gateway integration (Razorpay/Stripe).
  - Admin management portal.
  - External transactional email provider (SendGrid/SES).
  - Cloud infrastructure provisioning.

---

## 17. AI Assistance Disclosure

In accordance with the assignment guidelines, AI assistance (Gemini was utilized for boilerplate generation, test case authoring, and documentation refinement. All architectural decisions, transactional concurrency models, database schemas, and application logic were verified, tested, and executed end-to-end.

