import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../config';
import { User, Calendar, ArrowLeft, ArrowUpRight } from 'lucide-react';

function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogDetail() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/blogs/slug/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setBlog(data);
          
          // Thực thi SEO Best Practice: Cập nhật động Tiêu đề trang và Meta description
          document.title = data.seo_title || `${data.title} | NexToolX Blog`;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute('content', data.meta_description || data.content.substring(0, 160));
          }
        }
      } catch (err) {
        console.error('Error fetching blog details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogDetail();
  }, [slug]);

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="skeleton" style={{ height: '30px', width: '20%' }}></div>
        <div className="skeleton" style={{ height: '60px', width: '80%' }}></div>
        <div className="skeleton" style={{ height: '300px' }}></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>Article Not Found</h2>
        <Link to="/blog" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
          <ArrowLeft size={16} /> Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Link to="/blog" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
        <ArrowLeft size={16} /> Back to Blog
      </Link>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {blog.categories.map(c => (
          <span key={c.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
            {c.name}
          </span>
        ))}
      </div>

      <h1 style={{ fontSize: '42px', fontWeight: '800', lineHeight: '1.2' }}>{blog.title}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#fff' }}>
            {blog.author_name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{blog.author_name}</span>
        </div>
        <span>•</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
          <Calendar size={14} /> {new Date(blog.created_at).toLocaleDateString()}
        </span>
      </div>

      {/* Main Content */}
      <article style={{ fontSize: '17px', lineHeight: '1.8', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {blog.content.split('\n\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </article>

      {/* Related Tools */}
      {blog.related_tools && blog.related_tools.length > 0 && (
        <section style={{ borderTop: '1px solid var(--border)', marginTop: '40px', paddingTop: '32px' }}>
          <h2 style={{ fontSize: '22px', marginBottom: '20px' }}>Mentioned AI Tools in this Article</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {blog.related_tools.map(tool => (
              <div key={tool.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{tool.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>{tool.short_description}</p>
                </div>
                <Link to={`/tool/${tool.slug}`} className="submit-button" style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>View Tool</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default BlogDetail;
