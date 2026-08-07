import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';
import ToolCard from '../components/ToolCard';
import { Search as SearchIcon } from 'lucide-react';

function Search() {
  const [searchParams] = useSearchParams();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const query = searchParams.get('q') || '';

  useEffect(() => {
    async function performSearch() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/tools?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          setTools(await res.json());
        }
      } catch (err) {
        console.error('Error performing search:', err);
      } finally {
        setLoading(false);
      }
    }
    if (query) {
      performSearch();
    } else {
      setTools([]);
      setLoading(false);
    }
  }, [query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '36px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <SearchIcon size={28} /> Search Results
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
          Showing results for "{query}"
        </p>
      </div>

      {loading ? (
        <div className="card-grid">
          {[1, 2, 3].map(n => (
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
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            We couldn't find any tools matching your search query. Try searching for a different keyword.
          </p>
        </div>
      )}
    </div>
  );
}

export default Search;
