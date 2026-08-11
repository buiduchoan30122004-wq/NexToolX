import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'database.sqlite');

let db = null;

export async function getDb() {
  if (db) return db;
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Kích hoạt khóa ngoại (Foreign Keys) trong SQLite
  await db.run('PRAGMA foreign_keys = ON;');
  
  // Tự động kiểm tra và nâng cấp cấu trúc cơ sở dữ liệu (Migration)
  try {
    const tableInfo = await db.all('PRAGMA table_info(tools);');
    const columns = tableInfo.map(c => c.name);
    
    if (!columns.includes('key_features')) {
      await db.run('ALTER TABLE tools ADD COLUMN key_features TEXT;');
      console.log('[Migration] Added key_features column to tools table.');
    }
    if (!columns.includes('use_cases')) {
      await db.run('ALTER TABLE tools ADD COLUMN use_cases TEXT;');
      console.log('[Migration] Added use_cases column to tools table.');
    }
    if (!columns.includes('who_is_it_for')) {
      await db.run('ALTER TABLE tools ADD COLUMN who_is_it_for TEXT;');
      console.log('[Migration] Added who_is_it_for column to tools table.');
    }
    if (!columns.includes('pricing_plans')) {
      await db.run('ALTER TABLE tools ADD COLUMN pricing_plans TEXT;');
      console.log('[Migration] Added pricing_plans column to tools table.');
    }
  } catch (migErr) {
    console.error('[Migration Error] Lỗi tự động nâng cấp bảng tools:', migErr.message);
  }
  
  return db;
}

export async function initDb() {
  const database = await getDb();
  
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  // Sử dụng exec() để chạy đồng thời nhiều câu lệnh SQL trong schema.sql
  await database.exec(schemaSql);
  
  console.log('SQLite Database initialized successfully.');
  return database;
}
