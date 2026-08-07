import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';
import ToolCard from '../components/ToolCard';
import { Filter, Star, RefreshCw } from 'lucide-react';

function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tools, setTools] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy các tham số bộ lọc từ URL
  const activeCategory = searchParams.get('category') || '';
  const activeTag = searchParams.get('tag') || '';
  const activePricing = searchParams.get('pricing') || '';

  useEffect(() => {
    async function fetchFilters() {
      try {
        const [catsRes, tagsRes] = await Promise.all([
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/tags`)
        ]);
        if (catsRes.ok) setCategories(await catsRes.json());
        if (tagsRes.ok) setTags(await tagsRes.json());
      } catch (err) {
        console.error('Error fetching filters:', err);
      }
    }
    fetchFilters();
  }, []);

  useEffect(() => {
    async function fetchTools() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (activeCategory) queryParams.append('category', activeCategory);
        if (activeTag) queryParams.append('tag', activeTag);
        if (activePricing) queryParams.append('pricing', activePricing);
        
        const res = await fetch(`${API_URL}/tools?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setTools(data);
        }
      } catch (err) {
        console.error('Error fetching tools:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTools();
  }, [activeCategory, activeTag, activePricing]);

  const handlePricingChange = (pricingType) => {
    const params = new URLSearchParams(searchParams);
    if (activePricing === pricingType) {
      params.delete('pricing');
    } else {
      params.set('pricing', pricingType);
    }
    setSearchParams(params);
  };

  const handleCategorySelect = (slug) => {
    const params = new URLSearchParams(searchParams);
    if (activeCategory === slug) {
      params.delete('category');
    } else {
      params.set('category', slug);
    }
    setSearchParams(params);
  };

  const handleTagSelect = (slug) => {
    const params = new URLSearchParams(searchParams);
    if (activeTag === slug) {
      params.delete('tag');
    } else {
      params.set('tag', slug);
    }
    setSearchParams(params);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '36px' }}>Browse AI Tools</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Explore and filter the leading artificial intelligence directory.</p>
      </div>

      <div className="detail-layout">
        {/* Sidebar Filters */}
        <aside className="detail-sidebar" style={{ gap: '20px' }}>
          <div className="detail-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                <Filter size={16} /> Filters
              </span>
              {(activeCategory || activeTag || activePricing) && (
                <button onClick={resetFilters} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RefreshCw size={12} /> Reset
                </button>
              )}
            </div>

            {/* Pricing Filter */}
            <div>
              <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '10px' }}>Pricing Type</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Free', 'Freemium', 'Paid', 'Free Trial'].map(p => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={activePricing === p}
                      onChange={() => handlePricingChange(p)}
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>

            {/* Categories Filter */}
            <div>
              <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '10px' }}>Categories</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug)}
                    style={{
                      textAlign: 'left',
                      padding: '6px 8px',
                      background: activeCategory === cat.slug ? 'var(--primary)' : 'transparent',
                      color: activeCategory === cat.slug ? '#fff' : 'var(--text-secondary)',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            <div>
              <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '10px' }}>Tags</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {tags.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleTagSelect(t.slug)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: activeTag === t.slug ? 'var(--primary)' : 'var(--border)',
                      background: activeTag === t.slug ? 'var(--primary-glow)' : 'transparent',
                      color: activeTag === t.slug ? '#fff' : 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Tools Grid Area */}
        <div className="detail-main">
          {loading ? (
            <div className="card-grid">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="tool-card skeleton" style={{ height: '220px' }}></div>
              ))}
            </div>
          ) : tools.length > 0 ? (
            <div className="card-grid">
              {tools.map(tool => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>No tools match your criteria. Try adjusting the filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Browse;
