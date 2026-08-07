import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL, UPLOADS_URL } from '../config';
import { Star, CheckCircle, Award, ExternalLink, Bookmark, MessageSquare, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

function ToolDetail() {
  const { slug } = useParams();
  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  
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
          
          // SEO Metadata dynamic loading
          document.title = data.seo_title || `${data.name} | Features, Review & Pricing | NexToolX`;
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute('content', data.meta_description || data.short_description);
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
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
      return <img src={logoUrl} alt={`${tool.name} logo`} style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover' }} />;
    }
    return (
      <div style={{
        width: '80px', height: '80px', borderRadius: '16px',
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-purple) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '700', fontSize: '32px', color: '#fff'
      }}>
        {tool.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  const getBannerSrc = () => {
    if (tool.og_image) {
      return tool.og_image.startsWith('http') ? tool.og_image : `${UPLOADS_URL}${tool.og_image}`;
    }
    if (tool.gallery && tool.gallery.length > 0) {
      const firstImg = tool.gallery[0].media_url;
      return firstImg.startsWith('http') ? firstImg : `${UPLOADS_URL}${firstImg}`;
    }
    return null;
  };
  const bannerSrc = getBannerSrc();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <Link to="/browse" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
        <ArrowLeft size={16} /> Back to Browse
      </Link>

      <div className="detail-layout">
        {/* Main Column */}
        <div className="detail-main" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {bannerSrc && (
            <div style={{ 
              width: '100%', 
              height: '200px', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              border: '1px solid var(--border)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              background: 'var(--bg-secondary)'
            }}>
              <img 
                src={bannerSrc} 
                alt={`${tool.name} banner`} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
          )}

          {/* Header Card */}
          <div className="detail-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                {renderLogo()}
                <div>
                  <h1 style={{ fontSize: '32px', fontWeight: '800' }}>{tool.name}</h1>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                    {tool.categories.map(c => (
                      <Link key={c.id} to={`/browse?category=${c.slug}`} style={{ fontSize: '12px', color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {tool.featured === 1 && <span className="badge badge-featured"><Award size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Featured</span>}
                {tool.verified === 1 && <span className="badge badge-verified"><CheckCircle size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Verified</span>}
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>About {tool.name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.8' }}>
                {tool.full_description || tool.short_description}
              </p>
            </div>

            {/* Gallery Screenshots */}
            {tool.gallery && tool.gallery.filter(img => (img.media_url.startsWith('http') ? img.media_url : `${UPLOADS_URL}${img.media_url}`) !== bannerSrc).length > 0 && (
              <div>
                <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Screenshots & Interface</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                  {tool.gallery
                    .filter(img => (img.media_url.startsWith('http') ? img.media_url : `${UPLOADS_URL}${img.media_url}`) !== bannerSrc)
                    .map((img, idx) => (
                      <a key={img.id || idx} href={img.media_url.startsWith('http') ? img.media_url : `${UPLOADS_URL}${img.media_url}`} target="_blank" rel="noreferrer">
                        <img
                          src={img.media_url.startsWith('http') ? img.media_url : `${UPLOADS_URL}${img.media_url}`}
                          alt={`${tool.name} screenshot ${idx + 1}`}
                          style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border)' }}
                        />
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="detail-card" style={{ width: '100%', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '22px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Write a Review</h3>
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

        {/* Sidebar Column */}
        <aside className="detail-sidebar">
          <div className="detail-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Pricing Model</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span className={`tool-pricing-tag pricing-${tool.pricing_type.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '14px', padding: '4px 12px' }}>
                  {tool.pricing_type}
                </span>
              </div>
              {tool.pricing_details && <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px' }}>{tool.pricing_details}</p>}
            </div>

            {/* Visit Website button */}
            <a
              href={`${API_URL}/redirect/${tool.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="submit-button"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', width: '100%'
              }}
            >
              <span>Visit Website</span>
              <ExternalLink size={16} />
            </a>

            {/* Tags */}
            {tool.tags && tool.tags.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                  Features & Tags
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {tool.tags.map(t => (
                    <span key={t.id} className="tag" style={{ borderLeft: `3px solid ${t.color || '#4F46E5'}`, background: 'var(--bg-tertiary)' }}>
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Deals Block */}
          {tool.deals && tool.deals.length > 0 && (
            <div className="detail-card" style={{ border: '1px solid var(--primary-hover)', background: 'var(--bg-card)' }}>
              <span style={{ fontSize: '12px', color: 'var(--accent-amber)', textTransform: 'uppercase', fontWeight: '700', display: 'block', marginBottom: '10px' }}>
                Special Deals
              </span>
              {tool.deals.map(deal => (
                <div key={deal.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{deal.title}</h4>
                  {deal.discount && <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent-emerald)' }}>Discount: {deal.discount}</div>}
                  {deal.coupon && (
                    <div style={{ background: 'var(--bg-tertiary)', padding: '6px 12px', borderRadius: '4px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', border: '1px dashed var(--border)' }}>
                      Code: <code>{deal.coupon}</code>
                    </div>
                  )}
                  <a href={deal.affiliate_link || tool.affiliate_url || tool.website_url} target="_blank" rel="noreferrer" className="submit-button" style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none', background: 'var(--primary)', marginTop: '8px' }}>
                    Claim Deal
                  </a>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default ToolDetail;
