import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="alert alert-danger" role="alert">
      <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600 }}>Something went wrong</p>
        <p style={{ fontSize: '0.88rem', marginTop: 2 }}>{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-sm btn-secondary"
            style={{ marginTop: '0.75rem', background: '#fff' }}
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
