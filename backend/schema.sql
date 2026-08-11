-- SQLite database schema for NexToolX AI Tools Directory

-- SEO table to store metadata for any entity
CREATE TABLE IF NOT EXISTS seos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seo_title TEXT,
    meta_description TEXT,
    canonical_url TEXT,
    og_title TEXT,
    og_description TEXT,
    og_image TEXT,
    twitter_card TEXT,
    index_follow TEXT DEFAULT 'index, follow',
    schema_json TEXT
);

-- Categories supporting unlimited nesting
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    seo_id INTEGER REFERENCES seos(id) ON DELETE SET NULL,
    order_index INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active'
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#4F46E5',
    description TEXT,
    status TEXT DEFAULT 'active'
);

-- Collections (e.g. "Best AI Writing Tools")
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    featured_image TEXT,
    seo_id INTEGER REFERENCES seos(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active'
);

-- Blog Authors
CREATE TABLE IF NOT EXISTS authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bio TEXT,
    avatar TEXT,
    status TEXT DEFAULT 'active'
);

-- AI Tools core table
CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    short_description TEXT NOT NULL,
    full_description TEXT,
    logo TEXT,
    website_url TEXT,
    affiliate_url TEXT,
    pricing_type TEXT CHECK( pricing_type IN ('Free', 'Freemium', 'Paid', 'Free Trial') ) DEFAULT 'Freemium',
    pricing_details TEXT,
    verified INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    published INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    contact_email TEXT,
    is_paid_submission INTEGER DEFAULT 0,
    seo_id INTEGER REFERENCES seos(id) ON DELETE SET NULL,
    key_features TEXT,
    use_cases TEXT,
    who_is_it_for TEXT,
    pricing_plans TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gallery images for AI Tools
CREATE TABLE IF NOT EXISTS tool_gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    order_index INTEGER DEFAULT 0
);

-- Deals for AI Tools
CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    discount TEXT,
    coupon TEXT,
    affiliate_link TEXT,
    start_date TEXT,
    end_date TEXT,
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active'
);

-- Reviews for AI Tools (Future ready)
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    rating INTEGER CHECK( rating BETWEEN 1 AND 5 ),
    content TEXT,
    reviewer_name TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content TEXT,
    featured_image TEXT,
    author_id INTEGER REFERENCES authors(id) ON DELETE SET NULL,
    seo_id INTEGER REFERENCES seos(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic Menus managed from CRM
CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL UNIQUE,
    items_json TEXT NOT NULL DEFAULT '[]'
);

-- Media Library items
CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users (Admin, Editor)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'editor',
    status TEXT DEFAULT 'active'
);

-- Relationship Join Tables
CREATE TABLE IF NOT EXISTS tool_categories (
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (tool_id, category_id)
);

CREATE TABLE IF NOT EXISTS tool_tags (
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (tool_id, tag_id)
);

CREATE TABLE IF NOT EXISTS tool_collections (
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
    PRIMARY KEY (tool_id, collection_id)
);

CREATE TABLE IF NOT EXISTS blog_categories (
    blog_id INTEGER REFERENCES blogs(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_id, category_id)
);

CREATE TABLE IF NOT EXISTS blog_tags (
    blog_id INTEGER REFERENCES blogs(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_id, tag_id)
);

CREATE TABLE IF NOT EXISTS blog_related_tools (
    blog_id INTEGER REFERENCES blogs(id) ON DELETE CASCADE,
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    PRIMARY KEY (blog_id, tool_id)
);

-- Settings key-value store
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Traffic logs for click & impression tracking
CREATE TABLE IF NOT EXISTS traffic_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER REFERENCES tools(id) ON DELETE CASCADE,
    event_type TEXT CHECK( event_type IN ('click', 'impression') ),
    country TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Leads table for newsletter subscriptions & customer list
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    lead_type TEXT DEFAULT 'newsletter',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
