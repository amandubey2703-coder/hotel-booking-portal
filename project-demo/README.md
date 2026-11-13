# 🎥 Project Demo Walkthrough

Welcome to the project demo section for the **Hotel Booking Portal** (`StaySphere`).

---


🔗 Video Link:
👉 **[https://drive.google.com/file/d/1KmG1SVMCAmlD8U-gJi-oA4gA40JGmyjX/view?usp=drive_link](https://drive.google.com/file/d/1KmG1SVMCAmlD8U-gJi-oA4gA40JGmyjX/view?usp=drive_link)**

---

## 🎬 Demonstrated Flow in Video

1. **Hotel Search & Exploration:**
   - Browsing 6 luxury hotels with location, pricing, descriptions, and amenities.
   - Searching hotels by city (e.g. "Goa", "Jaipur", "Mumbai").
   - Selecting stay check-in and check-out dates.

2. **Hotel Details & Real-Time Availability:**
   - Dynamic room availability check for the selected dates.
   - Interactive date pickers on the hotel details page.
   - Price breakdown: `Price per night × Duration = Total Amount`.

3. **Booking Creation & Authoritative Backend Pricing:**
   - Guest details input (Full Name and Email Address).
   - Form validation (format checks, preventing past dates).
   - Reservation confirmation generating a unique reference: `HB-YYYYMMDD-XXXXX`.

4. **Booking Retrieval & Secure Cancellation:**
   - Looking up the reservation using reference code + verified guest email.
   - Soft-cancellation updating status to `CANCELLED`.
   - Immediate release of reserved room capacity back to inventory.

5. **Surprise Feature: Flexible Alternative Date Discovery:**
   - When a hotel is fully booked (0 rooms available), the system automatically queries the database and suggests nearby dates where rooms are available.

---

## 📸 Screenshots Directory
High-resolution captures for each step are also available in the [`/screenshots`](../screenshots/) folder.
