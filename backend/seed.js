import { initDb, getDb } from './db.js';
import crypto from 'crypto';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function seedDatabase() {
  const db = await initDb();

  // Kiểm tra xem đã có dữ liệu chưa
  const userCount = await db.get('SELECT COUNT(*) as count FROM users');
  if (userCount.count > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  console.log('Seeding initial database data...');

  // 1. Tạo SEO mặc định
  const seoStmt = await db.prepare(`
    INSERT INTO seos (seo_title, meta_description, canonical_url, og_title, og_description, index_follow)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  // Seo 1: Home
  const seoHome = await seoStmt.run('NexToolX | Ultimate AI Tools Directory', 'Discover the best AI tools, curated collections, and exclusive deals to boost your productivity.', 'https://nextoolx.com', 'NexToolX | Ultimate AI Tools Directory', 'Discover the best AI tools, curated collections, and exclusive deals.');
  const seoHomeId = seoHome.lastID;
  
  // Seo 2: Writing
  const seoWriting = await seoStmt.run('Best AI Writing & Copywriting Tools', 'Browse the top-rated AI writing assistants, summarizers, and copywriting software.', 'https://nextoolx.com/categories/writing', 'Best AI Writing Tools', 'Browse the top-rated AI writing assistants.');
  const seoWritingId = seoWriting.lastID;

  // Seo 3: Coding
  const seoCoding = await seoStmt.run('Top AI Tools for Coding & Development', 'Enhance your coding speed with AI-powered code generators, assistant plugins, and web builders.', 'https://nextoolx.com/categories/coding', 'Top AI Coding Tools', 'Enhance your coding speed with AI-powered generators.');
  const seoCodingId = seoCoding.lastID;

  // Seo 4: ChatGPT
  const seoChatGpt = await seoStmt.run('ChatGPT - AI Chat Assistant by OpenAI', 'Learn about ChatGPT, its features, pricing, and how it can help you with writing, coding, and brainstorming.', 'https://nextoolx.com/tools/chatgpt', 'ChatGPT review and pricing', 'Learn about ChatGPT, its features and pricing.', 'index, follow');
  const seoChatGptId = seoChatGpt.lastID;

  await seoStmt.finalize();

  // 2. Tạo Admin User
  const adminPassword = hashPassword('admin123');
  await db.run(
    'INSERT INTO users (username, password_hash, role, status) VALUES (?, ?, ?, ?)',
    ['admin', adminPassword, 'admin', 'active']
  );
  console.log('Seeded User: admin / admin123');

  // 3. Tạo Menu động (Header & Footer)
  const headerMenu = [
    { id: 1, label: 'Home', path: '/', order: 1 },
    { id: 2, label: 'Browse', path: '/browse', order: 2 },
    { id: 3, label: 'Categories', path: '/categories', order: 3 },
    { id: 4, label: 'Collections', path: '/collections', order: 4 },
    { id: 5, label: 'Deals', path: '/deals', order: 5 },
    { id: 6, label: 'Blog', path: '/blog', order: 6 },
    { id: 7, label: 'Submit Tool', path: '/submit-tool', order: 7 }
  ];

  const footerMenu = [
    { id: 1, label: 'About Us', path: '/about', order: 1 },
    { id: 2, label: 'Contact', path: '/contact', order: 2 },
    { id: 3, label: 'Privacy Policy', path: '/privacy', order: 3 },
    { id: 4, label: 'Terms of Service', path: '/terms', order: 4 }
  ];

  await db.run('INSERT INTO menus (name, location, items_json) VALUES (?, ?, ?)', ['Header Menu', 'header', JSON.stringify(headerMenu)]);
  await db.run('INSERT INTO menus (name, location, items_json) VALUES (?, ?, ?)', ['Footer Menu', 'footer', JSON.stringify(footerMenu)]);
  console.log('Seeded Menus (Header & Footer)');

  // 4. Tạo Categories (Có cấu trúc cha-con lồng nhau)
  const catStmt = await db.prepare(`
    INSERT INTO categories (name, slug, description, icon, parent_id, seo_id, order_index, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const catWriting = await catStmt.run('Text & Writing', 'text-writing', 'AI tools for copywriting, blogging, translating, and editing text.', 'PenTool', null, seoWritingId, 1, 'active');
  const catWritingId = catWriting.lastID;

  const catCoding = await catStmt.run('Coding & Development', 'coding-development', 'AI code assistants, generators, syntax debuggers, and web designers.', 'Code', null, seoCodingId, 2, 'active');
  const catCodingId = catCoding.lastID;

  const catDesign = await catStmt.run('Design & Art', 'design-art', 'AI image generators, 3D design creators, and design helpers.', 'Palette', null, null, 3, 'active');
  const catDesignId = catDesign.lastID;

  // Subcategories
  const subCopy = await catStmt.run('AI Copywriting', 'ai-copywriting', 'Generate marketing copy, ads, and blogs.', 'FileText', catWritingId, null, 1, 'active');
  const subCopyId = subCopy.lastID;
  const subSummarizer = await catStmt.run('Summarizers', 'text-summarizers', 'Condense long articles and documents.', 'Layers', catWritingId, null, 2, 'active');
  const subSummarizerId = subSummarizer.lastID;

  const subEditor = await catStmt.run('Code Assistants', 'code-assistants', 'Copilot plugins and AI-powered IDEs.', 'Terminal', catCodingId, null, 1, 'active');
  const subEditorId = subEditor.lastID;
  const subNoCode = await catStmt.run('No-Code Builders', 'no-code-builders', 'Build apps and websites without writing code.', 'Globe', catCodingId, null, 2, 'active');
  const subNoCodeId = subNoCode.lastID;

  const subImageGen = await catStmt.run('Image Generators', 'image-generators', 'Generate stunning visuals from text prompts.', 'Image', catDesignId, null, 1, 'active');
  const subImageGenId = subImageGen.lastID;

  await catStmt.finalize();
  console.log('Seeded Categories (including subcategories)');

  // 5. Tạo Tags
  const tagStmt = await db.prepare(`
    INSERT INTO tags (name, slug, color, description, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  const tagHot = await tagStmt.run('Hot', 'hot', '#EF4444', 'Trending tools with high traffic.', 'active');
  const tagHotId = tagHot.lastID;

  const tagEditorsChoice = await tagStmt.run("Editor's Choice", 'editors-choice', '#8B5CF6', 'Handpicked and highly recommended by our team.', 'active');
  const tagEditorsChoiceId = tagEditorsChoice.lastID;

  const tagOpenSource = await tagStmt.run('Open Source', 'open-source', '#10B981', 'Free code, self-hostable tools.', 'active');
  const tagOpenSourceId = tagOpenSource.lastID;

  await tagStmt.finalize();
  console.log('Seeded Tags');

  // 6. Tạo Collections
  const collStmt = await db.prepare(`
    INSERT INTO collections (name, slug, description, featured_image, seo_id, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const collBestWriting = await collStmt.run('Best AI Writing Tools', 'best-ai-writing-tools', 'Increase your output with these top-rated writing platforms.', '', null, 'active');
  const collBestWritingId = collBestWriting.lastID;

  const collDevMustHave = await collStmt.run('Developer Must-Haves', 'developer-must-have-ai-tools', 'Supercharge your programming workflow with code generators and editors.', '', null, 'active');
  const collDevMustHaveId = collDevMustHave.lastID;

  await collStmt.finalize();
  console.log('Seeded Collections');

  // 7. Tạo Authors & Blogs
  const author = await db.run(
    'INSERT INTO authors (name, bio, avatar, status) VALUES (?, ?, ?, ?)',
    ['Alex Carter', 'AI Researcher and tech writer covering LLMs and productivity.', '', 'active']
  );
  const authorId = author.lastID;

  const blog = await db.run(`
    INSERT INTO blogs (title, slug, content, featured_image, author_id, seo_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    'How AI Code Assistants Are Changing Programming Forever',
    'ai-code-assistants-changing-programming',
    'AI code assistants like Cursor, Copilot, and Tabnine are reshaping software engineering. This article explores how developers are using them to speed up coding, write better tests, and learn new frameworks faster. We compare the leading solutions and look at what is coming in the future.',
    '',
    authorId,
    null,
    'published'
  ]);
  const blogId = blog.lastID;
  console.log('Seeded Authors & Blogs');

  // 8. Tạo Tools
  const toolStmt = await db.prepare(`
    INSERT INTO tools (name, slug, short_description, full_description, website_url, affiliate_url, pricing_type, pricing_details, verified, featured, published, status, seo_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // ChatGPT
  const toolChatGpt = await toolStmt.run(
    'ChatGPT',
    'chatgpt',
    'Conversational AI model by OpenAI that can write, code, brainstorm, and answer questions.',
    'ChatGPT is a powerful large language model created by OpenAI. It excels at answering complex questions, generating high-quality creative text, drafting emails, writing and debugging code, translating languages, and assisting with brainstorming sessions. It is powered by GPT-4o and offers a massive library of Custom GPTs for tailored assistance.',
    'https://chatgpt.com',
    'https://chatgpt.com',
    'Freemium',
    'Free basic plan. Plus starts at $20/month.',
    1, // Verified
    1, // Featured
    1, // Published
    'approved',
    seoChatGptId
  );
  const toolChatGptId = toolChatGpt.lastID;

  // Midjourney
  const toolMidjourney = await toolStmt.run(
    'Midjourney',
    'midjourney',
    'State-of-the-art text-to-image generator producing beautiful, cinematic imagery.',
    'Midjourney is an independent research lab exploring new mediums of thought. It generates highly artistic, photo-realistic, and cinematic images from simple text descriptions. Users interact with Midjourney via Discord or their newly launched web interface to prompt, scale, and vary images.',
    'https://midjourney.com',
    '',
    'Paid',
    'Starts from $10/month.',
    1,
    1,
    1,
    'approved',
    null
  );
  const toolMidjourneyId = toolMidjourney.lastID;

  // Cursor
  const toolCursor = await toolStmt.run(
    'Cursor',
    'cursor',
    'An AI-first code editor fork of VS Code built for pair programming.',
    'Cursor is a fork of Visual Studio Code that integrates state-of-the-art LLMs (like Claude 3.5 Sonnet and GPT-4o) directly into your editor environment. It features inline code generation (Cmd+K), chat sidebar (Cmd+L), codebase-wide indexing for semantic search, and autocomplete that guesses your next edit.',
    'https://cursor.com',
    'https://cursor.com?aff=nextoolx',
    'Freemium',
    'Free plan with 50 fast queries. Pro is $20/month.',
    1,
    1,
    1,
    'approved',
    null
  );
  const toolCursorId = toolCursor.lastID;

  await toolStmt.finalize();
  console.log('Seeded Tools');

  // 9. Tạo Deals
  await db.run(`
    INSERT INTO deals (title, discount, coupon, affiliate_link, start_date, end_date, tool_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    '20% Off Pro Annual Plan',
    '20% OFF',
    'CURSOR20',
    'https://cursor.com?aff=nextoolx',
    '2026-08-01',
    '2026-12-31',
    toolCursorId,
    'active'
  ]);
  console.log('Seeded Deals');

  // 10. Tạo Reviews
  await db.run(`
    INSERT INTO reviews (tool_id, rating, content, reviewer_name, status)
    VALUES (?, ?, ?, ?, ?)
  `, [
    toolCursorId,
    5,
    'Cursor has completely replaced VS Code for me. The codebase-wide chat is a game changer.',
    'John Doe',
    'approved'
  ]);
  console.log('Seeded Reviews');

  // 11. Thiết lập mối quan hệ
  // Tool Categories
  await db.run('INSERT INTO tool_categories (tool_id, category_id) VALUES (?, ?)', [toolChatGptId, catWritingId]);
  await db.run('INSERT INTO tool_categories (tool_id, category_id) VALUES (?, ?)', [toolChatGptId, subCopyId]);
  await db.run('INSERT INTO tool_categories (tool_id, category_id) VALUES (?, ?)', [toolMidjourneyId, catDesignId]);
  await db.run('INSERT INTO tool_categories (tool_id, category_id) VALUES (?, ?)', [toolMidjourneyId, subImageGenId]);
  await db.run('INSERT INTO tool_categories (tool_id, category_id) VALUES (?, ?)', [toolCursorId, catCodingId]);
  await db.run('INSERT INTO tool_categories (tool_id, category_id) VALUES (?, ?)', [toolCursorId, subEditorId]);

  // Tool Tags
  await db.run('INSERT INTO tool_tags (tool_id, tag_id) VALUES (?, ?)', [toolChatGptId, tagHotId]);
  await db.run('INSERT INTO tool_tags (tool_id, tag_id) VALUES (?, ?)', [toolChatGptId, tagEditorsChoiceId]);
  await db.run('INSERT INTO tool_tags (tool_id, tag_id) VALUES (?, ?)', [toolMidjourneyId, tagHotId]);
  await db.run('INSERT INTO tool_tags (tool_id, tag_id) VALUES (?, ?)', [toolCursorId, tagEditorsChoiceId]);

  // Tool Collections
  await db.run('INSERT INTO tool_collections (tool_id, collection_id) VALUES (?, ?)', [toolChatGptId, collBestWritingId]);
  await db.run('INSERT INTO tool_collections (tool_id, collection_id) VALUES (?, ?)', [toolCursorId, collDevMustHaveId]);

  // Blog Categories & Tags & Related Tools
  await db.run('INSERT INTO blog_categories (blog_id, category_id) VALUES (?, ?)', [blogId, catCodingId]);
  await db.run('INSERT INTO blog_tags (blog_id, tag_id) VALUES (?, ?)', [blogId, tagEditorsChoiceId]);
  await db.run('INSERT INTO blog_related_tools (blog_id, tool_id) VALUES (?, ?)', [blogId, toolCursorId]);

  console.log('All relationships mapped in database.');
  console.log('Database Seeding Completed Successfully!');
}
