import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { KeyRound, Check, RefreshCw, Eye, EyeOff } from 'lucide-react';

function SettingsManager() {
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [showKey, setShowKey] = useState(false);
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
          if (config.gemini_api_key) {
            setApiKey(config.gemini_api_key);
          }
          if (config.gemini_model) {
            setSelectedModel(config.gemini_model);
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
          gemini_api_key: apiKey.trim(),
          gemini_model: selectedModel
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
    return <div style={{ color: 'var(--text-secondary)' }}>Loading settings page...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="crm-header">
        <div>
          <h1 style={{ fontSize: '28px' }}>System Settings</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Configure API keys and execution models for the AI Agents.</p>
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
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={16} style={{ color: 'var(--primary)' }} />
                Google Gemini API Key
              </label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                This API key is used specifically for scraping websites, parsing project info, and running all AI Auto-Fill features.
              </p>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showKey ? "text" : "password"}
                  className="form-control"
                  style={{ paddingRight: '45px', fontFamily: showKey ? 'monospace' : 'inherit' }}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API Key starting with AIzaSy..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Get a free API key from <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: '600', textDecoration: 'none' }}>Google AI Studio</a>.
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: '600' }}>
                Gemini Model
              </label>
              <select
                className="form-control"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{ height: '42px' }}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended - Fast, Smart)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Highly Accurate, Slower)</option>
              </select>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
                Select the Gemini model to run tasks. Flash models are recommended for web scraping due to speed and cost efficiency.
              </p>
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
              <span>Settings saved successfully!</span>
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

export default SettingsManager;
