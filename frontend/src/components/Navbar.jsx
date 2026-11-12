import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, Search, CalendarCheck } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <div className="nav-brand-logo">
            <Building2 size={22} />
          </div>
          <span>StaySphere</span>
        </Link>

        <nav className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <Search size={16} style={{ display: 'inline', marginRight: 6 }} />
            Explore Hotels
          </Link>
          <Link
            to="/manage-booking"
            className={`nav-link nav-cta ${
              location.pathname === '/manage-booking' ? 'active' : ''
            }`}
          >
            <CalendarCheck size={16} style={{ display: 'inline', marginRight: 6 }} />
            Manage Booking
          </Link>
        </nav>
      </div>
    </header>
  );
}
