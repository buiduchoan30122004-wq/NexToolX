import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { API_URL } from '../config';
import {
  LayoutDashboard,
  Wrench,
  FolderTree,
  Tag,
  Layers,
  Percent,
  BookOpen,
  UserCheck,
  Menu,
  Users,
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';

function Sidebar({ onLogout }) {
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${API_URL}/reviews`);
        if (res.ok) {
          const reviews = await res.json();
          const pendingReviews = reviews.filter(r => r.status === 'pending');
          setReviewCount(pendingReviews.length);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchReviews();
    const interval = setInterval(fetchReviews, 10000); // Check every 10 seconds for real-time notification badge!
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Tools', path: '/tools', icon: Wrench },
    { name: 'Categories', path: '/categories', icon: FolderTree },
    { name: 'Tags', path: '/tags', icon: Tag },
    { name: 'Collections', path: '/collections', icon: Layers },
    { name: 'Deals', path: '/deals', icon: Percent },
    { name: 'Blogs', path: '/blogs', icon: BookOpen },
    { name: 'Authors', path: '/authors', icon: UserCheck },
    { name: 'Menus', path: '/menus', icon: Menu },
    { name: 'Users', path: '/users', icon: Users },
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: Settings,
      subItems: [
        { name: 'AI Config', path: '/settings' },
        { name: 'PayPal Settings', path: '/payment-settings' },
        { name: 'Email Settings', path: '/email-settings' },
        { name: 'Homepage Layouts', path: '/homepage-config' }
      ]
    }
  ];

  return (
    <aside className="crm-sidebar">
      <NavLink to="/" className="sidebar-logo">
        <div className="logo-icon" style={{ width: '32px', height: '32px' }}>
          <Sparkles size={16} fill="#fff" />
        </div>
        <span>NexCRM</span>
      </NavLink>

      <nav style={{ flex: 1 }}>
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name} style={{ display: 'flex', flexDirection: 'column' }}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                  {item.name === 'Tools' && reviewCount > 0 && (
                    <span style={{
                      marginLeft: 'auto',
                      background: 'var(--primary)',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                    }}>
                      {reviewCount}
                    </span>
                  )}
                </NavLink>
                {item.subItems && (
                  <ul className="sidebar-submenu" style={{ listStyle: 'none', paddingLeft: '24px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {item.subItems.map(sub => (
                      <li key={sub.name}>
                        <NavLink 
                          to={sub.path} 
                          style={({ isActive }) => ({
                            display: 'block',
                            padding: '6px 12px',
                            fontSize: '12px',
                            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                            textDecoration: 'none',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: isActive ? '600' : '500',
                            transition: 'var(--transition-smooth)'
                          })}
                        >
                          • {sub.name}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        onClick={onLogout}
        className="sidebar-item"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          textAlign: 'left',
          color: 'var(--accent-rose)'
        }}
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;
