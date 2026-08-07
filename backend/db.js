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
