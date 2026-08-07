import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowRight, Sparkles, BookOpen, Star, CheckCircle, Award, ArrowUpRight, ChevronRight, X } from 'lucide-react';
import { API_URL, UPLOADS_URL } from '../config';
import ToolCard from '../components/ToolCard';

function Home() {
  const [homepageConfig, setHomepageConfig] = useState({
    editors_picks: [],
    top_10: [],
    new_free: [],
    top_growing: []
  });
  const [allTools, setAllTools] = useState([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [categories, setCategories] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  // Subscription lead states
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribeName, setSubscribeName] = useState('');
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribePhone, setSubscribePhone] = useState('');
  const [submittingSubscribe, setSubmittingSubscribe] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [modalTriggerSource, setModalTriggerSource] = useState('banner'); // 'banner' or 'auto'

  useEffect(() => {
    const hasShown = sessionStorage.getItem('ai_popup_shown');
    if (!hasShown) {
      const timer = setTimeout(() => {
        setModalTriggerSource('auto');
        setShowSubscribeModal(true);
        setSubscribeSuccess(false);
        sessionStorage.setItem('ai_popup_shown', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const [homeRes, catsRes, blogsRes, toolsRes] = await Promise.all([
          fetch(`${API_URL}/homepage`),
          fetch(`${API_URL}/categories?format=tree`),
          fetch(`${API_URL}/blogs`),
          fetch(`${API_URL}/tools?limit=1000`)
        ]);

        if (homeRes.ok) setHomepageConfig(await homeRes.json());
        if (catsRes.ok) setCategories((await catsRes.json()));
        if (blogsRes.ok) setBlogs((await blogsRes.json()).slice(0, 3));
        if (toolsRes.ok) setAllTools(await toolsRes.json());
      } catch (err) {
        console.error('Error fetching homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchText.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchText.trim())}`);
    }
  };

  const handleSubscribeSubmit = async (e) => {
    e.preventDefault();
    setSubmittingSubscribe(true);
    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subscribeName,
          email: subscribeEmail,
          phone: subscribePhone
        })
      });
      if (res.ok) {
        setSubscribeSuccess(true);
        setSubscribeName('');
        setSubscribeEmail('');
        setSubscribePhone('');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to subscribe. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Could not connect to the server.');
    } finally {
      setSubmittingSubscribe(false);
    }
  };

  const renderLogo = (tool, size = '40px') => {
    if (tool.logo) {
      const logoUrl = tool.logo.startsWith('http') ? tool.logo : `${UPLOADS_URL}${tool.logo}`;
      return (
        <img 
          src={logoUrl} 
          alt="" 
          style={{ width: size, height: size, borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = `<div class="logo-fallback" style="width: ${size}; height: ${size}; border-radius: 8px; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: var(--primary); border: 1px solid var(--border);">${tool.name.charAt(0).toUpperCase()}</div>`;
          }} 
        />
      );
    }
    return (
      <div style={{
        width: size, height: size, borderRadius: '8px',
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-purple) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '700', fontSize: '14px', color: '#fff', border: '1px solid var(--border)'
      }}>
        {tool.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '32px 0 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '9999px', padding: '4px 12px', fontSize: '12px', fontWeight: '500', color: 'var(--primary)' }}>
          <Sparkles size={12} />
          <span>Discover the AI Revolution</span>
        </div>
        <h1 style={{ fontSize: '42px', fontWeight: '800', lineHeight: '1.2', maxWidth: '800px', letterSpacing: '-0.8px' }}>
          Find the Best <span style={{ color: 'var(--primary)' }}>AI Tools</span> for Your Workflow
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
          NexToolX is a curated directory of the world's most powerful artificial intelligence software, updated daily.
        </p>

        {/* Large Search bar */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', width: '100%', maxWidth: '600px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', padding: '6px 12px', boxShadow: 'var(--shadow-glow)', transition: 'var(--transition-smooth)', marginTop: '4px' }}>
          <input
            type="text"
            placeholder="Type 'writing assistant', 'code editor', 'Midjourney'..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '15px', width: '100%', outline: 'none' }}
          />
          <button type="submit" className="submit-button" style={{ padding: '8px 20px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} />
            <span>Search</span>
          </button>
        </form>

        {/* Top AI Tools Categories (Right under search bar) */}
        <div style={{ width: '100%', maxWidth: '720px', marginTop: '8px', textAlign: 'left' }}>
          <h2 style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '8px' }}>Top AI Tools Categories</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-start' }}>
            {categories.slice(0, 5).map(cat => (
              <Link key={cat.id} to={`/browse?category=${cat.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: '20px', textDecoration: 'none', fontSize: '12px', color: 'var(--text-primary)', fontWeight: '500', transition: 'var(--transition-smooth)' }} className="tag-card">
                <span>📁</span>
                <span>{cat.name}</span>
              </Link>
            ))}
            <Link to="/categories" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: '20px', textDecoration: 'none', fontSize: '12px', color: 'var(--primary)', fontWeight: '600', transition: 'var(--transition-smooth)' }} className="tag-card">
              <span>All categories ➔</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Discover AI Tools Directory Grid */}
      {allTools.length > 0 && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800' }}>⚡ Discover AI Tools</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Explore the complete index of verified artificial intelligence software.</p>
            </div>
            <Link to="/browse" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Browse Catalogue ➔</Link>
          </div>

          <div className="card-grid">
            {allTools.slice(0, visibleCount).map(tool => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>

          {visibleCount < allTools.length && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
              <button 
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="submit-button"
                style={{ padding: '12px 32px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none' }}
              >
                <span>Show More ({allTools.length - visibleCount} remaining / {allTools.length} total)</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>
      )}

      {/* Editors' Picks Carousel */}
      {homepageConfig.editors_picks.length > 0 && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={22} style={{ color: 'var(--primary)' }} /> Editor's Picks</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Hand-picked by our editorial team — the best AI tools worth your attention this week.</p>
            </div>
            <Link to="/browse?featured=true" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>See all picks ➔</Link>
          </div>

          <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '16px' }} className="no-scrollbar">
            {homepageConfig.editors_picks.map(tool => (
              <Link key={tool.id} to={`/tool/${tool.slug}`} style={{ flex: '0 0 280px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', textDecoration: 'none', transition: 'var(--transition-smooth)' }} className="tool-card">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {renderLogo(tool, '36px')}
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {tool.name}
                      {tool.verified === 1 && <CheckCircle size={14} style={{ color: 'var(--accent-emerald)' }} />}
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tool.pricing_type}</span>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', height: '60px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: '3', WebkitBoxOrient: 'vertical' }}>
                  {tool.short_description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-amber)', fontSize: '12px', fontWeight: '700' }}>
                    <Star size={12} fill="currentColor" />
                    <span>{tool.rating ? Number(tool.rating).toFixed(1) : '—'}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>({tool.reviewCount || 0})</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    Details <ChevronRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top 10 AI Tools Horizontal Ranked list */}
      {homepageConfig.top_10.length > 0 && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>🏆 Top 10 AI Tools</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>The most widely used AI tools right now, ranked by popularity across our directory.</p>
            </div>
            <Link to="/browse" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>Popular AI ➔</Link>
          </div>

          <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '16px' }} className="no-scrollbar">
            {homepageConfig.top_10.map((tool, index) => (
              <Link key={tool.id} to={`/tool/${tool.slug}`} style={{ flex: '0 0 280px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', textDecoration: 'none', transition: 'var(--transition-smooth)', position: 'relative' }} className="tool-card">
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: '800', color: 'var(--primary)' }}>
                  #{index + 1}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                  {renderLogo(tool, '40px')}
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {tool.name}
                      {tool.verified === 1 && <CheckCircle size={14} style={{ color: 'var(--accent-emerald)' }} />}
                    </h3>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tool.pricing_type}</span>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', height: '40px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}>
                  {tool.short_description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-amber)', fontSize: '12px', fontWeight: '700' }}>
                    <Star size={12} fill="currentColor" />
                    <span>{tool.rating ? Number(tool.rating).toFixed(1) : '—'}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>View ➔</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Side-by-Side: New Free AI Tools & Top Growing */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '20px' }} className="detail-layout">
        {/* Left Column: New Free AI Tools */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '4px solid #10b981', paddingLeft: '10px', margin: 0, lineHeight: '1.2' }}>
              🆕 New Free AI Tools
            </h2>
            <Link to="/browse?pricing=Free" style={{ fontSize: '13px', color: '#10b981', textDecoration: 'none', fontWeight: '700' }}>
              Free AI ≫
            </Link>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '8px 0 16px' }}>The newest free AI tools just added to our directory.</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {homepageConfig.new_free.length > 0 ? (
              homepageConfig.new_free.map((tool, idx) => (
                <Link 
                  key={tool.id} 
                  to={`/tool/${tool.slug}`} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '14px 10px', 
                    textDecoration: 'none', 
                    borderBottom: idx === homepageConfig.new_free.length - 1 ? 'none' : '1px solid var(--border)',
                    transition: 'var(--transition-smooth)'
                  }} 
                  className="tool-list-row-hover"
                >
                  {renderLogo(tool, '24px')}
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                    {tool.name}
                  </span>
                  {tool.verified === 1 && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} title="Verified"></span>
                  )}
                </Link>
              ))
            ) : (
              <div style={{ padding: '24px', border: '1px dashed var(--border)', borderRadius: '8px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>No new free tools configured.</div>
            )}
          </div>
        </div>

        {/* Right Column: Top Growing */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border)', paddingBottom: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '4px solid #10b981', paddingLeft: '10px', margin: 0, lineHeight: '1.2' }}>
              🔥 Top Growing
            </h2>
            <Link to="/browse" style={{ fontSize: '13px', color: '#10b981', textDecoration: 'none', fontWeight: '700' }}>
              Trending AI ≫
            </Link>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '8px 0 16px' }}>Tools seeing the fastest growth in traffic right now.</p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {homepageConfig.top_growing.length > 0 ? (
              homepageConfig.top_growing.map((tool, idx) => (
                <Link 
                  key={tool.id} 
                  to={`/tool/${tool.slug}`} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    padding: '14px 10px', 
                    textDecoration: 'none', 
                    borderBottom: idx === homepageConfig.top_growing.length - 1 ? 'none' : '1px solid var(--border)',
                    transition: 'var(--transition-smooth)'
                  }} 
                  className="tool-list-row-hover"
                >
                  {renderLogo(tool, '24px')}
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '14px' }}>
                    {tool.name}
                  </span>
                  {tool.verified === 1 && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} title="Verified"></span>
                  )}
                </Link>
              ))
            ) : (
              <div style={{ padding: '24px', border: '1px dashed var(--border)', borderRadius: '8px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>No growing tools configured.</div>
            )}
          </div>
        </div>
      </section>

      {/* Call-to-Action Promo Card Banner */}
      <section style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(79, 70, 229, 0.1) 100%)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
        boxShadow: 'var(--shadow-glow)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>🚀 Embrace the Power of AI!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            Artificial Intelligence is shifting landscapes at lightning speed. Stay ahead of the curve by subscribing to our newsletter to receive curated lists of the absolute latest AI releases, exclusive promo codes, and tech discount offers straight to your inbox.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={() => { setShowSubscribeModal(true); setSubscribeSuccess(false); setModalTriggerSource('banner'); }} 
            className="submit-button" 
            style={{ padding: '12px 32px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}
          >
            <span>Subscribe for Free AI Updates</span>
            <ArrowRight size={16} />
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>Join thousands of AI professionals today.</span>
        </div>
      </section>

      {/* Latest Blogs & Directory Description */}
      <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }} className="detail-layout">
        {/* Directory Intro description */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>👋 The Top AI tools for your needs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
            <strong>NexToolX</strong> is an AI tool discovery platform that helps you find the right tools for your needs. Explore and compare thousands of AI tools, updated daily across every category. Since January 2026, we've helped millions of AI users, professionals, and businesses discover, compare, and explore the best AI tools.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
            Don't miss what's happening in AI. We go beyond simple indexing and categorization. Describe the task you want to accomplish to find the right tool, discover the latest launches, explore curated categories, compare alternatives, and get personalized AI picks.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            <Link to="/browse" style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '16px', textDecoration: 'none', color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>🔍 AI Search</Link>
            <Link to="/categories" style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '16px', textDecoration: 'none', color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>📁 All Categories</Link>
            <Link to="/browse?featured=true" style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--border)', borderRadius: '16px', textDecoration: 'none', color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>⭐ Top 100 AI</Link>
          </div>
        </div>

        {/* Latest Blogs list */}
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px' }}>Latest from the Blog</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {blogs.map(post => (
              <Link key={post.id} to={`/blog/${post.slug}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px', textDecoration: 'none', transition: 'var(--transition-smooth)' }} className="tool-card">
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '600' }}>By {post.author_name}</span>
                <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>{post.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>{post.content}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe Lead Modal */}
      {showSubscribeModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '36px',
            width: '90%',
            maxWidth: '760px',
            position: 'relative',
            boxShadow: 'var(--shadow-glow)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            {/* Close 'X' Button */}
            <button 
              onClick={() => setShowSubscribeModal(false)} 
              style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '16px', 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-secondary)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '50%',
                zIndex: 10,
                transition: 'var(--transition-smooth)'
              }}
              className="tag-card"
            >
              <X size={18} />
            </button>

            {!subscribeSuccess ? (
              <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                {/* Left Side: Copys & Bullets */}
                <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '12px' }}>
                  <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, lineHeight: '1.2' }}>
                    {modalTriggerSource === 'auto' ? '🔥 Don\'t Get Left Behind by AI!' : 'Subscribe for AI Updates'}
                  </h2>
                  <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                    {modalTriggerSource === 'auto' 
                      ? 'AI is replacing jobs and transforming careers every single day. Don\'t get left behind. Subscribe to receive the latest AI releases, guides, and tech codes to secure your edge!' 
                      : 'Fill in your contact details below to join our premium newsletter and stay ahead of the AI revolution!'}
                  </p>
                  
                  {/* Small bullet points for value representation */}
                  <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🟢 Curated list of newest AI launches</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🟢 Exclusive promo codes & discounts</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>🟢 Step-by-step AI workflows & guides</li>
                  </ul>
                </div>

                {/* Right Side: Form Inputs */}
                <form onSubmit={handleSubscribeSubmit} style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Your Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      placeholder="e.g. John Doe"
                      value={subscribeName} 
                      onChange={(e) => setSubscribeName(e.target.value)} 
                      style={{ width: '100%', padding: '8px 12px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Email Address *</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      required 
                      placeholder="e.g. john@example.com"
                      value={subscribeEmail} 
                      onChange={(e) => setSubscribeEmail(e.target.value)} 
                      style={{ width: '100%', padding: '8px 12px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Phone Number (Optional)</label>
                    <input 
                      type="tel" 
                      className="form-control" 
                      placeholder="e.g. +1 234 567 890"
                      value={subscribePhone} 
                      onChange={(e) => setSubscribePhone(e.target.value)} 
                      style={{ width: '100%', padding: '8px 12px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowSubscribeModal(false)} 
                      className="btn btn-secondary" 
                      style={{ flex: 1, padding: '8px', fontSize: '14px', borderRadius: '8px', border: '1px solid var(--border)', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="submit-button" 
                      disabled={submittingSubscribe}
                      style={{ flex: 2, padding: '8px', fontSize: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
                    >
                      {submittingSubscribe ? 'Subscribing...' : 'Subscribe Now'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 0', gap: '16px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <CheckCircle size={36} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>Subscription Successful!</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Thank you for subscribing! You have successfully registered to our premium newsletter. We\'ll keep you updated with the latest AI tools and promotions.
                </p>
                <button 
                  onClick={() => setShowSubscribeModal(false)} 
                  className="submit-button"
                  style={{ width: '100%', maxWidth: '240px', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '8px' }}
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
