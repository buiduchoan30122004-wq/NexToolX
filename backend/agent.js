import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDb } from './db.js';
import dotenv from 'dotenv';

dotenv.config();

// Helper resolve relative URLs to absolute URLs
function resolveUrl(baseUrl, relativeUrl) {
  if (!relativeUrl) return '';
  try {
    return new URL(relativeUrl, baseUrl).href;
  } catch (err) {
    return relativeUrl;
  }
}

// Helper to create default SEO entry for categories/tools
async function getOrCreateSeo(db, seo) {
  if (!seo) {
    const result = await db.run('INSERT INTO seos DEFAULT VALUES');
    return result.lastID;
  }
  const { seo_title, meta_description, canonical_url, og_title, og_description, og_image, twitter_card, index_follow, schema_json } = seo;
  const result = await db.run(`
    INSERT INTO seos (seo_title, meta_description, canonical_url, og_title, og_description, og_image, twitter_card, index_follow, schema_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    seo_title || null, meta_description || null, canonical_url || null, og_title || null, og_description || null, og_image || null,
    twitter_card || 'summary_large_image', index_follow || 'index, follow', schema_json || null
  ]);
  return result.lastID;
}

// Hàm làm sạch HTML và trích xuất logo & banner bằng Cheerio một cách triệt để nhất
function cleanHtmlAndExtractImages(html, url) {
  const $ = cheerio.load(html);
  
  // 1. TRÍCH XUẤT LOGO (Cực kỳ chủ động)
  let logoUrl = '';
  
  // A. Thẻ link icon phổ biến
  const iconLink = $('link[rel="apple-touch-icon"]').attr('href') || 
                   $('link[rel="shortcut icon"]').attr('href') || 
                   $('link[rel="icon"]').attr('href') ||
                   $('link[rel="fluid-icon"]').attr('href') ||
                   $('link[rel="mask-icon"]').attr('href');
  if (iconLink) {
    logoUrl = resolveUrl(url, iconLink);
  }

  // B. Meta tag logo
  if (!logoUrl) {
    logoUrl = $('meta[property="og:logo"]').attr('content') || 
              $('meta[itemprop="logo"]').attr('content') || '';
  }

  // C. Tìm kiếm hình ảnh trong trang có class/id/alt chứa "logo", "brand", "favicon"
  if (!logoUrl) {
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      const cls = $(el).attr('class') || '';
      const id = $(el).attr('id') || '';
      if (src && (
        alt.toLowerCase().includes('logo') || alt.toLowerCase().includes('brand') || alt.toLowerCase().includes('favicon') ||
        cls.toLowerCase().includes('logo') || cls.toLowerCase().includes('brand') ||
        id.toLowerCase().includes('logo') || id.toLowerCase().includes('brand')
      )) {
        logoUrl = resolveUrl(url, src);
        return false; // break
      }
    });
  }

  // D. Thử tìm logo ở phần Header hoặc Navbar
  if (!logoUrl) {
    $('header img, nav img').first().each((i, el) => {
      const src = $(el).attr('src');
      if (src) {
        logoUrl = resolveUrl(url, src);
      }
    });
  }

  // E. Fallback cuối cùng: Thử favicon mặc định
  if (!logoUrl) {
    try {
      const u = new URL(url);
      logoUrl = `${u.protocol}//${u.host}/favicon.ico`;
    } catch (_) {}
  }

  // 2. TRÍCH XUẤT BANNER (Cực kỳ chủ động)
  let bannerUrl = '';
  
  // A. Meta tag chia sẻ ảnh (Thường là banner chính thức của web)
  const metaBanner = $('meta[property="og:image"]').attr('content') || 
                     $('meta[name="twitter:image"]').attr('content') ||
                     $('meta[name="twitter:image:src"]').attr('content') ||
                     $('meta[property="og:image:secure_url"]').attr('content');
  if (metaBanner) {
    bannerUrl = resolveUrl(url, metaBanner);
  }

  // B. Tìm kiếm ảnh lớn (hero, banner, cover)
  if (!bannerUrl) {
    $('img').each((i, el) => {
      const src = $(el).attr('src');
      const alt = $(el).attr('alt') || '';
      const cls = $(el).attr('class') || '';
      const id = $(el).attr('id') || '';
      if (src && (
        alt.toLowerCase().includes('banner') || alt.toLowerCase().includes('hero') || alt.toLowerCase().includes('cover') || alt.toLowerCase().includes('showcase') ||
        cls.toLowerCase().includes('banner') || cls.toLowerCase().includes('hero') || cls.toLowerCase().includes('cover') ||
        id.toLowerCase().includes('banner') || id.toLowerCase().includes('hero') || id.toLowerCase().includes('cover')
      )) {
        bannerUrl = resolveUrl(url, src);
        return false; // break
      }
    });
  }

  // C. Nếu không tìm thấy, lấy hình ảnh lớn đầu tiên trong phần body của trang
  if (!bannerUrl) {
    $('body img').each((i, el) => {
      const src = $(el).attr('src');
      if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('avatar')) {
        bannerUrl = resolveUrl(url, src);
        return false; // break
      }
    });
  }

  // 3. LÀM SẠCH TEXT TRANG WEB
  const metaTitle = $('title').text() || '';
  const metaDesc = $('meta[name="description"]').attr('content') || 
                   $('meta[property="og:description"]').attr('content') || '';
  
  $('script, style, iframe, noscript, svg, nav, footer, header, head').remove();
  
  let bodyText = $('body').text();
  bodyText = bodyText.replace(/\s+/g, ' ').trim();
  
  const cleanContent = `Title: ${metaTitle}\nDescription: ${metaDesc}\n\nBody:\n${bodyText.substring(0, 12000)}`;
  
  return {
    logoUrl,
    bannerUrl,
    cleanContent
  };
}

