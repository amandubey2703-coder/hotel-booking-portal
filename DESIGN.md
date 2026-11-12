# System Architecture & Design Specification
## Hotel Booking Portal — Engineering Design Document

---

## 1. Architectural Overview

The application follows a clean, decoupled three-tier architecture separating the client presentation, application business logic, and relational persistence layer.

```text
┌────────────────────────────────────────────────────────┐
│                   React.js Frontend                    │
│   (Vite, React Router DOM, Centralized API Client)     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON REST APIs
                            ▼
┌────────────────────────────────────────────────────────┐
│               Node.js + Express.js Backend             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Express Routes & Middleware (CORS, Validation)   │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           ▼                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Controllers (HTTP Translation & Status Codes)    │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           ▼                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Services (Business Logic, Transactions, Pricing) │  │
│  └────────────────────────┬─────────────────────────┘  │
│                           ▼                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Repositories (Parameterized SQL Queries & Locks) │  │
│  └────────────────────────┬─────────────────────────┘  │
└───────────────────────────┼────────────────────────────┘
                            │ Connection Pool (mysql2/promise)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   MySQL 8.0+ Database                  │
│       (InnoDB Engine, ACID Transactions, Indexes)      │
└────────────────────────────────────────────────────────┘
```

### Request-Response Flow
1. **Client Action:** The user performs an action (e.g., searches for a city, selects dates, or submits a booking request).
2. **API Layer (`/routes`):** Express receives the HTTP request and routes it through route-specific validation middleware (`bookingValidator.js`, `hotelValidator.js`).
3. **Controller Layer (`/controllers`):** Validated data is extracted and passed to the appropriate service. The controller maps service outcomes or custom application errors (`AppError`) to standard HTTP responses (e.g. `200 OK`, `201 Created`, `400 Bad Request`, `403 Forbidden`, `404 Not Found`, `409 Conflict`).
4. **Service Layer (`/services`):** Implements all core business rules:
   - Validates date chronology and prevents past reservations.
   - Manages ACID database transactions.
   - Enforces pessimistic row-level write locks.
   - Authoritatively calculates nights and total pricing using room price persisted in the database.
   - Recommends nearby alternative dates if sold out (Surprise Feature).
5. **Repository Layer (`/repositories`):** Executes parameterized SQL statements via `mysql2/promise` with zero raw string interpolation, preventing SQL injection vulnerabilities.
6. **Centralized Error Handling:** Any uncaught or operational error bubbles to `errorHandler.js`, producing uniform JSON error envelopes without leaking database internals or stack traces.

---

## 2. Database Design & Relational Schema

The database design uses a normalized third normal form (3NF) relational model in MySQL 8.0 with the InnoDB storage engine.

### Entity-Relationship Diagram

```text
┌────────────────────────┐
│         hotels         │
├────────────────────────┤
│ id (PK, INT AUTO_INC)  │
│ name (VARCHAR 255)     │
│ location (VARCHAR 255) │◄───┐
│ description (TEXT)     │    │
│ amenities (VARCHAR 500)│    │
│ image_url (VARCHAR 500)│    │
│ rating (DECIMAL 2,1)   │    │
│ created_at (TIMESTAMP) │    │
│ updated_at (TIMESTAMP) │    │
└───────────┬────────────┘    │
            │ 1:1             │
            ▼                 │
┌────────────────────────┐    │
│       room_types       │    │
├────────────────────────┤    │
│ id (PK, INT AUTO_INC)  │    │
│ hotel_id (FK -> hotels)│    │
│ name (VARCHAR 100)     │    │
│ price_per_night (DEC)  │    │
│ total_capacity (INT)   │    │
│ created_at (TIMESTAMP) │    │
│ updated_at (TIMESTAMP) │    │
└───────────┬────────────┘    │
            │ 1:N             │
            ▼                 │
┌─────────────────────────────┴┐
│           bookings           │
├──────────────────────────────┤
│ id (PK, INT AUTO_INCREMENT)  │
│ booking_reference (VARCHAR)  │◄── UNIQUE
│ hotel_id (FK -> hotels)      │
│ room_type_id (FK->room_types)│
│ guest_name (VARCHAR 255)     │
│ guest_email (VARCHAR 255)    │
│ check_in_date (DATE)         │
│ check_out_date (DATE)        │
│ number_of_nights (INT)       │
│ price_per_night (DECIMAL)    │
│ total_amount (DECIMAL 10,2)  │
│ status (CONFIRMED/CANCELLED) │
│ created_at (TIMESTAMP)       │
│ updated_at (TIMESTAMP)       │
└──────────────────────────────┘
```

