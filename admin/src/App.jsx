import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import { API_URL } from './config';
import {
  ToolsManager,
  CategoriesManager,
  MenusManager,
  GenericCrudManager,
  HomepageManager
} from './pages/CrudModules';
import { KeyRound, User, Lock, Sparkles } from 'lucide-react';
import SettingsManager from './pages/SettingsManager';
import PaymentSettings from './pages/PaymentSettings';
import EmailSettings from './pages/EmailSettings';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user token is in localStorage
    const token = localStorage.getItem('nextoolx_admin_token');
    if (token) {
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        localStorage.setItem('nextoolx_admin_token', data.token);
        localStorage.setItem('nextoolx_admin_user', JSON.stringify(data.user));
        setIsLoggedIn(true);
        setError('');
      } else {
        setError(data.error || 'Invalid username or password');
      }
    } catch (err) {
      console.error(err);
      setError('Connection refused. Is the backend server running?');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('nextoolx_admin_token');
    localStorage.removeItem('nextoolx_admin_user');
    setIsLoggedIn(false);
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-primary)' }}>Loading CRM...</div>;
  }

  // Render Login Screen if not authenticated
  if (!isLoggedIn) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
        background: 'radial-gradient(circle, var(--bg-card) 0%, var(--bg-primary) 100%)',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '400px', width: '100%', padding: '40px', background: 'var(--bg-secondary)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 40px rgba(16, 185, 129, 0.08)', display: 'flex', flexDirection: 'column', gap: '24px'
        }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)'
            }}>
              <Sparkles size={24} fill="#fff" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>NexToolX CRM</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Sign in to manage AI tools database</p>
          </div>

          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f43f5e', padding: '12px', borderRadius: '8px', fontSize: '13px', fontWeight: '500'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Username</label>
              <input
                type="text"
                className="form-control"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
            </div>
            
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Lock size={14} /> Password</label>
              <input
                type="password"
                className="form-control"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" className="submit-button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
              <KeyRound size={16} />
              <span>Sign In</span>
            </button>
          </form>
          
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
            Demo User: <code style={{ color: 'var(--primary)', fontWeight: '600' }}>admin</code> / Password: <code style={{ color: 'var(--primary)', fontWeight: '600' }}>admin123</code>
          </div>
        </div>
      </div>
    );
  }

  // Render CRM Panel if authenticated
  return (
    <Router>
      <div className="crm-container">
        <Sidebar onLogout={handleLogout} />
        <main className="crm-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tools" element={<ToolsManager />} />
            <Route path="/categories" element={<CategoriesManager />} />
            <Route path="/tags" element={<GenericCrudManager moduleName="Tags" />} />
            <Route path="/collections" element={<GenericCrudManager moduleName="Collections" />} />
            <Route path="/deals" element={<GenericCrudManager moduleName="Deals" />} />
            <Route path="/blogs" element={<GenericCrudManager moduleName="Blogs" />} />
            <Route path="/authors" element={<GenericCrudManager moduleName="Authors" />} />
            <Route path="/menus" element={<MenusManager />} />
            <Route path="/users" element={<GenericCrudManager moduleName="Users" />} />
            <Route path="/settings" element={<SettingsManager />} />
            <Route path="/payment-settings" element={<PaymentSettings />} />
            <Route path="/email-settings" element={<EmailSettings />} />
            <Route path="/homepage-config" element={<HomepageManager />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
