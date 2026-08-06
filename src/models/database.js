import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const db = new Database('images.db');
db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      subject TEXT,
      category TEXT,
      subcategory TEXT,
      attributes TEXT,
      setting TEXT,
      action TEXT,
      colors TEXT,
      mood TEXT,
      composition TEXT,
      caption TEXT,
      confidence REAL,
      embedding TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS suggestions (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      image_id TEXT NOT NULL,
      score REAL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Seed posts if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM posts').get();
  if (count.count === 0) {
    const postsPath = join(process.cwd(), 'data', 'posts', 'posts.json');
    const posts = JSON.parse(readFileSync(postsPath, 'utf-8'));
    const insert = db.prepare('INSERT OR IGNORE INTO posts (id, title, body) VALUES (?, ?, ?)');
    for (const p of posts) {
      insert.run(p.id, p.title, p.body);
    }
  }
}

export function getAllPosts() {
  return db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
}

export function getPostById(id) {
  return db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
}

export function getImageByFilename(filename) {
  return db.prepare('SELECT * FROM images WHERE filename = ?').get(filename);
}

export function insertPost(post) {
  const stmt = db.prepare('INSERT INTO posts (id, title, body) VALUES (?, ?, ?)');
  stmt.run(post.id, post.title, post.body);
  return post;
}

export function insertImage(image) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO images (id, filename, subject, category, subcategory, attributes, setting, action, colors, mood, composition, caption, confidence, embedding)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    image.id || uuidv4(),
    image.filename,
    image.subject,
    image.category,
    image.subcategory || '',
    JSON.stringify(image.attributes || []),
    image.setting || '',
    image.action || '',
    JSON.stringify(image.colors || []),
    image.mood || '',
    image.composition || '',
    image.caption,
    image.confidence,
    image.embedding ? JSON.stringify(image.embedding) : null
  );
}

export function getAllImages() {
  const rows = db.prepare('SELECT * FROM images').all();
  return rows.map(row => ({
    ...row,
    attributes: JSON.parse(row.attributes || '[]'),
    colors: JSON.parse(row.colors || '[]'),
    embedding: row.embedding ? JSON.parse(row.embedding) : null
  }));
}

export function getImageById(id) {
  const row = db.prepare('SELECT * FROM images WHERE id = ?').get(id);
  if (!row) return null;
  return {
    ...row,
    attributes: JSON.parse(row.attributes || '[]'),
    colors: JSON.parse(row.colors || '[]'),
    embedding: row.embedding ? JSON.parse(row.embedding) : null
  };
}