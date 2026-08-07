import { getDb, initDb } from './db.js';
import { seedDatabase } from './seed.js';
import crypto from 'crypto';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function runTests() {
  console.log('--- STARTING DATABASE & DATA MODEL SANITY CHECKS ---');
  
  try {
    // 1. Khởi tạo DB & Seed
    console.log('1. Initializing database and running migrations...');
    await initDb();
    
    console.log('2. Seeding initial data...');
    await seedDatabase();
    
    const db = await getDb();
    
    // 2. Kiểm tra User Admin
    console.log('3. Verifying admin user account...');
    const admin = await db.get('SELECT * FROM users WHERE username = "admin"');
    if (!admin) {
      throw new Error('Test failed: admin user not found');
    }
    const hashedPwd = hashPassword('admin123');
    if (admin.password_hash !== hashedPwd) {
      throw new Error('Test failed: admin password hash does not match expected SHA-256');
    }
    console.log('✔ Admin user account verified successfully.');

    // 3. Kiểm tra Menus
    console.log('4. Checking dynamic navigation menus...');
    const headerMenu = await db.get('SELECT * FROM menus WHERE location = "header"');
    const footerMenu = await db.get('SELECT * FROM menus WHERE location = "footer"');
    if (!headerMenu || !footerMenu) {
      throw new Error('Test failed: dynamic menus are missing');
    }
    const headerItems = JSON.parse(headerMenu.items_json);
    console.log(`✔ Dynamic menus verified: Header contains ${headerItems.length} items.`);

    // 4. Kiểm tra Categories (Kiểm tra quan hệ cha-con lồng nhau)
    console.log('5. Testing category nesting architecture...');
    const subcats = await db.all('SELECT c.*, p.name as parent_name FROM categories c JOIN categories p ON c.parent_id = p.id');
    if (subcats.length === 0) {
      throw new Error('Test failed: parent-child category relationships were not found');
    }
    console.log(`✔ Nesting check OK: Found ${subcats.length} subcategories (e.g. "${subcats[0].name}" child of "${subcats[0].parent_name}").`);

    // 5. Kiểm tra Tools và Quan hệ
    console.log('6. Verifying AI Tools and relationship integrity (Categories & Tags)...');
    const cursorTool = await db.get('SELECT * FROM tools WHERE slug = "cursor"');
    if (!cursorTool) {
      throw new Error('Test failed: Cursor AI tool not found');
    }
    
    const cursorCats = await db.all(`
      SELECT c.name FROM categories c
      JOIN tool_categories tc ON c.id = tc.category_id
      WHERE tc.tool_id = ?
    `, [cursorTool.id]);
    
    const cursorTags = await db.all(`
      SELECT t.name FROM tags t
      JOIN tool_tags tt ON t.id = tt.tag_id
      WHERE tt.tool_id = ?
    `, [cursorTool.id]);
    
    console.log(`✔ Tool details: "${cursorTool.name}" verified.`);
    console.log(`  - Assigned Categories: ${cursorCats.map(c => c.name).join(', ')}`);
    console.log(`  - Assigned Tags: ${cursorTags.map(t => t.name).join(', ')}`);

    console.log('\n=============================================');
    console.log('🎉 ALL BACKEND DATA INTEGRITY TESTS PASSED! 🎉');
    console.log('=============================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST RUN FAILED with error:', error);
    process.exit(1);
  }
}

runTests();
