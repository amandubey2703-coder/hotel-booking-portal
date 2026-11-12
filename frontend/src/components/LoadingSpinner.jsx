import React from 'react';

export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
      <div className="spinner spinner-primary"></div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500, marginTop: '1rem' }}>
        {message}
      </p>
    </div>
  );
}
