import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import HotelDetails from './pages/HotelDetails';
import BookingPage from './pages/BookingPage';
import BookingConfirmation from './pages/BookingConfirmation';
import ManageBooking from './pages/ManageBooking';

export default function App() {
  return (
    <Router>
      <div className="app-layout">
        <Navbar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/hotels/:id" element={<HotelDetails />} />
            <Route path="/book/:hotelId" element={<BookingPage />} />
            <Route path="/confirmation/:reference" element={<BookingConfirmation />} />
            <Route path="/manage-booking" element={<ManageBooking />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}
