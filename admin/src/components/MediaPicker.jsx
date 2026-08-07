import React, { useState, useEffect } from 'react';
import { API_URL, UPLOADS_URL } from '../config';
import { Image, Upload, X, Trash } from 'lucide-react';

function MediaPicker({ onSelect, onClose }) {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/media`);
      if (res.ok) {
        setMediaList(await res.json());
      }
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/media/upload`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const newMedia = await res.json();
        // Refresh list
        await fetchMedia();
        // Select new uploaded item
        setSelectedItem(newMedia);
      }
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this media item? This will remove the file permanently.')) return;
    
    try {
      const res = await fetch(`${API_URL}/media/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedItem?.id === id) setSelectedItem(null);
        fetchMedia();
      }
    } catch (err) {
      console.error('Error deleting media:', err);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image size={18} /> Media Library
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Upload Block */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-card)', padding: '16px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary)', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}>
            <Upload size={16} />
            <span>{uploading ? 'Uploading...' : 'Upload Image'}</span>
            <input type="file" onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} disabled={uploading} />
          </label>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Supports JPG, PNG, WEBP, SVG files. Max 5MB.</span>
        </div>

        {/* Media Grid */}
        <div style={{ flex: 1, overflowY: 'auto', margin: '16px 0' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="skeleton" style={{ height: '100px', borderRadius: '6px' }}></div>
              ))}
            </div>
          ) : mediaList.length > 0 ? (
            <div className="media-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
              {mediaList.map(item => (
                <div
                  key={item.id}
                  className={`media-item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                  onClick={() => setSelectedItem(item)}
                  style={{ height: '110px', position: 'relative' }}
                >
                  <img
                    src={`${UPLOADS_URL}${item.file_path}`}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    onClick={(e) => handleDeleteMedia(e, item.id)}
                    style={{
                      position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '4px', padding: '4px', color: '#ff4d4d', cursor: 'pointer', opacity: 0.8
                    }}
                    title="Delete permanently"
                  >
                    <Trash size={12} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No media items found. Upload your first image above.
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button
            onClick={() => onSelect(selectedItem.file_path)}
            className="btn btn-primary"
            disabled={!selectedItem}
          >
            Select Media
          </button>
        </div>
      </div>
    </div>
  );
}

export default MediaPicker;
