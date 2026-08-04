import Database from 'better-sqlite3';
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