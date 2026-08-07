import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { ArrowRight, Layers } from 'lucide-react';

function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCollections() {
      try {
        const res = await fetch(`${API_URL}/collections`);
        if (res.ok) {
          setCollections(await res.json());
        }
      } catch (err) {
        console.error('Error fetching collections:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCollections();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '36px' }}>Curated AI Collections</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Explore our hand-picked selections of the best AI tools grouped by task and trend.</p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="skeleton" style={{ height: '140px', borderRadius: 'var(--radius-lg)' }}></div>
          ))}
        </div>
      ) : collections.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {collections.map(coll => (
            <Link
              key={coll.id}
              to={`/browse?collection=${coll.slug}`}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                textDecoration: 'none',
                transition: 'var(--transition-smooth)'
              }}
              className="tool-card"
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <Layers size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{coll.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{coll.description}</p>
                </div>
              </div>
              <ArrowRight size={20} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No collections found.</p>
        </div>
      )}
    </div>
  );
}

export default Collections;
