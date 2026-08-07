import React from 'react';

function SeoEditor({ seoData, onChange }) {
  const handleChange = (key, val) => {
    onChange({
      ...seoData,
      [key]: val
    });
  };

  return (
    <div style={{ borderTop: '1px solid var(--border)', marginTop: '24px', paddingTop: '20px' }}>
      <h3 style={{ fontSize: '15px', color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>SEO Configuration</span>
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <label>SEO Title</label>
          <input
            type="text"
            className="form-control"
            value={seoData?.seo_title || ''}
            onChange={(e) => handleChange('seo_title', e.target.value)}
            placeholder="Search engine title tag"
          />
        </div>

        <div className="form-group">
          <label>Canonical URL</label>
          <input
            type="url"
            className="form-control"
            value={seoData?.canonical_url || ''}
            onChange={(e) => handleChange('canonical_url', e.target.value)}
            placeholder="https://example.com/canonical"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Meta Description</label>
        <textarea
          className="form-control"
          rows="2"
          value={seoData?.meta_description || ''}
          onChange={(e) => handleChange('meta_description', e.target.value)}
          placeholder="Brief search snippet description..."
        ></textarea>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div className="form-group">
          <label>Twitter Card Type</label>
          <select
            className="form-control"
            value={seoData?.twitter_card || 'summary_large_image'}
            onChange={(e) => handleChange('twitter_card', e.target.value)}
          >
            <option value="summary">Summary</option>
            <option value="summary_large_image">Summary Large Image</option>
            <option value="app">App</option>
            <option value="player">Player</option>
          </select>
        </div>

        <div className="form-group">
          <label>Search Indexing</label>
          <select
            className="form-control"
            value={seoData?.index_follow || 'index, follow'}
            onChange={(e) => handleChange('index_follow', e.target.value)}
          >
            <option value="index, follow">Index, Follow</option>
            <option value="noindex, nofollow">Noindex, Nofollow</option>
            <option value="index, nofollow">Index, Nofollow</option>
            <option value="noindex, follow">Noindex, Follow</option>
          </select>
        </div>

        <div className="form-group">
          <label>Open Graph Title</label>
          <input
            type="text"
            className="form-control"
            value={seoData?.og_title || ''}
            onChange={(e) => handleChange('og_title', e.target.value)}
            placeholder="Facebook share title"
          />
        </div>
      </div>

      <div className="form-group">
        <label>JSON Schema Structured Data</label>
        <textarea
          className="form-control"
          rows="2"
          value={seoData?.schema_json || ''}
          onChange={(e) => handleChange('schema_json', e.target.value)}
          placeholder='{"@context": "https://schema.org", "@type": "SoftwareApplication", ...}'
        ></textarea>
      </div>
    </div>
  );
}

export default SeoEditor;
