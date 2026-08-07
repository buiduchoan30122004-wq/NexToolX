import React from 'react';
import { Link } from 'react-router-dom';
import { Star, CheckCircle, Award, ChevronRight } from 'lucide-react';
import { UPLOADS_URL } from '../config';

function ToolCard({ tool }) {
  const pricingClass = `tool-pricing-tag pricing-${tool.pricing_type.toLowerCase().replace(' ', '-')}`;

  const renderLogo = () => {
    if (tool.logo) {
      const logoUrl = tool.logo.startsWith('http') ? tool.logo : `${UPLOADS_URL}${tool.logo}`;
      return <img src={logoUrl} alt={`${tool.name} logo`} className="tool-logo-img" onError={(e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
        e.target.parentNode.innerHTML = `<div class="logo-fallback">${tool.name.charAt(0).toUpperCase()}</div>`;
      }} />;
    }
    return (
      <div style={{
        width: '100%', height: '100%',
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-purple) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: '700', fontSize: '22px', color: '#fff'
      }}>
        {tool.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <Link to={`/tool/${tool.slug}`} className="tool-card">
      {/* Badges */}
      <div className="tool-badges">
        {tool.featured === 1 && <span className="badge badge-featured"><Award size={10} style={{ marginRight: '2px', verticalAlign: 'middle' }} /> Featured</span>}
        {tool.verified === 1 && <span className="badge badge-verified"><CheckCircle size={10} style={{ marginRight: '2px', verticalAlign: 'middle' }} /> Verified</span>}
      </div>

      <div className="tool-card-header">
        <div className="tool-logo-wrapper">
          {renderLogo()}
        </div>
        <div className="tool-meta">
          <h3 className="tool-title">{tool.name}</h3>
          <span className={pricingClass}>{tool.pricing_type}</span>
        </div>
      </div>

      <p className="tool-card-desc">{tool.short_description}</p>

      {/* Tags */}
      {tool.tags && tool.tags.length > 0 && (
        <div className="tool-card-tags">
          {tool.tags.slice(0, 3).map(t => (
            <span key={t.id} className="tag" style={{ borderLeft: `3px solid ${t.color || '#4F46E5'}` }}>
              {t.name}
            </span>
          ))}
        </div>
      )}

      <div className="tool-card-footer">
        {tool.rating > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-amber)', fontWeight: '600' }}>
            <Star size={14} fill="currentColor" />
            <span>{Number(tool.rating).toFixed(1)}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: '400' }}>({tool.reviewCount})</span>
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>No reviews yet</span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--primary)', fontWeight: '600' }}>
          <span>View Details</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </Link>
  );
}

export default ToolCard;