### Table Definitions & Constraints

#### 1. `hotels` Table
- Stores primary metadata for each property.
- **Index:** `idx_hotels_location` on `(location)` enables fast indexed lookups when searching by city or destination.

#### 2. `room_types` Table
- Captures category details, nightly rates, and maximum physical capacity.
- **Foreign Key:** `fk_room_types_hotel` references `hotels(id)` with `ON DELETE CASCADE ON UPDATE CASCADE`.
- **Index:** `idx_room_types_hotel` on `(hotel_id)`.

#### 3. `bookings` Table
- Records individual confirmed or cancelled reservations.
- **Constraints:**
  - `uq_bookings_reference`: Unique index on `booking_reference`.
  - `fk_bookings_hotel`: Foreign key referencing `hotels(id)`.
  - `fk_bookings_room_type`: Foreign key referencing `room_types(id)`.
- **Compound Availability Index:**
  `idx_bookings_availability` on `(hotel_id, room_type_id, status, check_in_date, check_out_date)`. This multi-column B-Tree index allows the MySQL optimizer to satisfy date interval overlap scans with index range reads without full-table scans.
- **Compound Retrieval Index:**
  `idx_bookings_retrieval` on `(booking_reference, guest_email)` ensures fast and secure retrieval.

---

## 3. REST API Design

The API adheres to RESTful conventions, returning standard HTTP status codes and structured JSON bodies.

### Standard Response Envelopes

#### Success Envelope (`200 OK`, `201 Created`):
```json
{
  "success": true,
  "data": { ... }
}
```

#### Error Envelope (`400`, `403`, `404`, `409`, `500`):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "Check-out date must be after check-in date."
  }
}
```

### Endpoint Specifications

#### 1. `GET /api/hotels`
- **Purpose:** Retrieve list of all hotels, with optional location filtering.
- **Query Parameters:** `location` (optional, string)
- **Response:** Array of hotels with attached room type, prices, and amenities.

#### 2. `GET /api/hotels/:id`
- **Purpose:** Fetch detailed hotel information.
- **Status Codes:** `200 OK`, `404 Not Found` (`HOTEL_NOT_FOUND`).

#### 3. `GET /api/hotels/:id/availability`
- **Purpose:** Query real-time available room capacity for a given date range.
- **Query Parameters:** `checkIn` (YYYY-MM-DD), `checkOut` (YYYY-MM-DD).
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "hotelId": 1,
      "hotelName": "Grand Horizon Hotel",
      "roomTypeId": 1,
      "roomType": "Deluxe Ocean View Room",
      "checkIn": "2026-11-20",
      "checkOut": "2026-11-23",
      "numberOfNights": 3,
      "pricePerNight": 5000,
      "totalAmount": 15000,
      "totalCapacity": 5,
      "availableRooms": 3,
      "isAvailable": true,
      "suggestedAlternatives": []
    }
  }
  ```
- **Surprise Feature Behavior:** If `availableRooms === 0`, `suggestedAlternatives` is populated with nearby available date windows.

