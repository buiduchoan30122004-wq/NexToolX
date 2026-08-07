import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';

function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', gap: '20px'
    }}>
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-rose)',
        animation: 'pulse 2s infinite'
      }}>
        <HelpCircle size={40} />
      </div>
      <div>
        <h1 style={{ fontSize: '48px', fontWeight: '800' }}>404 - Page Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginTop: '8px', maxWidth: '400px' }}>
          Sorry, the page you are looking for does not exist or has been moved to another URL.
        </p>
      </div>
      <Link to="/" className="submit-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', marginTop: '12px' }}>
        <Home size={16} /> Back to Homepage
      </Link>
    </div>
  );
}

export default NotFound;
