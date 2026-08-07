import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { BookOpen, User, Calendar, ArrowRight } from 'lucide-react';

function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const res = await fetch(`${API_URL}/blogs`);
        if (res.ok) {
          setBlogs(await res.json());
        }
      } catch (err) {
        console.error('Error fetching blogs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '36px' }}>NexToolX Blog</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Stay updated with the latest AI trends, tutorials, and insights from industry experts.</p>
      </div>

      {loading ? (
        <div className="card-grid">
          {[1, 2, 3].map(n => (
            <div key={n} className="skeleton" style={{ height: '260px', borderRadius: 'var(--radius-lg)' }}></div>
          ))}
        </div>
      ) : blogs.length > 0 ? (
        <div className="card-grid">
          {blogs.map(post => (
            <div key={post.id} className="tool-card" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {post.categories.map(c => (
                  <span key={c.id} style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)' }}>
                    {c.name}
                  </span>
                ))}
              </div>

              <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', marginTop: '8px' }}>{post.title}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineBreak: 'anywhere', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '60px' }}>
                {post.content}
              </p>

              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={14} /> {post.author_name}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} /> {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>

              <Link
                to={`/blog/${post.slug}`}
                className="submit-button"
                style={{
                  padding: '10px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', marginTop: '16px'
                }}
              >
                <span>Read Full Article</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No articles found.</p>
        </div>
      )}
    </div>
  );
}

export default Blog;