#### 4. `POST /api/bookings`
- **Purpose:** Reserve a room for a guest.
- **Request Body:**
  ```json
  {
    "hotelId": 1,
    "guestName": "Aman Sharma",
    "guestEmail": "aman.sharma@example.com",
    "checkIn": "2026-11-20",
    "checkOut": "2026-11-23"
  }
  ```
- **Response:** `201 Created` with full reservation details and generated `bookingReference`.
- **Status Codes:** `201 Created`, `400 Bad Request`, `404 Not Found`, `409 Conflict` (`ROOM_UNAVAILABLE`).

#### 5. `GET /api/bookings/:reference`
- **Purpose:** Securely retrieve booking details.
- **Query Parameter:** `email` (required).
- **Security Check:** If `booking.guest_email.toLowerCase() !== email.toLowerCase()`, access is refused with `403 Forbidden` (`BOOKING_EMAIL_MISMATCH`).

#### 6. `POST` / `PATCH /api/bookings/:reference/cancel`
- **Purpose:** Cancel an existing active booking.
- **Body / Query:** `email` (required for verification).
- **Behavior:** Updates status to `CANCELLED`, releasing reserved inventory. If already cancelled, returns `400 Bad Request` (`BOOKING_ALREADY_CANCELLED`).

---

## 4. Booking & Availability Engine

### 4.1 Date Validation Rules
- **Format:** Checked against `^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$` and validated against Gregorian calendar boundaries.
- **Past Check-in Prevention:** `checkIn < getTodayString()` is rejected with `400 CHECK_IN_PAST`. Check-in on the current day is allowed.
- **Chronological Validity:** Check-out must be strictly after check-in (`checkOut > checkIn`). Same-day check-in/out is rejected because hotel reservations are overnight stays ($\text{nights} \ge 1$).

### 4.2 Overlap Condition
Two stay periods $[S_1, E_1)$ and $[S_2, E_2)$ overlap if and only if:
$$\text{existing\_check\_in} < \text{requested\_check\_out} \quad \text{AND} \quad \text{existing\_check\_out} > \text{requested\_check\_in}$$

#### Boundary Analysis:
- Existing: June 10 $\rightarrow$ June 15, Requested: June 12 $\rightarrow$ June 14 $\Rightarrow$ **OVERLAP**
- Existing: June 10 $\rightarrow$ June 15, Requested: June 15 $\rightarrow$ June 18 $\Rightarrow$ **NO OVERLAP** (Morning checkout allows afternoon check-in on the same date).
- Existing: June 10 $\rightarrow$ June 15, Requested: June 08 $\rightarrow$ June 10 $\Rightarrow$ **NO OVERLAP**.

### 4.3 Peak Nightly Occupancy Calculation
To calculate room availability across multi-night stays, the backend evaluates each night $N_i \in [\text{checkIn}, \text{checkOut})$:
$$\text{occupancy}(N_i) = \sum_{b \in \text{ConfirmedBookings}} \mathbf{1}_{b.\text{checkIn} \le N_i < b.\text{checkOut}}$$
$$\text{peakOccupancy} = \max_{N_i} \text{occupancy}(N_i)$$
$$\text{availableRooms} = \max(0, \text{totalCapacity} - \text{peakOccupancy})$$

### 4.4 Authoritative Backend Pricing
The frontend displays calculated totals solely for user experience. When `POST /api/bookings` is invoked:
1. The backend reads `room_types.price_per_night` directly from the locked database record.
2. Independently calculates $\text{nights} = \text{checkOut} - \text{checkIn}$.
3. Computes $\text{totalAmount} = \text{nights} \times \text{pricePerNight}$.
4. Any client-submitted `totalAmount` in the JSON payload is discarded.

---

## 5. Simultaneous Booking Protection (Concurrency Control)

