import React from 'react';
import { Building2, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#fff', fontWeight: 700, fontSize: '1.2rem' }}>
          <Building2 size={24} color="#3b82f6" />
          <span>LuxeStay Portal</span>
        </div>
        <p style={{ maxWidth: 500, fontSize: '0.88rem' }}>
          Full-Stack Hotel Booking Application built with React.js, Node.js, Express, and MySQL. Featuring atomic transaction concurrency protection and flexible date discovery.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>ACID Transaction Protected Availability Engine</span>
        </div>
      </div>
    </footer>
  );
}
