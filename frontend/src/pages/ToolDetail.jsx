import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL, UPLOADS_URL } from '../config';
import { Star, CheckCircle, Award, ExternalLink, Bookmark, MessageSquare, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

function ToolDetail() {
  const { slug } = useParams();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarTools, setSimilarTools] = useState([]);
  const [activeScreenshot, setActiveScreenshot] = useState(null);
  
  // Review form states
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

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

          // Fetch similar tools
          try {
            const toolsRes = await fetch(`${API_URL}/tools`);
            if (toolsRes.ok) {
              const allTools = await toolsRes.json();
              const currentCatIds = data.categories.map(c => c.id);
              const filtered = allTools
                .filter(t => t.id !== data.id && t.categories.some(c => currentCatIds.includes(c.id)))
                .slice(0, 4);
              setSimilarTools(filtered);
            }
          } catch (simErr) {
            console.error('Error fetching similar tools:', simErr);
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

      {/* Main Grid Content */}
      <div className="detail-layout">
        {/* Left Column (Main Content) */}
        <div className="detail-main">
          
          {/* Interactive Photo Gallery (Screenshots) */}
          {activeScreenshot && (
            <div className="detail-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Screenshots & Interface</h2>
              
              {/* Main Active Banner preview */}
              <div style={{ 
                width: '100%', 
                height: '400px', 
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

              {/* Thumbnails list */}
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

          {/* About & Description */}
          <div className="detail-card">
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>About {tool.name}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15.5px', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
              {tool.full_description || tool.short_description}
            </p>
          </div>

          {/* Reviews List */}
          <div className="detail-card" style={{ width: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <MessageSquare size={20} /> User Reviews
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
        </div>

        {/* Right Column (Sidebar) */}
        <aside className="detail-sidebar">
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

          {/* Similar Tools / Alternatives Block (Dynamically Fetched!) */}
          {similarTools.length > 0 && (
            <div className="detail-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0', borderBottom: '1px solid var(--border)', paddingBottom: '10px', color: 'var(--text-primary)' }}>Similar AI Tools</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {similarTools.map(sim => (
                  <Link key={sim.id} to={`/tool/${sim.slug}`} style={{ display: 'flex', gap: '12px', textDecoration: 'none', color: 'inherit', padding: '8px', borderRadius: '8px', transition: 'background 0.2s', border: '1px solid transparent', alignItems: 'center' }} className="tool-list-row-hover">
                    <div style={{ flexShrink: 0, width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                      <img 
                        src={sim.logo ? (sim.logo.startsWith('http') ? sim.logo : `${UPLOADS_URL}${sim.logo}`) : `https://via.placeholder.com/44`} 
                        alt={sim.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        onError={(e) => {
                          e.target.parentNode.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:var(--primary); color:#fff; font-weight:700; font-size:16px;">${sim.name.charAt(0).toUpperCase()}</div>`;
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{sim.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`tool-pricing-tag pricing-${sim.pricing_type.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px' }}>
                          {sim.pricing_type}
                        </span>
                        {sim.rating > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--accent-amber)', fontSize: '11px', fontWeight: '700' }}>
                            <Star size={10} fill="currentColor" />
                            <span>{Number(sim.rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default ToolDetail;