### The Race Condition Problem
Consider a hotel with total capacity of 1 room.
1. Room currently has 0 bookings (1 room available).
2. **User A** and **User B** simultaneously submit booking requests for the same date window.
3. Without concurrency control:
   - User A reads: 0 overlapping bookings $\Rightarrow$ available = 1 $\Rightarrow$ Proceed.
   - User B reads: 0 overlapping bookings $\Rightarrow$ available = 1 $\Rightarrow$ Proceed.
   - User A inserts booking.
   - User B inserts booking.
   - **Result:** 2 confirmed bookings for a 1-room capacity (**Double Booking / Phantom Overbooking**).

### Concurrency Solution Architecture

To eliminate this vulnerability without introducing heavyweight distributed locking dependencies, we leverage **MySQL InnoDB ACID Transactions** with **Pessimistic Row-Level Write Locks (`FOR UPDATE`)** and `READ COMMITTED` isolation:

```text
User A (Thread 1)                          User B (Thread 2)
─────────────────                          ─────────────────
SET TRANSACTION ISOLATION LEVEL            SET TRANSACTION ISOLATION LEVEL
  READ COMMITTED;                            READ COMMITTED;
BEGIN TRANSACTION;                         BEGIN TRANSACTION;

SELECT * FROM room_types                   SELECT * FROM room_types
WHERE id = ? FOR UPDATE;                   WHERE id = ? FOR UPDATE;
┌─────────────────────────────────┐        ┌─────────────────────────────────┐
│ LOCK ACQUIRED ON ROOM_TYPE ROW  │        │ WAITS FOR EXCLUSIVE ROW LOCK... │
└─────────────────────────────────┘        │ (Blocked by InnoDB lock queue)  │
Query overlapping confirmed                │                                 │
bookings FOR UPDATE;                       │                                 │
Available capacity = 1 - 0 = 1 > 0;        │                                 │
Insert booking row for User A;             │                                 │
COMMIT;                                    │                                 │
┌─────────────────────────────────┐        │                                 │
│ LOCK RELEASED                   │───────►│ LOCK ACQUIRED                   │
└─────────────────────────────────┘        └─────────────────────────────────┘
                                           Query overlapping confirmed
                                           bookings FOR UPDATE;
                                           User A's row is now read!
                                           Available capacity = 1 - 1 = 0 <= 0;
                                           ROLLBACK;
                                           Return 409 Conflict:
                                           ROOM_UNAVAILABLE
```

### Technical Mechanics
1. **`SET TRANSACTION ISOLATION LEVEL READ COMMITTED;`**:
   Ensures that every locking read reads the freshest committed database state rather than a stale consistent MVCC snapshot initialized when the transaction started.
2. **`SELECT ... FROM room_types WHERE id = ? FOR UPDATE;`**:
   Acquires an exclusive write lock on the room type record. Any other transaction attempting to book this room type is queued by the InnoDB lock manager.
3. **`SELECT ... FROM bookings WHERE ... FOR UPDATE;`**:
   Performs a locking read across overlapping confirmed bookings, reading recently committed inserts.
4. **Capacity Assertion:**
   If $\text{availableCapacity} \le 0$, the transaction issues an immediate `ROLLBACK` and throws `AppError('...', 409, 'ROOM_UNAVAILABLE')`.
5. **Atomic Commit & Release:**
   If capacity remains, the booking record is inserted, the transaction commits, and the connection lock is released.

This concurrency mechanism is verified by `backend/tests/concurrency.test.js`, where concurrent simultaneous booking promises are executed against the last remaining room: **exactly one succeeds (201 Created) and the second receives `409 Conflict`**.

---

## 6. Design Decisions & Trade-Offs

### 6.1 React.js vs Other Frameworks
- **Decision:** React 18 with Vite and React Router DOM.
- **Rationale:** Component-based composition allows separating concerns (search bar, availability displays, date suggestor, booking summary). Vite offers sub-second hot reloading and optimized production bundles.

### 6.2 Node.js & Express vs Spring Boot / Python
- **Decision:** Node.js with Express and `mysql2/promise`.
- **Rationale:** Non-blocking asynchronous I/O excels at handling concurrent HTTP requests while waiting on database operations. Express provides a lightweight, transparent middleware pipeline ideal for explicit controller-service-repository patterns.

