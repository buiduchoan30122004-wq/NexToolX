import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL, UPLOADS_URL } from '../config';
import { Star, CheckCircle, Award, ExternalLink, Bookmark, MessageSquare, ArrowLeft, ChevronDown, ChevronUp, Info, DollarSign, Zap, Users, Layers } from 'lucide-react';

function ToolDetail() {
  const { slug } = useParams();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarTools, setSimilarTools] = useState([]);
  const [featuredTools, setFeaturedTools] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [activeScreenshot, setActiveScreenshot] = useState(null);
  
  // Review form states
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Scrollspy active tab state
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: <Info size={14} /> },
    { id: 'pricing', label: 'Pricing', icon: <DollarSign size={14} /> },
    { id: 'reviews', label: 'Reviews', icon: <MessageSquare size={14} /> },
    { id: 'features', label: 'Features', icon: <CheckCircle size={14} /> },
    { id: 'use-cases', label: 'Use Cases', icon: <Zap size={14} /> },
    { id: 'who-is-it-for', label: 'Who\'s it for', icon: <Users size={14} /> },
    { id: 'alternatives', label: 'Alternatives', icon: <Layers size={14} /> }
  ];

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      // Offset for sticky nav tab
      const headerOffset = 80; 
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(id);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // offset
      
      const active = sections.find(sec => {
        const element = document.getElementById(sec.id);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          return scrollPosition >= top && scrollPosition < top + height;
        }
        return false;
      });
      
      if (active) {
        setActiveSection(active.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tool]);

  useEffect(() => {
    async function fetchToolDetail() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/tools/slug/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setTool(data);
          
          // Set initial active screenshot (banner)
          if (data.gallery && data.gallery.length > 0) {
            setActiveScreenshot(data.gallery[0].media_url);
          } else {
            setActiveScreenshot(data.og_image || null);
          }
          
          // SEO Metadata dynamic loading
          document.title = data.seo_title || `${data.name} | Features, Review & Pricing | NexToolX`;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute('content', data.meta_description || data.short_description);
          }

          // Fetch similar and featured tools
          try {
            const toolsRes = await fetch(`${API_URL}/tools`);
            if (toolsRes.ok) {
              const allTools = await toolsRes.json();
              
              // Similar tools (alternatives)
              const currentCatIds = data.categories.map(c => c.id);
              const filteredSimilar = allTools
                .filter(t => t.id !== data.id && t.categories.some(c => currentCatIds.includes(c.id)))
                .slice(0, 6);
              setSimilarTools(filteredSimilar);

              // Featured tools for sidebar
              const filteredFeatured = allTools
                .filter(t => t.featured === 1)
                .slice(0, 8);
              setFeaturedTools(filteredFeatured);
            }
          } catch (simErr) {
            console.error('Error fetching similar/featured tools:', simErr);
          }

          // Fetch top categories
          try {
            const catRes = await fetch(`${API_URL}/categories`);
            if (catRes.ok) {
              const cats = await catRes.json();
              setAllCategories(cats.slice(0, 10));
            }
          } catch (catErr) {
            console.error('Error fetching categories:', catErr);
          }
        }
      } catch (err) {
        console.error('Error fetching tool details:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchToolDetail();
  }, [slug]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewerName.trim() || !reviewContent.trim()) return;

    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_id: tool.id,
          rating,
          content: reviewContent,
          reviewer_name: reviewerName,
          status: 'pending' // Review requires admin approval
        })
      });

      if (res.ok) {
        setReviewSubmitted(true);
        setReviewerName('');
        setReviewContent('');
        setRating(5);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
        <div className="skeleton" style={{ height: '30px', width: '150px' }}></div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
          <div className="skeleton" style={{ height: '400px' }}></div>
          <div className="skeleton" style={{ height: '300px' }}></div>
        </div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <h2>AI Tool Not Found</h2>
        <Link to="/browse" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
          <ArrowLeft size={16} /> Back to Browse
        </Link>
      </div>
    );
  }

  const renderLogo = () => {
    if (tool.logo) {
      const logoUrl = tool.logo.startsWith('http') ? tool.logo : `${UPLOADS_URL}${tool.logo}`;
      return <img src={logoUrl} alt={`${tool.name} logo`} style={{ width: '90px', height: '90px', borderRadius: '18px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', border: '1px solid var(--border)' }} />;
    }
    return (
      <div style={{
        width: '90px', height: '90px', borderRadius: '18px',
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '700', fontSize: '36px', color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        {tool.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  // Safe parsing of AI Scraped detailed fields
  let keyFeatures = [];
  try {
    keyFeatures = tool.key_features ? JSON.parse(tool.key_features) : [];
  } catch (_) { keyFeatures = []; }

  let useCases = [];
  try {
    useCases = tool.use_cases ? JSON.parse(tool.use_cases) : [];
  } catch (_) { useCases = []; }

  let whoIsItFor = [];
  try {
    whoIsItFor = tool.who_is_it_for ? JSON.parse(tool.who_is_it_for) : [];
  } catch (_) { whoIsItFor = []; }

  let pricingPlans = [];
  try {
    pricingPlans = tool.pricing_plans ? JSON.parse(tool.pricing_plans) : [];
  } catch (_) { pricingPlans = []; }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1280px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      {/* Breadcrumb link */}
      <Link to="/browse" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
        <ArrowLeft size={16} /> Back to Browse
      </Link>

      {/* Hero Header Card (TopAI.tools Monogram Style) */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '32px',
        display: 'flex',
        gap: '32px',
        alignItems: 'center',
        flexWrap: 'wrap',
        position: 'relative',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
      }}>
        {/* Left Side: Logo */}
        <div style={{ flexShrink: 0 }}>
          {renderLogo()}
        </div>

        {/* Center: Title & Short Desc */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{tool.name}</h1>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className={`tool-pricing-tag pricing-${tool.pricing_type.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '20px', fontWeight: '700' }}>
                {tool.pricing_type}
              </span>
              {tool.verified === 1 && (
                <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', padding: '2px 10px', borderRadius: '20px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={12} fill="currentColor" style={{ color: '#fff' }} /> Verified
                </span>
              )}
              {tool.featured === 1 && (
                <span style={{ fontSize: '12px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-amber)', padding: '2px 10px', borderRadius: '20px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Award size={12} /> Featured
                </span>
              )}
            </div>
          </div>

          {/* Star rating summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <div style={{ display: 'flex', color: 'var(--accent-amber)', gap: '2px' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill={i < Math.round(tool.rating || 0) ? 'currentColor' : 'none'} />
              ))}
            </div>
            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{tool.rating ? Number(tool.rating).toFixed(1) : '0.0'}</span>
            <span style={{ color: 'var(--text-muted)' }}>({tool.reviewCount || 0} reviews)</span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', margin: '4px 0 0 0', lineHeight: '1.6' }}>
            {tool.short_description}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            {tool.categories.map(c => (
              <Link key={c.id} to={`/browse?category=${c.slug}`} style={{ fontSize: '12px', color: 'var(--primary)', background: 'rgba(16, 185, 129, 0.08)', padding: '3px 10px', borderRadius: '4px', textDecoration: 'none', fontWeight: '600' }}>
                {c.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Side: CTA Button */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', minWidth: '220px' }}>
          <a
            href={`${API_URL}/redirect/${tool.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="submit-button"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', flex: 1, padding: '12px 24px', fontSize: '15px'
            }}
          >
            <span>Visit Website</span>
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Interactive Photo Gallery (Screenshots) */}
      {activeScreenshot && (
        <div className="detail-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Screenshots & Interface</h2>
          
          <div style={{ 
            width: '100%', 
            height: '420px', 
            borderRadius: '12px', 
            overflow: 'hidden', 
            border: '1px solid var(--border)',
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src={activeScreenshot.startsWith('http') ? activeScreenshot : `${UPLOADS_URL}${activeScreenshot}`} 
              alt={`${tool.name} preview`} 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
            />
          </div>

          {tool.gallery && tool.gallery.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
              {tool.gallery.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveScreenshot(img.media_url)}
                  style={{
                    border: activeScreenshot === img.media_url ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    width: '90px',
                    height: '60px',
                    padding: 0,
                    flexShrink: 0,
                    background: 'none',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                >
                  <img 
                    src={img.media_url.startsWith('http') ? img.media_url : `${UPLOADS_URL}${img.media_url}`} 
                    alt="thumbnail" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky Scrollspy Navigation Tabs */}
      <div style={{
        position: 'sticky',
        top: '0px',
        zIndex: 100,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        margin: '0 -20px',
        padding: '0 20px',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        {sections.map(sec => {
          if (sec.id === 'pricing' && (!pricingPlans || pricingPlans.length === 0)) return null;
          if (sec.id === 'features' && (!keyFeatures || keyFeatures.length === 0)) return null;
          if (sec.id === 'use-cases' && (!useCases || useCases.length === 0)) return null;
          if (sec.id === 'who-is-it-for' && (!whoIsItFor || whoIsItFor.length === 0)) return null;
          if (sec.id === 'alternatives' && (!similarTools || similarTools.length === 0)) return null;
          
          return (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeSection === sec.id ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeSection === sec.id ? 'var(--primary)' : 'var(--text-secondary)',
                padding: '16px 20px',
                fontSize: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {sec.icon}
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Layout */}
      <div className="detail-layout" style={{ marginTop: '10px' }}>
        {/* Left Column (Main Content) */}
        <div className="detail-main" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Overview Section */}
          <div id="overview" className="detail-card">
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>What is {tool.name}?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.8', whiteSpace: 'pre-line', margin: 0 }}>
              {tool.full_description || tool.short_description}
            </p>
          </div>

          {/* Pricing Plans Section */}
          {pricingPlans && pricingPlans.length > 0 && (
            <div id="pricing" className="detail-card" style={{ scrollMarginTop: '60px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <DollarSign size={22} style={{ color: 'var(--primary)' }} /> {tool.name} Pricing
                <span style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-emerald)', padding: '2px 10px', borderRadius: '20px', fontWeight: '700', marginLeft: '8px' }}>
                  {tool.pricing_type}
                </span>
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {pricingPlans.map((plan, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>{plan.name}</span>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{plan.price}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ℹ️ Verify prices on the official page.</span>
                <a href={`${API_URL}/redirect/${tool.id}`} target="_blank" rel="noopener noreferrer" className="submit-button" style={{ padding: '8px 20px', fontSize: '14px', textDecoration: 'none' }}>
                  Start free trial
                </a>
              </div>
            </div>
          )}

          {/* Reviews List Section */}
          <div id="reviews" className="detail-card" style={{ width: '100%', boxSizing: 'border-box', scrollMarginTop: '60px' }}>
            <h2 style={{ fontSize: '22px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: 'var(--text-primary)' }}>
              <MessageSquare size={20} style={{ color: 'var(--primary)' }} /> {tool.name} User Reviews
            </h2>

            {/* Rating Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-amber)' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill={i < Math.round(tool.rating || 0) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {tool.rating ? Number(tool.rating).toFixed(1) : '0.0'} out of 5 ({tool.reviewCount || 0} review{tool.reviewCount === 1 ? '' : 's'})
              </span>
              {tool.reviews && tool.reviews.length > 0 && (
                <button 
                  onClick={() => setShowAllReviews(!showAllReviews)}
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginLeft: 'auto'
                  }}
                >
                  <span>{showAllReviews ? 'Hide Reviews' : 'Show Reviews'}</span>
                  {showAllReviews ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}
            </div>

            {/* Collapsible Reviews Content */}
            {showAllReviews && tool.reviews && tool.reviews.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {tool.reviews.map(rev => (
                  <div key={rev.id} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-purple) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: '700',
                          fontSize: '14px',
                          textTransform: 'uppercase',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          {rev.reviewer_name ? rev.reviewer_name.charAt(0) : 'A'}
                        </div>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{rev.reviewer_name}</span>
                      </div>
                      <div style={{ display: 'flex', color: 'var(--accent-amber)', gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < rev.rating ? 'currentColor' : 'none'} />
                        ))}
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>{rev.content}</p>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
                      Posted on {new Date(rev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!tool.reviews || tool.reviews.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>No reviews yet. Be the first to share your experience!</p>
            ) : null}

            {/* Write a review Form */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '16px', fontWeight: '700' }}>Write a Review</h3>
              {reviewSubmitted ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', padding: '16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Thank you! Your review has been submitted and is pending approval from our team.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Your Name</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={reviewerName}
                        onChange={(e) => setReviewerName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="form-group">
                      <label>Rating (1-5 Stars)</label>
                      <select
                        className="form-control"
                        value={rating}
                        onChange={(e) => setRating(parseInt(e.target.value))}
                      >
                        {[5, 4, 3, 2, 1].map(n => (
                          <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Review Description</label>
                    <textarea
                      rows="4"
                      className="form-control"
                      required
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      placeholder="Share your thoughts about this tool..."
                    ></textarea>
                  </div>
                  <button type="submit" className="submit-button" style={{ padding: '10px 24px', fontSize: '14px' }}>
                    Submit Review
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Key Features Section */}
          {keyFeatures && keyFeatures.length > 0 && (
            <div id="features" className="detail-card" style={{ scrollMarginTop: '60px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <CheckCircle size={22} style={{ color: 'var(--primary)' }} /> {tool.name}'s Key Features
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {keyFeatures.map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                    <CheckCircle size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} fill="rgba(16, 185, 129, 0.1)" />
                    <span style={{ fontSize: '14.5px', color: 'var(--text-primary)', lineHeight: '1.5' }}>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Use Cases Section */}
          {useCases && useCases.length > 0 && (
            <div id="use-cases" className="detail-card" style={{ scrollMarginTop: '60px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <Zap size={22} style={{ color: 'var(--primary)' }} /> {tool.name} Use Cases
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {useCases.map((uc, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px' }}>
                    <Zap size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} fill="rgba(16, 185, 129, 0.1)" />
                    <span style={{ fontSize: '14.5px', color: 'var(--text-primary)', lineHeight: '1.5' }}>{uc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Who is it for Section */}
          {whoIsItFor && whoIsItFor.length > 0 && (
            <div id="who-is-it-for" className="detail-card" style={{ scrollMarginTop: '60px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <Users size={22} style={{ color: 'var(--primary)' }} /> Who is it for?
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                {whoIsItFor.map((w, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
                    <Users size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{w}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Tools Block (Alternatives) */}
          {similarTools && similarTools.length > 0 && (
            <div id="alternatives" className="detail-card" style={{ scrollMarginTop: '60px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>Similar to {tool.name}</h2>
                <Link to="/browse" style={{ fontSize: '13.5px', color: 'var(--primary)', fontWeight: '700', textDecoration: 'none' }}>See all alternatives &rarr;</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {similarTools.map(sim => (
                  <Link key={sim.id} to={`/tool/${sim.slug}`} style={{ display: 'flex', flexDirection: 'column', gap: '12px', textDecoration: 'none', color: 'inherit', padding: '20px', borderRadius: '12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', transition: 'all 0.2s' }} className="tool-list-row-hover">
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ flexShrink: 0, width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <img 
                          src={sim.logo ? (sim.logo.startsWith('http') ? sim.logo : `${UPLOADS_URL}${sim.logo}`) : `https://via.placeholder.com/44`} 
                          alt={sim.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.parentNode.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:var(--primary); color:#fff; font-weight:700; font-size:14px;">${sim.name.charAt(0).toUpperCase()}</div>`;
                          }}
                        />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h4 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sim.name}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {sim.pricing_type}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5', height: '38px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {sim.short_description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Sidebar) */}
        <aside className="detail-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Tool Info Details Card */}
          <div className="detail-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0', borderBottom: '1px solid var(--border)', paddingBottom: '10px', color: 'var(--text-primary)' }}>Tool Details</h3>
            
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Pricing Model</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span className={`tool-pricing-tag pricing-${tool.pricing_type.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '13px', padding: '4px 12px' }}>
                  {tool.pricing_type}
                </span>
              </div>
              {tool.pricing_details && <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', lineHeight: '1.4' }}>{tool.pricing_details}</p>}
            </div>

            {/* Tags */}
            {tool.tags && tool.tags.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                  Features & Tags
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {tool.tags.map(t => (
                    <span key={t.id} className="tag" style={{ borderLeft: `3px solid ${t.color || '#10b981'}`, background: 'var(--bg-tertiary)', fontSize: '12px', padding: '4px 8px' }}>
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Deals Block */}
          {tool.deals && tool.deals.length > 0 && (
            <div className="detail-card" style={{ border: '1px solid var(--primary)', background: 'rgba(16, 185, 129, 0.02)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--accent-amber)', textTransform: 'uppercase', fontWeight: '700', display: 'block' }}>
                🔥 Special Deals
              </span>
              {tool.deals.map(deal => (
                <div key={deal.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderBottom: '1px dashed var(--border)', paddingBottom: '12px' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>{deal.title}</h4>
                  {deal.discount && <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-emerald)' }}>Discount: {deal.discount}</div>}
                  {deal.coupon && (
                    <div style={{ background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '4px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', border: '1px dashed var(--border)' }}>
                      Code: <code>{deal.coupon}</code>
                    </div>
                  )}
                  <a href={deal.affiliate_link || tool.affiliate_url || tool.website_url} target="_blank" rel="noreferrer" className="submit-button" style={{ padding: '8px 16px', fontSize: '13px', textDecoration: 'none', width: '100%', boxSizing: 'border-box' }}>
                    Claim Deal
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Featured Pinned Tools Block */}
          {featuredTools && featuredTools.length > 0 && (
            <div className="detail-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '10px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Featured 🌟
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {featuredTools.map(f => (
                  <a
                    key={f.id}
                    href={f.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      textDecoration: 'none',
                      color: 'var(--text-primary)',
                      transition: 'all 0.2s'
                    }}
                    className="tool-list-row-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                        <img
                          src={f.logo ? (f.logo.startsWith('http') ? f.logo : `${UPLOADS_URL}${f.logo}`) : `https://via.placeholder.com/28`}
                          alt={f.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <span style={{ fontSize: '13.5px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name}
                      </span>
                    </div>
                    <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Top Categories Block */}
          {allCategories && allCategories.length > 0 && (
            <div className="detail-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '10px', color: 'var(--text-primary)' }}>
                Top AI Tools Categories
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {allCategories.map((c, i) => {
                  const emojis = ['🤖', '✍️', '🎨', '📊', '💻', '🎥', '🌐', '💼', '🎵', '🔒'];
                  const emoji = emojis[i % emojis.length];
                  return (
                    <Link
                      key={c.id}
                      to={`/browse?category=${c.slug}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border)',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        transition: 'all 0.2s'
                      }}
                      className="tool-list-row-hover"
                    >
                      <span>{emoji}</span>
                      <span>{c.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default ToolDetail;
