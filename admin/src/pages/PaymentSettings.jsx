import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { CreditCard, Check, RefreshCw } from 'lucide-react';

function PaymentSettings() {
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalMode, setPaypalMode] = useState('sandbox');
  const [paypalFastLink, setPaypalFastLink] = useState('');
  const [paypalFeaturedLink, setPaypalFeaturedLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch(`${API_URL}/settings`);
        if (res.ok) {
          const config = await res.json();
          if (config.paypal_fast_track_link) {
            setPaypalFastLink(config.paypal_fast_track_link);
          }
          if (config.paypal_featured_link) {
            setPaypalFeaturedLink(config.paypal_featured_link);
          }
          if (config.paypal_client_id) {
            setPaypalClientId(config.paypal_client_id);
          }
          if (config.paypal_mode) {
            setPaypalMode(config.paypal_mode);
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Could not connect to the backend server.');
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      const res = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paypal_fast_track_link: paypalFastLink.trim(),
          paypal_featured_link: paypalFeaturedLink.trim(),
          paypal_client_id: paypalClientId.trim(),
          paypal_mode: paypalMode
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Error saving settings.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading payment settings...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="crm-header">
        <div>
          <h1 style={{ fontSize: '28px' }}>Payment Gateways</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Configure payment methods, pricing links, and checkout integrations.</p>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-sidebar)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px',
        maxWidth: '1000px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
      }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} style={{ color: 'var(--primary)' }} />
              PayPal Smart Checkout Configuration
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Use PayPal Smart Buttons to allow inline checkout directly on the submit tool page.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '8px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600' }}>PayPal Client ID (Required for inline buttons)</label>
                <input
                  type="text"
                  className="form-control"
                  value={paypalClientId}
                  onChange={(e) => setPaypalClientId(e.target.value)}
                  placeholder="Enter your PayPal Client ID"
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  Retrieve this from your PayPal Developer Dashboard.
                </p>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600' }}>PayPal Environment Mode</label>
                <select
                  className="form-control"
                  value={paypalMode}
                  onChange={(e) => setPaypalMode(e.target.value)}
                  style={{ height: '42px' }}
                >
                  <option value="sandbox">Sandbox (Testing / Development)</option>
                  <option value="production">Production (Live payments)</option>
                </select>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>PayPal Hosted Payment Links</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                If not using inline Smart Checkout, enter your PayPal NCP Hosted links. Users will be redirected to PayPal's page to complete their payment.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: '600' }}>Fast Track PayPal Link ($30)</label>
                  <input
                    type="url"
                    className="form-control"
                    value={paypalFastLink}
                    onChange={(e) => setPaypalFastLink(e.target.value)}
                    placeholder="e.g. https://www.paypal.com/ncp/payment/..."
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: '600' }}>Featured Listing PayPal Link ($100)</label>
                  <input
                    type="url"
                    className="form-control"
                    value={paypalFeaturedLink}
                    onChange={(e) => setPaypalFeaturedLink(e.target.value)}
                    placeholder="e.g. https://www.paypal.com/ncp/payment/..."
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: 'var(--primary)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Check size={16} />
              <span>Payment settings saved successfully!</span>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                fontWeight: '600'
              }}
            >
              {saving ? <RefreshCw size={16} className="spin" /> : null}
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default PaymentSettings;