### 6.3 Database Choice: MySQL InnoDB
- **Decision:** Relational MySQL with InnoDB.
- **Rationale:** Hotel reservations require strict transactional guarantees (Atomicity, Consistency, Isolation, Durability). Non-relational NoSQL stores (e.g. MongoDB or DynamoDB) require complex two-phase commit protocols to avoid phantom reservations across date ranges.

### 6.4 Service / Repository Separation
- **Decision:** Dedicated Controller $\rightarrow$ Service $\rightarrow$ Repository architecture.
- **Rationale:** Controllers handle HTTP status codes and parameter extraction; Services enforce business invariants and transactional boundaries; Repositories isolate SQL queries and database locks. This allows individual components to be unit-tested without mocking the entire HTTP server.

### 6.5 Soft Cancellation vs Physical Deletion
- **Decision:** Update `status = 'CANCELLED'` rather than deleting the row.
- **Rationale:** Preserves historical audit records, avoids primary key recycling, and enables financial tracking while immediately freeing capacity since the availability query filters strictly on `status = 'CONFIRMED'`.

### 6.6 Pessimistic Locking vs Optimistic Locking
- **Alternative Considered:** Optimistic concurrency using a version column (`UPDATE room_types SET version = version + 1 WHERE id = ? AND version = ?`).
- **Why Rejected:** Optimistic locking works when conflicts occur on a single shared counter. However, hotel availability depends on dynamic date interval overlaps across different days. Pessimistic row locking on the room category guarantees serial execution during the capacity check without retry loops.

---

## 7. Surprise Feature: Flexible Date Suggestions

### 7.1 Problem Statement
When travelers encounter an unavailable hotel for their specific dates, they often find that shifting their trip by 1 or 2 days would allow them to book. Traditional portals simply display a dead-end "No Rooms Available" error, losing the booking.

### 7.2 Solution Architecture
When `hotelService.getAvailability()` detects that $\text{availableRooms} = 0$:
1. The engine calculates candidate stay windows with identical stay duration:
   $$\text{Offsets} = [+1, -1, +2, -2, +3, -3, +4, +7] \quad \text{days}$$
2. Rejects candidate check-in dates that are in the past.
3. Queries real confirmed reservations for each candidate window from MySQL.
4. Computes true available room capacity.
5. Returns up to 3 verified alternatives sorted by closeness to the requested date.
6. The frontend renders the `AlternativeDatesSuggestion` component with 1-click **"Select Dates"** action buttons that instantly switch the active booking parameters.

---

## 8. Limitations & Intentionally Excluded Scope

Per assignment guidelines, the following were intentionally excluded to maintain appropriate interview scope:
- **No User Authentication / Login:** Users book directly as guests; bookings are tracked via unique references and verified emails.
- **No Payment Gateway Integration:** The application models guaranteed reservations with pay-at-property semantics.
- **No Admin Dashboard:** Hotel and room configurations are managed via database schema and migrations.
- **No External Email Provider:** Booking confirmation references are rendered directly on-screen and downloadable as print receipts.

---

## 9. Future Improvements

With additional development time, the following enhancements could be incorporated:
1. **Multi-Room Bookings:** Allow a guest to select multiple rooms in a single reservation transaction.
2. **Multiple Room Categories:** Support multiple room tiers (Standard, Deluxe, Executive Suite) per property with independent capacity counters.
3. **Seasonal / Dynamic Pricing:** Implement rate cards that vary room prices based on weekends, holidays, or occupancy rates.
4. **WebSocket / SSE Live Updates:** Push real-time inventory updates to the frontend as other users make reservations.
5. **Redis Caching Layer:** Cache non-volatile hotel metadata (descriptions, amenities, images) while routing availability and write transactions to MySQL.
