import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getDb } from './db.js';
import { seedDatabase } from './seed.js';
import { scrapeAndAnalyzeProject } from './agent.js';
import { sendThankYouEmail, sendSequenceEmail } from './email.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5002;

// Cấu hình thư mục lưu trữ media uploads
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());

// Middleware to disable caching for API calls to ensure instant updates
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Cấu hình lưu trữ tệp tin tải lên bằng Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper quản lý giao dịch SEO
async function getOrCreateSeo(db, seoData) {
  if (!seoData) return null;
  const { seo_title, meta_description, canonical_url, og_title, og_description, og_image, twitter_card, index_follow, schema_json } = seoData;
  const res = await db.run(`
    INSERT INTO seos (seo_title, meta_description, canonical_url, og_title, og_description, og_image, twitter_card, index_follow, schema_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [seo_title, meta_description, canonical_url, og_title, og_description, og_image, twitter_card, index_follow, schema_json]);
  return res.lastID;
}

async function updateSeo(db, seoId, seoData) {
  if (!seoId || !seoData) return;
  const { seo_title, meta_description, canonical_url, og_title, og_description, og_image, twitter_card, index_follow, schema_json } = seoData;
  await db.run(`
    UPDATE seos SET 
      seo_title = ?, meta_description = ?, canonical_url = ?, og_title = ?, og_description = ?, og_image = ?, twitter_card = ?, index_follow = ?, schema_json = ?
    WHERE id = ?
  `, [seo_title, meta_description, canonical_url, og_title, og_description, og_image, twitter_card, index_follow, schema_json, seoId]);
}

// ----------------- SEO & SITEMAP ROUTES -----------------
app.get('/sitemap.xml', async (req, res) => {
  try {
    const db = await getDb();
    
    // Fetch all active/published tools
    const tools = await db.all("SELECT slug, updated_at FROM tools WHERE status = 'approved' AND published = 1");
    // Fetch all published blogs
    const blogs = await db.all("SELECT slug, updated_at FROM blogs WHERE status = 'published'");
    // Fetch all categories
    const categories = await db.all("SELECT slug FROM categories");
    // Fetch all collections
    const collections = await db.all("SELECT slug FROM collections");

    const baseUrl = 'https://nextoolx.com';

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages
    const staticPages = [
      '',
      '/browse',
      '/categories',
      '/collections',
      '/deals',
      '/blog',
      '/submit-tool',
      '/about',
      '/contact',
      '/privacy',
      '/terms'
    ];

    const today = new Date().toISOString().split('T')[0];

    staticPages.forEach(page => {
      xml += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${page === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
    });

    // Dynamic Tools pages
    tools.forEach(tool => {
      const lastmod = tool.updated_at ? tool.updated_at.split(' ')[0] : today;
      xml += `  <url>\n    <loc>${baseUrl}/tool/${tool.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
    });

    // Dynamic Blog pages
    blogs.forEach(blog => {
      const lastmod = blog.updated_at ? blog.updated_at.split(' ')[0] : today;
      xml += `  <url>\n    <loc>${baseUrl}/blog/${blog.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    // Dynamic Category pages
    categories.forEach(cat => {
      xml += `  <url>\n    <loc>${baseUrl}/categories#${cat.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
    });

    // Dynamic Collection pages
    collections.forEach(col => {
      xml += `  <url>\n    <loc>${baseUrl}/collections#${col.slug}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
    });

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// ----------------- API ROUTES -----------------

// 1. Dashboard Metrics
app.get('/api/dashboard', async (req, res) => {
  try {
    const db = await getDb();
    const tools = await db.get('SELECT COUNT(*) as count FROM tools');
    const pendingTools = await db.get("SELECT COUNT(*) as count FROM tools WHERE status = 'pending'");
    const categories = await db.get('SELECT COUNT(*) as count FROM categories');
    const blogs = await db.get('SELECT COUNT(*) as count FROM blogs');
    const deals = await db.get('SELECT COUNT(*) as count FROM deals');
    const media = await db.get('SELECT COUNT(*) as count FROM media');
    const leads = await db.get('SELECT COUNT(*) as count FROM leads');
    
    const recentTools = await db.all('SELECT id, name, slug, website_url, affiliate_url, pricing_type, status, featured, is_paid_submission, contact_email, created_at FROM tools ORDER BY created_at DESC');
    
    res.json({
      counts: {
        tools: tools.count,
        pendingTools: pendingTools.count,
        categories: categories.count,
        blogs: blogs.count,
        deals: deals.count,
        media: media.count,
        leads: leads ? leads.count : 0
      },
      recentTools
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route 1.5. AI Scraper & Auto-fill Agent
app.post('/api/agent/scrape', async (req, res) => {
  const { url } = req.body;
  
  if (!url || !url.trim()) {
    return res.status(400).json({ error: 'Thiếu tham số URL.' });
  }

  try {
    const data = await scrapeAndAnalyzeProject(url.trim());
    res.json(data);
  } catch (error) {
    console.error('[API Agent Scrape] Lỗi:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 2. Auth: Đăng nhập đơn giản cho CRM skeleton
app.post('/api/auth/login', async (req, res) => {
  try {
    const db = await getDb();
    const { username, password } = req.body;
    
    const user = await db.get('SELECT * FROM users WHERE username = ? AND status = "active"', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const hashed = hashPassword(password);
    if (user.password_hash !== hashed) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      token: 'mock-jwt-token-nextoolx-' + user.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Dynamic Menus Endpoints
app.get('/api/menus', async (req, res) => {
  try {
    const db = await getDb();
    const list = await db.all('SELECT * FROM menus');
    const formatted = list.map(m => ({
      ...m,
      items: JSON.parse(m.items_json)
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/menus/:location', async (req, res) => {
  try {
    const db = await getDb();
    const menu = await db.get('SELECT * FROM menus WHERE location = ?', [req.params.location]);
    if (!menu) return res.status(404).json({ error: 'Menu not found' });
    res.json(JSON.parse(menu.items_json));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/menus/:location', async (req, res) => {
  try {
    const db = await getDb();
    const { items } = req.body;
    const itemsJson = JSON.stringify(items);
    await db.run('UPDATE menus SET items_json = ? WHERE location = ?', [itemsJson, req.params.location]);
    res.json({ success: true, location: req.params.location, items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Media Library Endpoints
app.get('/api/media', async (req, res) => {
  try {
    const db = await getDb();
    const media = await db.all('SELECT * FROM media ORDER BY created_at DESC');
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/media/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const db = await getDb();
    const filePath = `/uploads/${req.file.filename}`;
    const result = await db.run(
      'INSERT INTO media (name, file_path, file_type, size) VALUES (?, ?, ?, ?)',
      [req.file.originalname, filePath, req.file.mimetype, req.file.size]
    );
    res.status(201).json({
      id: result.lastID,
      name: req.file.originalname,
      file_path: filePath,
      file_type: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/media/:id', async (req, res) => {
  try {
    const db = await getDb();
    const media = await db.get('SELECT * FROM media WHERE id = ?', [req.params.id]);
    if (!media) return res.status(404).json({ error: 'Media not found' });
    
    // Xóa file vật lý
    const fullPath = path.join(__dirname, 'public', media.file_path);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    
    await db.run('DELETE FROM media WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Tags Endpoints (Simple CRUD)
app.get('/api/tags', async (req, res) => {
  try {
    const db = await getDb();
    const tags = await db.all('SELECT * FROM tags ORDER BY name ASC');
    res.json(tags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tags', async (req, res) => {
  try {
    const db = await getDb();
    const { name, slug, color, description, status } = req.body;
    const result = await db.run(
      'INSERT INTO tags (name, slug, color, description, status) VALUES (?, ?, ?, ?, ?)',
      [name, slug, color || '#4F46E5', description, status || 'active']
    );
    res.status(201).json({ id: result.lastID, name, slug, color, description, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tags/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { name, slug, color, description, status } = req.body;
    await db.run(
      'UPDATE tags SET name = ?, slug = ?, color = ?, description = ?, status = ? WHERE id = ?',
      [name, slug, color, description, status, req.params.id]
    );
    res.json({ id: req.params.id, name, slug, color, description, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tags/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM tags WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Categories Endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const db = await getDb();
    const { format } = req.query;
    
    const categories = await db.all(`
      SELECT c.*, s.seo_title, s.meta_description, s.canonical_url, s.og_title, s.og_description, s.og_image, s.twitter_card, s.index_follow, s.schema_json,
             (SELECT COUNT(*) FROM tool_categories tc JOIN tools t ON tc.tool_id = t.id WHERE tc.category_id = c.id AND t.status = 'approved' AND t.published = 1) as tool_count
      FROM categories c
      LEFT JOIN seos s ON c.seo_id = s.id
      ORDER BY c.order_index ASC, c.name ASC
    `);

    if (format === 'tree') {
      const buildTree = (cats, parentId = null) => {
        return cats
          .filter(c => c.parent_id === parentId)
          .map(c => {
            const children = buildTree(cats, c.id);
            const totalToolCount = (c.tool_count || 0) + children.reduce((sum, child) => sum + (child.tool_count || 0), 0);
            return {
              ...c,
              tool_count: totalToolCount,
              children
            };
          });
      };
      return res.json(buildTree(categories, null));
    }
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const db = await getDb();
    const { name, slug, description, icon, parent_id, order_index, status, seo } = req.body;
    
    const seoId = await getOrCreateSeo(db, seo);
    
    const result = await db.run(`
      INSERT INTO categories (name, slug, description, icon, parent_id, seo_id, order_index, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, slug, description, icon, parent_id || null, seoId, order_index || 0, status || 'active']);
    
    res.status(201).json({ id: result.lastID, name, slug, description, icon, parent_id, seoId, order_index, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { name, slug, description, icon, parent_id, seo_id, order_index, status, seo } = req.body;
    
    let finalSeoId = seo_id;
    if (seo) {
      if (finalSeoId) {
        await updateSeo(db, finalSeoId, seo);
      } else {
        finalSeoId = await getOrCreateSeo(db, seo);
      }
    }
    
    await db.run(`
      UPDATE categories SET 
        name = ?, slug = ?, description = ?, icon = ?, parent_id = ?, seo_id = ?, order_index = ?, status = ?
      WHERE id = ?
    `, [name, slug, description, icon, parent_id || null, finalSeoId, order_index || 0, status, req.params.id]);
    
    res.json({ id: req.params.id, name, slug, description, icon, parent_id, seo_id: finalSeoId, order_index, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const db = await getDb();
    // Chuyển quan hệ của con lên null trước khi xóa cha
    await db.run('UPDATE categories SET parent_id = NULL WHERE parent_id = ?', [req.params.id]);
    
    const cat = await db.get('SELECT seo_id FROM categories WHERE id = ?', [req.params.id]);
    if (cat && cat.seo_id) {
      await db.run('DELETE FROM seos WHERE id = ?', [cat.seo_id]);
    }
    
    await db.run('DELETE FROM categories WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Collections Endpoints
app.get('/api/collections', async (req, res) => {
  try {
    const db = await getDb();
    const collections = await db.all(`
      SELECT cl.*, s.seo_title, s.meta_description, s.canonical_url
      FROM collections cl
      LEFT JOIN seos s ON cl.seo_id = s.id
      ORDER BY cl.name ASC
    `);
    res.json(collections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/collections', async (req, res) => {
  try {
    const db = await getDb();
    const { name, slug, description, featured_image, status, seo } = req.body;
    
    const seoId = await getOrCreateSeo(db, seo);
    const result = await db.run(`
      INSERT INTO collections (name, slug, description, featured_image, seo_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, slug, description, featured_image, seoId, status || 'active']);
    
    res.status(201).json({ id: result.lastID, name, slug, description, featured_image, seoId, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/collections/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { name, slug, description, featured_image, seo_id, status, seo } = req.body;
    
    let finalSeoId = seo_id;
    if (seo) {
      if (finalSeoId) {
        await updateSeo(db, finalSeoId, seo);
      } else {
        finalSeoId = await getOrCreateSeo(db, seo);
      }
    }
    
    await db.run(`
      UPDATE collections SET name = ?, slug = ?, description = ?, featured_image = ?, seo_id = ?, status = ? WHERE id = ?
    `, [name, slug, description, featured_image, finalSeoId, status, req.params.id]);
    
    res.json({ id: req.params.id, name, slug, description, featured_image, seo_id: finalSeoId, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/collections/:id', async (req, res) => {
  try {
    const db = await getDb();
    const cl = await db.get('SELECT seo_id FROM collections WHERE id = ?', [req.params.id]);
    if (cl && cl.seo_id) {
      await db.run('DELETE FROM seos WHERE id = ?', [cl.seo_id]);
    }
    await db.run('DELETE FROM collections WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Deals Endpoints
app.get('/api/deals', async (req, res) => {
  try {
    const db = await getDb();
    const deals = await db.all(`
      SELECT d.*, t.name as tool_name, t.slug as tool_slug, t.logo as tool_logo
      FROM deals d
      LEFT JOIN tools t ON d.tool_id = t.id
      ORDER BY d.id DESC
    `);
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/deals', async (req, res) => {
  try {
    const db = await getDb();
    const { title, discount, coupon, affiliate_link, start_date, end_date, tool_id, status } = req.body;
    const result = await db.run(`
      INSERT INTO deals (title, discount, coupon, affiliate_link, start_date, end_date, tool_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, discount, coupon, affiliate_link, start_date, end_date, tool_id || null, status || 'active']);
    res.status(201).json({ id: result.lastID, title, discount, coupon, affiliate_link, start_date, end_date, tool_id, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/deals/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { title, discount, coupon, affiliate_link, start_date, end_date, tool_id, status } = req.body;
    await db.run(`
      UPDATE deals SET title = ?, discount = ?, coupon = ?, affiliate_link = ?, start_date = ?, end_date = ?, tool_id = ?, status = ?
      WHERE id = ?
    `, [title, discount, coupon, affiliate_link, start_date, end_date, tool_id || null, status, req.params.id]);
    res.json({ id: req.params.id, title, discount, coupon, affiliate_link, start_date, end_date, tool_id, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/deals/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM deals WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Authors & Blogs Endpoints
app.get('/api/authors', async (req, res) => {
  try {
    const db = await getDb();
    const authors = await db.all('SELECT * FROM authors ORDER BY name ASC');
    res.json(authors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/authors', async (req, res) => {
  try {
    const db = await getDb();
    const { name, bio, avatar, status } = req.body;
    const result = await db.run(
      'INSERT INTO authors (name, bio, avatar, status) VALUES (?, ?, ?, ?)',
      [name, bio, avatar, status || 'active']
    );
    res.status(201).json({ id: result.lastID, name, bio, avatar, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/authors/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { name, bio, avatar, status } = req.body;
    await db.run(
      'UPDATE authors SET name = ?, bio = ?, avatar = ?, status = ? WHERE id = ?',
      [name, bio, avatar, status, req.params.id]
    );
    res.json({ id: req.params.id, name, bio, avatar, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/authors/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM authors WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Blog Posts API
app.get('/api/blogs', async (req, res) => {
  try {
    const db = await getDb();
    const blogs = await db.all(`
      SELECT b.*, a.name as author_name, s.seo_title, s.meta_description
      FROM blogs b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN seos s ON b.seo_id = s.id
      ORDER BY b.created_at DESC
    `);
    
    for (const blog of blogs) {
      blog.categories = await db.all(`
        SELECT c.id, c.name, c.slug FROM categories c
        JOIN blog_categories bc ON c.id = bc.category_id
        WHERE bc.blog_id = ?
      `, [blog.id]);
      
      blog.tags = await db.all(`
        SELECT tg.id, tg.name, tg.slug, tg.color FROM tags tg
        JOIN blog_tags bt ON tg.id = bt.tag_id
        WHERE bt.blog_id = ?
      `, [blog.id]);
      
      blog.related_tools = await db.all(`
        SELECT t.id, t.name, t.slug, t.logo FROM tools t
        JOIN blog_related_tools br ON t.id = br.tool_id
        WHERE br.blog_id = ?
      `, [blog.id]);
    }
    
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/blogs/slug/:slug', async (req, res) => {
  try {
    const db = await getDb();
    const blog = await db.get(`
      SELECT b.*, a.name as author_name, a.bio as author_bio, a.avatar as author_avatar,
             s.seo_title, s.meta_description, s.canonical_url, s.og_title, s.og_description, s.og_image, s.twitter_card, s.index_follow, s.schema_json
      FROM blogs b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN seos s ON b.seo_id = s.id
      WHERE b.slug = ?
    `, [req.params.slug]);
    
    if (!blog) return res.status(404).json({ error: 'Blog post not found' });
    
    blog.categories = await db.all(`
      SELECT c.id, c.name, c.slug FROM categories c
      JOIN blog_categories bc ON c.id = bc.category_id
      WHERE bc.blog_id = ?
    `, [blog.id]);
    
    blog.tags = await db.all(`
      SELECT tg.id, tg.name, tg.slug, tg.color FROM tags tg
      JOIN blog_tags bt ON tg.id = bt.tag_id
      WHERE bt.blog_id = ?
    `, [blog.id]);
    
    blog.related_tools = await db.all(`
      SELECT t.id, t.name, t.slug, t.logo, t.short_description, t.pricing_type FROM tools t
      JOIN blog_related_tools br ON t.id = br.tool_id
      WHERE br.blog_id = ?
    `, [blog.id]);
    
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/blogs', async (req, res) => {
  try {
    const db = await getDb();
    const { title, slug, content, featured_image, author_id, status, seo, categories, tags, related_tools } = req.body;
    
    const seoId = await getOrCreateSeo(db, seo);
    const result = await db.run(`
      INSERT INTO blogs (title, slug, content, featured_image, author_id, seo_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [title, slug, content, featured_image, author_id || null, seoId, status || 'draft']);
    const blogId = result.lastID;
    
    // Save relations
    if (categories && Array.isArray(categories)) {
      for (const catId of categories) {
        await db.run('INSERT INTO blog_categories (blog_id, category_id) VALUES (?, ?)', [blogId, catId]);
      }
    }
    if (tags && Array.isArray(tags)) {
      for (const tagId of tags) {
        await db.run('INSERT INTO blog_tags (blog_id, tag_id) VALUES (?, ?)', [blogId, tagId]);
      }
    }
    if (related_tools && Array.isArray(related_tools)) {
      for (const toolId of related_tools) {
        await db.run('INSERT INTO blog_related_tools (blog_id, tool_id) VALUES (?, ?)', [blogId, toolId]);
      }
    }
    
    res.status(201).json({ id: blogId, title, slug, author_id, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/blogs/:id', async (req, res) => {
  try {
    const db = await getDb();
    const blogId = req.params.id;
    const { title, slug, content, featured_image, author_id, seo_id, status, seo, categories, tags, related_tools } = req.body;
    
    let finalSeoId = seo_id;
    if (seo) {
      if (finalSeoId) {
        await updateSeo(db, finalSeoId, seo);
      } else {
        finalSeoId = await getOrCreateSeo(db, seo);
      }
    }
    
    await db.run(`
      UPDATE blogs SET title = ?, slug = ?, content = ?, featured_image = ?, author_id = ?, seo_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `, [title, slug, content, featured_image, author_id || null, finalSeoId, status, blogId]);
    
    // Clear relations
    await db.run('DELETE FROM blog_categories WHERE blog_id = ?', [blogId]);
    await db.run('DELETE FROM blog_tags WHERE blog_id = ?', [blogId]);
    await db.run('DELETE FROM blog_related_tools WHERE blog_id = ?', [blogId]);
    
    // Re-insert relations
    if (categories && Array.isArray(categories)) {
      for (const catId of categories) {
        await db.run('INSERT INTO blog_categories (blog_id, category_id) VALUES (?, ?)', [blogId, catId]);
      }
    }
    if (tags && Array.isArray(tags)) {
      for (const tagId of tags) {
        await db.run('INSERT INTO blog_tags (blog_id, tag_id) VALUES (?, ?)', [blogId, tagId]);
      }
    }
    if (related_tools && Array.isArray(related_tools)) {
      for (const toolId of related_tools) {
        await db.run('INSERT INTO blog_related_tools (blog_id, tool_id) VALUES (?, ?)', [blogId, toolId]);
      }
    }
    
    res.json({ id: blogId, title, slug, author_id, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/blogs/:id', async (req, res) => {
  try {
    const db = await getDb();
    const blog = await db.get('SELECT seo_id FROM blogs WHERE id = ?', [req.params.id]);
    if (blog && blog.seo_id) {
      await db.run('DELETE FROM seos WHERE id = ?', [blog.seo_id]);
    }
    await db.run('DELETE FROM blogs WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. AI Tools Endpoints (Core Catalog)
app.get('/api/tools', async (req, res) => {
  try {
    const db = await getDb();
    const { q, category, tag, pricing, featured, status, startDate, endDate, page = 1, limit = 100 } = req.query;
    
    let query = `
      SELECT t.*, s.seo_title, s.meta_description, s.canonical_url, s.og_title, s.og_description, s.og_image, s.twitter_card, s.index_follow, s.schema_json
      FROM tools t
      LEFT JOIN seos s ON t.seo_id = s.id
      WHERE 1=1
    `;
    const params = [];
    
    if (q) {
      query += ` AND (t.name LIKE ? OR t.short_description LIKE ? OR t.full_description LIKE ?)`;
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern);
    }
    
    if (pricing) {
      query += ` AND t.pricing_type = ?`;
      params.push(pricing);
    }
    
    if (featured !== undefined) {
      query += ` AND t.featured = ?`;
      params.push(featured === 'true' || featured === '1' ? 1 : 0);
    }
    
    if (status && status !== 'all') {
      query += ` AND t.status = ?`;
      params.push(status);
    } else if (!status) {
      // Mặc định khách truy cập chỉ thấy công cụ đã duyệt và công bố
      query += ` AND t.published = 1 AND t.status = 'approved'`;
    }

    if (category) {
      query += ` AND t.id IN (
        SELECT tool_id FROM tool_categories WHERE category_id IN (
          SELECT id FROM categories WHERE slug = ? OR id = ? OR parent_id = (SELECT id FROM categories WHERE slug = ? OR id = ?)
        )
      )`;
      params.push(category, category, category, category);
    }
    
    if (tag) {
      query += ` AND t.id IN (SELECT tool_id FROM tool_tags tt JOIN tags tg ON tt.tag_id = tg.id WHERE tg.slug = ? OR tg.id = ?)`;
      params.push(tag, tag);
    }
    
    query += ` ORDER BY t.featured DESC, t.created_at DESC`;
    
    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const tools = await db.all(query, params);
    
    for (const tool of tools) {
      tool.categories = await db.all(`
        SELECT c.id, c.name, c.slug FROM categories c
        JOIN tool_categories tc ON c.id = tc.category_id
        WHERE tc.tool_id = ?
      `, [tool.id]);
      
      tool.tags = await db.all(`
        SELECT tg.id, tg.name, tg.slug, tg.color FROM tags tg
        JOIN tool_tags tt ON tg.id = tt.tag_id
        WHERE tt.tool_id = ?
      `, [tool.id]);
      
      tool.collections = await db.all(`
        SELECT cl.id, cl.name, cl.slug FROM collections cl
        JOIN tool_collections tc ON cl.id = tc.collection_id
        WHERE tc.tool_id = ?
      `, [tool.id]);
      
      tool.deals = await db.all('SELECT * FROM deals WHERE tool_id = ? AND status = "active"', [tool.id]);
      
      const ratingInfo = await db.get('SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE tool_id = ? AND status = "approved"', [tool.id]);
      tool.rating = ratingInfo.avgRating || 0;
      tool.reviewCount = ratingInfo.count || 0;

      const pendingInfo = await db.get('SELECT COUNT(*) as count FROM reviews WHERE tool_id = ? AND status = "pending"', [tool.id]);
      tool.pendingReviewCount = pendingInfo.count || 0;

      let clickQuery = 'SELECT COUNT(*) as count FROM traffic_logs WHERE tool_id = ? AND event_type = "click"';
      const clickParams = [tool.id];
      if (startDate) {
        clickQuery += ' AND created_at >= ?';
        clickParams.push(startDate);
      }
      if (endDate) {
        clickQuery += ' AND created_at <= ?';
        clickParams.push(endDate);
      }
      const clickInfo = await db.get(clickQuery, clickParams);
      tool.click_count = clickInfo.count || 0;
    }
    
    res.json(tools);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tools/slug/:slug', async (req, res) => {
  try {
    const db = await getDb();
    const tool = await db.get(`
      SELECT t.*, s.seo_title, s.meta_description, s.canonical_url, s.og_title, s.og_description, s.og_image, s.twitter_card, s.index_follow, s.schema_json
      FROM tools t
      LEFT JOIN seos s ON t.seo_id = s.id
      WHERE t.slug = ?
    `, [req.params.slug]);
    
    if (!tool) return res.status(404).json({ error: 'AI Tool not found' });
    
    tool.categories = await db.all(`
      SELECT c.id, c.name, c.slug FROM categories c
      JOIN tool_categories tc ON c.id = tc.category_id
      WHERE tc.tool_id = ?
    `, [tool.id]);
    
    tool.tags = await db.all(`
      SELECT tg.id, tg.name, tg.slug, tg.color FROM tags tg
      JOIN tool_tags tt ON tg.id = tt.tag_id
      WHERE tt.tool_id = ?
    `, [tool.id]);
    
    tool.collections = await db.all(`
      SELECT cl.id, cl.name, cl.slug FROM collections cl
      JOIN tool_collections tc ON cl.id = tc.collection_id
      WHERE tc.tool_id = ?
    `, [tool.id]);
    
    tool.gallery = await db.all('SELECT * FROM tool_gallery WHERE tool_id = ? ORDER BY order_index ASC', [tool.id]);
    tool.deals = await db.all('SELECT * FROM deals WHERE tool_id = ? AND status = "active"', [tool.id]);
    tool.reviews = await db.all('SELECT * FROM reviews WHERE tool_id = ? AND status = "approved" ORDER BY created_at DESC', [tool.id]);
    
    const ratingInfo = await db.get('SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE tool_id = ? AND status = "approved"', [tool.id]);
    tool.rating = ratingInfo.avgRating || 0;
    tool.reviewCount = ratingInfo.count || 0;

    const pendingInfo = await db.get('SELECT COUNT(*) as count FROM reviews WHERE tool_id = ? AND status = "pending"', [tool.id]);
    tool.pendingReviewCount = pendingInfo.count || 0;

    const clickInfo = await db.get('SELECT COUNT(*) as count FROM traffic_logs WHERE tool_id = ? AND event_type = "click"', [tool.id]);
    tool.click_count = clickInfo.count || 0;
    
    res.json(tool);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tools', async (req, res) => {
  try {
    const db = await getDb();
    const {
      name, slug, short_description, full_description, logo, website_url, affiliate_url,
      pricing_type, pricing_details, verified, featured, published, status, seo,
      categories, tags, collections, gallery, contact_email, is_paid_submission
    } = req.body;
    
    const seoId = await getOrCreateSeo(db, seo);
    
    const result = await db.run(`
      INSERT INTO tools (name, slug, short_description, full_description, logo, website_url, affiliate_url, pricing_type, pricing_details, verified, featured, published, status, contact_email, is_paid_submission, seo_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, slug, short_description, full_description, logo, website_url, affiliate_url,
      pricing_type || 'Freemium', pricing_details, verified ? 1 : 0, featured ? 1 : 0, published ? 1 : 0, status || 'pending', contact_email, is_paid_submission ? 1 : 0, seoId
    ]);
    
    const toolId = result.lastID;
    
    // Tự động lưu thông tin khách hàng vào danh sách Leads
    if (contact_email) {
      try {
        await db.run(
          'INSERT OR IGNORE INTO leads (name, email, phone, lead_type) VALUES (?, ?, ?, ?)',
          [`Owner of ${name}`, contact_email, '', 'customer']
        );
        console.log(`[Leads] Tự động ghi nhận khách hàng mới: ${contact_email}`);
      } catch (err) {
        console.error('[Leads Error] Lỗi tự động ghi nhận leads:', err.message);
      }
    }
    
    // Save relations
    if (categories && Array.isArray(categories)) {
      for (const catId of categories) {
        await db.run('INSERT INTO tool_categories (tool_id, category_id) VALUES (?, ?)', [toolId, catId]);
      }
    }
    if (tags && Array.isArray(tags)) {
      for (const tagId of tags) {
        await db.run('INSERT INTO tool_tags (tool_id, tag_id) VALUES (?, ?)', [toolId, tagId]);
      }
    }
    if (collections && Array.isArray(collections)) {
      for (const collId of collections) {
        await db.run('INSERT INTO tool_collections (tool_id, collection_id) VALUES (?, ?)', [toolId, collId]);
      }
    }
    if (gallery && Array.isArray(gallery)) {
      for (let i = 0; i < gallery.length; i++) {
        await db.run('INSERT INTO tool_gallery (tool_id, media_url, order_index) VALUES (?, ?, ?)', [toolId, gallery[i], i]);
      }
    }
    
    // Gửi email cảm ơn qua Resend API
    if (contact_email) {
      const planType = featured === 1 ? 'featured' : 'fast';
      sendThankYouEmail(contact_email, { name, website_url, pricing_type: pricing_type || 'Freemium' }, planType)
        .then(result => {
          if (result.mocked) {
            console.log('[Email Info] Đã giả lập (mock) nội dung email thành công (do chưa có API Key).');
          } else {
            console.log(`[Email Sent] Đã gửi email xác nhận thành công tới ${contact_email}.`);
          }
        })
        .catch(err => {
          console.error('[Email Error] Lỗi khi gửi email xác nhận:', err.message);
        });
    }

    res.status(201).json({ id: toolId, name, slug, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tools/:id', async (req, res) => {
  try {
    const db = await getDb();
    const toolId = req.params.id;
    const {
      name, slug, short_description, full_description, logo, website_url, affiliate_url,
      pricing_type, pricing_details, verified, featured, published, status, seo_id, seo,
      categories, tags, collections, gallery, contact_email, is_paid_submission
    } = req.body;
    
    let finalSeoId = seo_id;
    if (seo) {
      if (finalSeoId) {
        await updateSeo(db, finalSeoId, seo);
      } else {
        finalSeoId = await getOrCreateSeo(db, seo);
      }
    }
    
    await db.run(`
      UPDATE tools SET 
        name = ?, slug = ?, short_description = ?, full_description = ?, logo = ?, website_url = ?, affiliate_url = ?,
        pricing_type = ?, pricing_details = ?, verified = ?, featured = ?, published = ?, status = ?, contact_email = ?, is_paid_submission = ?, seo_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      name, slug, short_description, full_description, logo, website_url, affiliate_url,
      pricing_type, pricing_details, verified ? 1 : 0, featured ? 1 : 0, published ? 1 : 0, status, contact_email, is_paid_submission ? 1 : 0, finalSeoId, toolId
    ]);
    
    // Clear relations
    await db.run('DELETE FROM tool_categories WHERE tool_id = ?', [toolId]);
    await db.run('DELETE FROM tool_tags WHERE tool_id = ?', [toolId]);
    await db.run('DELETE FROM tool_collections WHERE tool_id = ?', [toolId]);
    await db.run('DELETE FROM tool_gallery WHERE tool_id = ?', [toolId]);
    
    // Re-insert relations
    if (categories && Array.isArray(categories)) {
      for (const catId of categories) {
        await db.run('INSERT INTO tool_categories (tool_id, category_id) VALUES (?, ?)', [toolId, catId]);
      }
    }
    if (tags && Array.isArray(tags)) {
      for (const tagId of tags) {
        await db.run('INSERT INTO tool_tags (tool_id, tag_id) VALUES (?, ?)', [toolId, tagId]);
      }
    }
    if (collections && Array.isArray(collections)) {
      for (const collId of collections) {
        await db.run('INSERT INTO tool_collections (tool_id, collection_id) VALUES (?, ?)', [toolId, collId]);
      }
    }
    if (gallery && Array.isArray(gallery)) {
      for (let i = 0; i < gallery.length; i++) {
        await db.run('INSERT INTO tool_gallery (tool_id, media_url, order_index) VALUES (?, ?, ?)', [toolId, gallery[i], i]);
      }
    }
    
    res.json({ id: toolId, name, slug, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tools/:id', async (req, res) => {
  try {
    const db = await getDb();
    const tool = await db.get('SELECT seo_id FROM tools WHERE id = ?', [req.params.id]);
    if (tool && tool.seo_id) {
      await db.run('DELETE FROM seos WHERE id = ?', [tool.seo_id]);
    }
    await db.run('DELETE FROM tools WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Reviews Endpoints (Future ready reviews CRUD)
app.get('/api/reviews', async (req, res) => {
  try {
    const db = await getDb();
    const reviews = await db.all(`
      SELECT r.*, t.name as tool_name, t.slug as tool_slug
      FROM reviews r
      LEFT JOIN tools t ON r.tool_id = t.id
      ORDER BY r.created_at DESC
    `);
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const db = await getDb();
    const { tool_id, rating, content, reviewer_name, status } = req.body;
    const result = await db.run(`
      INSERT INTO reviews (tool_id, rating, content, reviewer_name, status)
      VALUES (?, ?, ?, ?, ?)
    `, [tool_id, rating, content, reviewer_name || 'Anonymous', status || 'pending']);
    res.status(201).json({ id: result.lastID, tool_id, rating, content, reviewer_name, status: status || 'pending' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/reviews/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { rating, content, reviewer_name, status } = req.body;
    await db.run(`
      UPDATE reviews SET rating = ?, content = ?, reviewer_name = ?, status = ? WHERE id = ?
    `, [rating, content, reviewer_name, status, req.params.id]);
    res.json({ id: req.params.id, rating, content, reviewer_name, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM reviews WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 12. Settings Endpoints
app.get('/api/settings', async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM settings');
    
    const config = {};
    rows.forEach(row => {
      config[row.key] = row.value;
    });
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const db = await getDb();
    const settingsObj = req.body;
    
    for (const [key, value] of Object.entries(settingsObj)) {
      await db.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value]
      );
    }
    
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 12.5 Homepage Configuration Endpoint
app.get('/api/homepage', async (req, res) => {
  try {
    const db = await getDb();
    const keys = ['homepage_editors_picks', 'homepage_top_10', 'homepage_new_free', 'homepage_top_growing'];
    const rows = await db.all('SELECT * FROM settings WHERE key IN (?, ?, ?, ?)', keys);
    
    const config = {};
    rows.forEach(r => {
      config[r.key] = JSON.parse(r.value || '[]');
    });

    const getToolsByIds = async (ids) => {
      if (!ids || ids.length === 0) return [];
      const placeholders = ids.map(() => '?').join(',');
      const tools = await db.all(`
        SELECT t.*, s.seo_title, s.meta_description, s.canonical_url, s.og_title, s.og_description, s.og_image, s.twitter_card, s.index_follow, s.schema_json
        FROM tools t
        LEFT JOIN seos s ON t.seo_id = s.id
        WHERE t.id IN (${placeholders}) AND t.status = 'approved' AND t.published = 1
      `, ids);
      
      // Map categories and tags
      for (const tool of tools) {
        tool.categories = await db.all(`
          SELECT c.id, c.name, c.slug FROM categories c
          JOIN tool_categories tc ON c.id = tc.category_id
          WHERE tc.tool_id = ?
        `, [tool.id]);
        
        tool.tags = await db.all(`
          SELECT tg.id, tg.name, tg.slug, tg.color FROM tags tg
          JOIN tool_tags tt ON tg.id = tt.tag_id
          WHERE tt.tool_id = ?
        `, [tool.id]);

        const ratingInfo = await db.get('SELECT AVG(rating) as avgRating, COUNT(*) as count FROM reviews WHERE tool_id = ? AND status = "approved"', [tool.id]);
        tool.rating = ratingInfo.avgRating || 0;
        tool.reviewCount = ratingInfo.count || 0;
      }
      
      return ids.map(id => tools.find(t => t.id === id)).filter(Boolean);
    };

    const response = {
      editors_picks: await getToolsByIds(config.homepage_editors_picks),
      top_10: await getToolsByIds(config.homepage_top_10),
      new_free: await getToolsByIds(config.homepage_new_free),
      top_growing: await getToolsByIds(config.homepage_top_growing)
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 13. Redirect & Traffic Log Endpoint
app.get('/api/redirect/:id', async (req, res) => {
  try {
    const db = await getDb();
    const toolId = req.params.id;

    // Fetch tool info
    const tool = await db.get('SELECT website_url, affiliate_url FROM tools WHERE id = ?', [toolId]);
    if (!tool) {
      return res.status(404).send('Tool not found');
    }

    // Get IP address
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    if (ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7);
    }

    // Determine country
    let country = 'US';
    const euroCountries = ['UK', 'DE', 'FR', 'NL', 'IT', 'ES', 'PL', 'SE', 'IE', 'DK'];
    
    if (ip === '127.0.0.1' || ip === '::1' || !ip) {
      // Mock a random European country for local testing to match European SEO target!
      country = euroCountries[Math.floor(Math.random() * euroCountries.length)];
    } else {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          country = geoData.countryCode || 'US';
        } else {
          country = euroCountries[Math.floor(Math.random() * euroCountries.length)];
        }
      } catch (geoErr) {
        country = euroCountries[Math.floor(Math.random() * euroCountries.length)];
      }
    }

    // Record log
    await db.run(
      'INSERT INTO traffic_logs (tool_id, event_type, country, ip_address) VALUES (?, ?, ?, ?)',
      [toolId, 'click', country, ip]
    );

    // Redirect to affiliate/ref url if present, fallback to website_url
    const targetUrl = tool.affiliate_url || tool.website_url;
    res.redirect(302, targetUrl);
  } catch (error) {
    console.error('[Redirect Error]', error.message);
    res.status(500).send(`Redirect failed: ${error.message}`);
  }
});

// 14. Leads (Newsletter & CRM Customer List)
app.post('/api/leads', async (req, res) => {
  try {
    const db = await getDb();
    const { name, email, phone } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required fields.' });
    }
    await db.run(
      'INSERT INTO leads (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone]
    );

    const isTestEmail = email.toLowerCase().includes('test') || email.toLowerCase().trim() === 'buiduchoan30122004@gmail.com';
    if (isTestEmail) {
      console.log(`[Test Bypass] Phát hiện email kiểm thử: ${email}. Hệ thống gửi đồng thời cả 3 email ngay lập tức.`);
      sendSequenceEmail(email, name, 'welcome').catch(err => console.error('[Sequence Welcome Error]', err.message));
      sendSequenceEmail(email, name, 'nurture').catch(err => console.error('[Sequence Nurture Error]', err.message));
      sendSequenceEmail(email, name, 'promo').catch(err => console.error('[Sequence Promo Error]', err.message));
    } else {
      // 1. Gửi Email 1 (Chào mừng) ngay lập tức
      sendSequenceEmail(email, name, 'welcome').catch(err => console.error('[Sequence Welcome Error]', err.message));
      
      // 2. Lên lịch gửi Email 2 sau 2 ngày
      await db.run(`
        INSERT INTO scheduled_emails (email, name, email_type, send_at)
        VALUES (?, ?, 'nurture', datetime('now', '+2 days'))
      `, [email, name]);
      
      // 3. Lên lịch gửi Email 3 sau 3 ngày (tức là 1 ngày sau Email 2)
      await db.run(`
        INSERT INTO scheduled_emails (email, name, email_type, send_at)
        VALUES (?, ?, 'promo', datetime('now', '+3 days'))
      `, [email, name]);
      
      console.log(`[Email Sequence] Đã thiết lập thành công chuỗi email tự động cho ${email}.`);
    }

    res.json({ success: true, message: 'Subscribed successfully!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/leads', async (req, res) => {
  try {
    const db = await getDb();
    const leads = await db.all('SELECT * FROM leads ORDER BY created_at DESC');
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/leads/:id', async (req, res) => {
  try {
    const db = await getDb();
    await db.run('DELETE FROM leads WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tiến trình tự động duyệt (Auto-Approve) công cụ AI sau 15 phút nếu Admin không thao tác
setInterval(async () => {
  try {
    const db = await getDb();
    // 1. Tự động duyệt công cụ AI sau 15 phút
    const result = await db.run(`
      UPDATE tools 
      SET status = 'approved', published = 1 
      WHERE status = 'pending' 
        AND created_at <= datetime('now', '-15 minutes')
    `);
    if (result.changes > 0) {
      console.log(`[Auto-Approve Worker] Đã tự động duyệt thành công ${result.changes} công cụ AI sau 15 phút chờ.`);
    }

    // 2. Tự động kiểm tra và gửi email đã lên lịch (Email 2 & Email 3)
    try {
      const scheduledList = await db.all(`
        SELECT * FROM scheduled_emails 
        WHERE send_at <= datetime('now') AND sent = 0
      `);
      
      for (const item of scheduledList) {
        // Đổi trạng thái sent = 1 trước khi gọi API để chống gửi trùng lặp do trễ phản hồi
        await db.run('UPDATE scheduled_emails SET sent = 1 WHERE id = ?', [item.id]);
        
        sendSequenceEmail(item.email, item.name, item.email_type)
          .then(async (sendResult) => {
            if (sendResult.success) {
              console.log(`[Scheduler] Gửi thành công email chuỗi (${item.email_type}) tới ${item.email}.`);
            } else {
              console.error(`[Scheduler Error] Gửi email chuỗi (${item.email_type}) tới ${item.email} thất bại. Reset trạng thái.`);
              await db.run('UPDATE scheduled_emails SET sent = 0 WHERE id = ?', [item.id]);
            }
          })
          .catch(async (err) => {
            console.error(`[Scheduler Exception] Lỗi gửi email chuỗi tới ${item.email}:`, err.message);
            await db.run('UPDATE scheduled_emails SET sent = 0 WHERE id = ?', [item.id]);
          });
      }
    } catch (schedError) {
      console.error('[Scheduler Error] Lỗi xử lý hàng chờ gửi email:', schedError.message);
    }

  } catch (error) {
    console.error('[Background Worker Error] Lỗi hoạt động worker:', error.message);
  }
}, 60000); // Quét mỗi 60 giây (1 phút)

// Khởi chạy server và nạp dữ liệu mẫu
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await seedDatabase();
    
    // Tự động nâng cấp cơ sở dữ liệu nếu thiếu trường contact_email hoặc is_paid_submission
    const db = await getDb();
    try {
      await db.run('ALTER TABLE tools ADD COLUMN contact_email TEXT;');
      console.log('[Database] Đã tự động kiểm tra/thêm cột contact_email.');
    } catch (err) {}
    try {
      await db.run('ALTER TABLE tools ADD COLUMN is_paid_submission INTEGER DEFAULT 0;');
      console.log('[Database] Đã tự động kiểm tra/thêm cột is_paid_submission.');
    } catch (err) {}
    try {
      await db.run("ALTER TABLE leads ADD COLUMN lead_type TEXT DEFAULT 'newsletter';");
      console.log("[Database] Đã tự động kiểm tra/thêm cột lead_type.");
    } catch (err) {}
    try {
      await db.run(`
        CREATE TABLE IF NOT EXISTS scheduled_emails (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          name TEXT,
          email_type TEXT NOT NULL,
          send_at DATETIME NOT NULL,
          sent INTEGER DEFAULT 0
        );
      `);
      console.log('[Database] Đã tự động tạo bảng scheduled_emails.');
    } catch (err) {}
  } catch (err) {
    console.error('Error seeding database:', err);
  }
});