// Hàm chính cào trang web và phân tích bằng Gemini, tự động ánh xạ & tạo danh mục mới
export async function scrapeAndAnalyzeProject(url) {
  // Lấy API Key từ cơ sở dữ liệu settings
  let apiKey = '';
  try {
    const db = await getDb();
    const row = await db.get('SELECT value FROM settings WHERE key = ?', ['gemini_api_key']);
    if (row && row.value && row.value.trim() && row.value !== 'YOUR_GEMINI_API_KEY_HERE') {
      apiKey = row.value.trim();
    }
  } catch (dbErr) {
    console.error('[Agent DB] Error querying gemini_api_key:', dbErr.message);
  }

  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY;
  }

  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    throw new Error('Please configure GEMINI_API_KEY in the CRM Settings panel.');
  }

  // Lấy cấu hình model từ SQLite settings
  let modelName = 'gemini-2.5-flash';
  try {
    const db = await getDb();
    const row = await db.get('SELECT value FROM settings WHERE key = ?', ['gemini_model']);
    if (row && row.value && row.value.trim()) {
      modelName = row.value.trim();
    }
  } catch (dbErr) {
    console.error('[Agent DB] Error querying gemini_model:', dbErr.message);
  }

  // 1. Cào HTML trang web
  let html = '';
  try {
    console.log(`[Agent Scraper] Scraping page: ${url}`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 15000,
      maxRedirects: 5
    });
    html = response.data;
  } catch (err) {
    console.error(`[Agent Scraper] Error scraping URL ${url}:`, err.message);
    throw new Error(`Failed to fetch content from URL: ${err.message}`);
  }

  const { logoUrl, bannerUrl, cleanContent } = cleanHtmlAndExtractImages(html, url);

  // 2. Lấy danh mục và tags hiện có trong CSDL
  const db = await getDb();
  let categories = [];
  let tags = [];
  try {
    categories = await db.all('SELECT id, name, slug FROM categories');
    tags = await db.all('SELECT id, name, slug FROM tags');
  } catch (dbErr) {
    console.error('[Agent DB] Error fetching categories/tags:', dbErr.message);
  }

  const categoriesStr = categories.map(c => `ID ${c.id}: ${c.name} (slug: ${c.slug})`).join('\n');
  const tagsStr = tags.map(t => `ID ${t.id}: ${t.name} (slug: ${t.slug})`).join('\n');

  // 3. Gọi Gemini phân tích tính năng và ánh xạ danh mục
  console.log(`[Agent AI] Initializing model: ${modelName} to analyze project...`);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  const systemPrompt = `You are a professional AI data entry assistant for the NexToolX AI Tools Directory.
Your task is to analyze the features of the AI tool from the scraped website content and populate the structured project info.
All text values (name, descriptions, SEO metadata, pricing details) and newly suggested categories/tags MUST be in English because the site is optimized for the European SEO market.

=== Category & Tag Mapping Requirements ===
1. Analyze the core features of the tool.
2. Find the most relevant categories in the provided list of existing categories (select up to 2).
3. If NO existing category fits, you may suggest creating up to 1 new category in "new_categories".
   *CRITICAL RULE*: Minimize creating new categories. Prioritize matching existing categories first. Only suggest a new category if the tool represents a completely new domain or feature set that cannot be classified under any existing category.
4. Perform the same mapping logic for Tags. Select up to 3 existing tags or suggest up to 2 new tags in "new_tags".

=== List of Existing Categories in the System ===
${categoriesStr || 'None'}

=== List of Existing Tags in the System ===
${tagsStr || 'None'}

The response JSON must strictly match the structure below. Do NOT wrap the JSON in markdown blocks (such as \`\`\`json \`\`\`). Return ONLY raw JSON text:
{
  "name": "Short, clean AI tool name (e.g., 'Cursor' instead of long SEO-spam titles)",
  "slug": "lowercase-slug-with-hyphens",
  "short_description": "A single-sentence punchy description of what the tool does (under 150 characters)",
  "full_description": "A comprehensive description in Markdown format (1-2 paragraphs), highlighting core features and user benefits.",
  "pricing_type": "Must be exactly one of: 'Free', 'Freemium', 'Paid', 'Free Trial'",
  "pricing_details": "Short details of plans (e.g., 'Free 50 credits/mo, Pro starts at $20/mo' or 'Contact website for pricing')",
  "seo_title": "Optimized SEO title (under 60 characters)",
  "meta_description": "SEO meta description (under 160 characters)",
  "category_ids": [array of matched existing category IDs, e.g. [2]],
  "tag_ids": [array of matched existing tag IDs, e.g. [1, 3]],
  "new_categories": [
    // Fill only if absolutely no existing category fits and a new one must be created
    { "name": "New Category Name", "slug": "new-category-slug", "description": "Short description of the new category" }
  ],
  "new_tags": [
    // Fill only if no existing tag fits
    { "name": "New Tag Name", "slug": "new-tag-slug" }
  ],
  "schema_json": {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Tool Name",
    "description": "Short description",
    "applicationCategory": "MultimediaApplication or DeveloperApplication or BusinessApplication",
    "operatingSystem": "All",
    "softwareRequirements": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD",
      "description": "Pricing details (e.g., Free, Freemium)"
    }
  }
}

If pricing details are not clear on the website, use "pricing_type": "Freemium" and "pricing_details": "Visit website for pricing details".
`;

  try {
    const result = await model.generateContent(`${systemPrompt}\n\nNội dung trang web cần quét:\nURL: ${url}\n${cleanContent}`);
    const response = await result.response;
    let jsonText = response.text() || '';
    
    if (jsonText.includes('```')) {
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    console.log('[Agent AI] Phản hồi phân tích từ Gemini:', jsonText);
    const parsedData = JSON.parse(jsonText);
    
    // 4. XỬ LÝ TỰ ĐỘNG THÊM DANH MỤC MỚI VÀO DATABASE
    const finalCategoryIds = parsedData.category_ids || [];
    if (parsedData.new_categories && Array.isArray(parsedData.new_categories) && parsedData.new_categories.length > 0) {
      for (const newCat of parsedData.new_categories) {
        if (!newCat.name || !newCat.slug) continue;
        try {
          // Kiểm tra xem đã trùng slug chưa
          const exists = await db.get('SELECT id FROM categories WHERE slug = ?', [newCat.slug]);
          if (exists) {
            finalCategoryIds.push(exists.id);
            console.log(`[Agent Category] Danh mục trùng slug đã tồn tại: ${newCat.slug} (ID: ${exists.id})`);
          } else {
            const seoId = await getOrCreateSeo(db, {
              seo_title: `${newCat.name} - Best AI Tools`,
              meta_description: newCat.description || `Browse the top rated AI tools in the ${newCat.name} category.`,
              canonical_url: `https://nextoolx.com/categories/${newCat.slug}`,
              og_title: `${newCat.name} - Best AI Tools`,
              og_description: newCat.description || `Browse the top rated AI tools in the ${newCat.name} category.`
            });
            const insertRes = await db.run(
              'INSERT INTO categories (name, slug, description, seo_id, status) VALUES (?, ?, ?, ?, ?)',
              [newCat.name, newCat.slug, newCat.description || '', seoId, 'active']
            );
            finalCategoryIds.push(insertRes.lastID);
            console.log(`[Agent Category] Tự động tạo danh mục mới: ${newCat.name} (ID: ${insertRes.lastID})`);
          }
        } catch (catErr) {
          console.error('[Agent Category] Lỗi khi tạo danh mục mới:', catErr.message);
        }
      }
    }

    // 5. XỬ LÝ TỰ ĐỘNG THÊM TAGS MỚI VÀO DATABASE
    const finalTagIds = parsedData.tag_ids || [];
    if (parsedData.new_tags && Array.isArray(parsedData.new_tags) && parsedData.new_tags.length > 0) {
      for (const newTag of parsedData.new_tags) {
        if (!newTag.name || !newTag.slug) continue;
        try {
          const exists = await db.get('SELECT id FROM tags WHERE slug = ?', [newTag.slug]);
          if (exists) {
            finalTagIds.push(exists.id);
            console.log(`[Agent Tag] Tag trùng slug đã tồn tại: ${newTag.slug} (ID: ${exists.id})`);
          } else {
            const insertRes = await db.run(
              'INSERT INTO tags (name, slug, status) VALUES (?, ?, ?)',
              [newTag.name, newTag.slug, 'active']
            );
            finalTagIds.push(insertRes.lastID);
            console.log(`[Agent Tag] Tự động tạo tag mới: ${newTag.name} (ID: ${insertRes.lastID})`);
          }
        } catch (tagErr) {
          console.error('[Agent Tag] Lỗi khi tạo tag mới:', tagErr.message);
        }
      }
    }

    // 6. Lấy lại toàn bộ danh mục & tags mới cập nhật trong DB để gửi ngược lại cho frontend đồng bộ
    const allCategories = await db.all('SELECT * FROM categories');
    const allTags = await db.all('SELECT * FROM tags');

    // Trả về cấu trúc đồng bộ hoàn chỉnh
    return {
      tool: {
        name: parsedData.name,
        slug: parsedData.slug,
        short_description: parsedData.short_description,
        full_description: parsedData.full_description,
        pricing_type: parsedData.pricing_type,
        pricing_details: parsedData.pricing_details,
        seo_title: parsedData.seo_title,
        meta_description: parsedData.meta_description,
        schema_json: parsedData.schema_json ? (typeof parsedData.schema_json === 'object' ? JSON.stringify(parsedData.schema_json, null, 2) : parsedData.schema_json) : '',
        categories: finalCategoryIds,
        tags: finalTagIds,
        logo_url: logoUrl,
        banner_url: bannerUrl,
        website_url: url
      },
      categories: allCategories,
      tags: allTags
    };
  } catch (aiErr) {
    console.error('[Agent AI] Lỗi cào/phân tích:', aiErr.message);
    throw new Error(`Phân tích AI thất bại: ${aiErr.message}`);
  }
}
