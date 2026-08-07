import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL, UPLOADS_URL } from '../config';
import { Percent, ExternalLink, Calendar, Copy, Check } from 'lucide-react';

function Deals() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    async function fetchDeals() {
      try {
        const res = await fetch(`${API_URL}/deals`);
        if (res.ok) {
          setDeals(await res.json());
        }
      } catch (err) {
        console.error('Error fetching deals:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, []);

  const handleCopyCoupon = (coupon, dealId) => {
    navigator.clipboard.writeText(coupon);
    setCopiedId(dealId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderToolLogo = (deal) => {
    if (deal.tool_logo) {
      const logoUrl = deal.tool_logo.startsWith('http') ? deal.tool_logo : `${UPLOADS_URL}${deal.tool_logo}`;
      return <img src={logoUrl} alt={deal.tool_name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />;
    }
    return (
      <div style={{
        width: '48px', height: '48px', borderRadius: '8px',
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-purple) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '700', fontSize: '18px', color: '#fff'
      }}>
        {deal.tool_name ? deal.tool_name.charAt(0).toUpperCase() : 'AI'}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '36px' }}>Exclusive AI Deals & Discounts</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Save money on your favorite AI software subscriptions with verified coupons.</p>
      </div>

      {loading ? (
        <div className="card-grid">
          {[1, 2, 3].map(n => (
            <div key={n} className="skeleton" style={{ height: '220px', borderRadius: 'var(--radius-lg)' }}></div>
          ))}
        </div>
      ) : deals.length > 0 ? (
        <div className="card-grid">
          {deals.map(deal => (
            <div key={deal.id} className="tool-card" style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {renderToolLogo(deal)}
                  <div>
                    <Link to={`/tool/${deal.tool_slug}`} style={{ fontSize: '14px', fontWeight: '500', color: 'var(--primary)', textDecoration: 'none' }}>
                      {deal.tool_name}
                    </Link>
                    <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '2px' }}>{deal.title}</h3>
                  </div>
                </div>
                {deal.discount && (
                  <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-amber)', fontSize: '14px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Percent size={14} /> {deal.discount}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
                {deal.coupon ? (
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '6px 12px', justifyContent: 'space-between', width: '100%' }}>
                    <code style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '0.05em' }}>{deal.coupon}</code>
                    <button
                      onClick={() => handleCopyCoupon(deal.coupon, deal.id)}
                      style={{
                        background: 'transparent', border: 'none', color: copiedId === deal.id ? 'var(--accent-emerald)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600'
                      }}
                    >
                      {copiedId === deal.id ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedId === deal.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                    No coupon code required. Discount applied automatically.
                  </div>
                )}
              </div>

              {deal.end_date && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <Calendar size={12} />
                  <span>Expires: {deal.end_date}</span>
                </div>
              )}

              <a
                href={deal.affiliate_link || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="submit-button"
                style={{
                  padding: '10px 16px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', marginTop: deal.coupon ? '12px' : 'auto'
                }}
              >
                <span>Get Deal</span>
                <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No deals active at the moment. Check back later!</p>
        </div>
      )}
    </div>
  );
}

export default Deals;
