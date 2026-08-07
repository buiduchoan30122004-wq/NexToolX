import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { Mail, Check, RefreshCw } from 'lucide-react';

function EmailSettings() {
  const [resendApiKey, setResendApiKey] = useState('');
  const [resendFromEmail, setResendFromEmail] = useState('');
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
          if (config.resend_api_key) {
            setResendApiKey(config.resend_api_key);
          }
          if (config.resend_from_email) {
            setResendFromEmail(config.resend_from_email);
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
          resend_api_key: resendApiKey.trim(),
          resend_from_email: resendFromEmail.trim()
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
    return <div style={{ color: 'var(--text-secondary)' }}>Loading email settings...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="crm-header">
        <div>
          <h1 style={{ fontSize: '28px' }}>Email Configuration</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Configure email server, API integrations, and automated templates.</p>
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
              <Mail size={18} style={{ color: 'var(--primary)' }} />
              Resend Email Integration Configuration
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              Configure your Resend API credentials to send automated transaction receipts, welcome emails, and marketing campaigns.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600' }}>Resend API Key</label>
                <input
                  type="password"
                  className="form-control"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  placeholder="Enter Resend API Key (re_...)"
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  Starts with "re_". Leave empty to mock email delivery inside the backend logs.
                </p>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: '600' }}>From Email Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={resendFromEmail}
                  onChange={(e) => setResendFromEmail(e.target.value)}
                  placeholder="e.g. NexToolX <onboarding@resend.dev>"
                />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                  Must be a verified sender domain on your Resend dashboard. Defaults to "onboarding@resend.dev".
                </p>
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
              <span>Email settings saved successfully!</span>
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

export default EmailSettings;
