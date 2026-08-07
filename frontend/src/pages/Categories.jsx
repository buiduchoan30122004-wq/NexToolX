import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { ChevronRight, Folder, FolderOpen } from 'lucide-react';

function Categories() {
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTree() {
      try {
        const res = await fetch(`${API_URL}/categories?format=tree`);
        if (res.ok) {
          setCategoryTree(await res.json());
        }
      } catch (err) {
        console.error('Error fetching categories tree:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTree();
  }, []);

  // Đệ quy hiển thị các node danh mục con
  const renderCategoryNode = (cat) => {
    const hasChildren = cat.children && cat.children.length > 0;
    
    return (
      <div key={cat.id} className="category-node" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifycontent: 'center', color: 'var(--primary)' }}>
              {hasChildren ? <FolderOpen size={18} /> : <Folder size={18} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{cat.name}</h3>
                <span style={{ fontSize: '11px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border)', fontWeight: '600' }}>
                  {cat.tool_count || 0} tool{cat.tool_count === 1 ? '' : 's'}
                </span>
              </div>
              {cat.description && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{cat.description}</p>}
            </div>
          </div>
          <Link to={`/browse?category=${cat.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontSize: '14px', color: 'var(--primary)', fontWeight: '600' }}>
            <span>Explore</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {hasChildren && (
          <div style={{ marginLeft: '32px', marginTop: '12px', borderLeft: '1px dashed var(--border)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cat.children.map(child => renderCategoryNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px' }}>AI Tool Categories</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Browse our nested hierarchy of AI tools to find exactly what fits your specific use case.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(n => (
            <div key={n} className="skeleton" style={{ height: '70px', borderRadius: 'var(--radius-md)' }}></div>
          ))}
        </div>
      ) : categoryTree.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {categoryTree.map(cat => renderCategoryNode(cat))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--text-secondary)' }}>No categories found.</p>
        </div>
      )}
    </div>
  );
}

export default Categories;
