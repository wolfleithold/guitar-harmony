import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Song, FileRecord } from '@/types';

const dbPath = path.join(process.cwd(), 'guitar-harmony.db');

// Initialize database
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initDb(db);
  }
  return db;
}

function initDb(database: Database.Database) {
  // Create songs table
  database.exec(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      lyrics TEXT,
      key TEXT,
      guitar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create files table
  database.exec(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );
  `);

  // Create indexes
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_files_song_id ON files(song_id);
    CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
  `);
}

export type { Song, FileRecord };

// Song CRUD operations
export function createSong(song: Song): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO songs (title, lyrics, key, guitar)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(song.title, song.lyrics || '', song.key || '', song.guitar || '');
  return result.lastInsertRowid as number;
}

export function getSong(id: number): Song | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM songs WHERE id = ?');
  return stmt.get(id) as Song | undefined;
}

export function getAllSongs(): Song[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM songs ORDER BY updated_at DESC');
  return stmt.all() as Song[];
}

export function searchSongs(query: string): Song[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM songs 
    WHERE title LIKE ? OR lyrics LIKE ? OR key LIKE ? OR guitar LIKE ?
    ORDER BY updated_at DESC
  `);
  const searchTerm = `%${query}%`;
  return stmt.all(searchTerm, searchTerm, searchTerm, searchTerm) as Song[];
}

export function updateSong(id: number, song: Partial<Song>): void {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (song.title !== undefined) {
    fields.push('title = ?');
    values.push(song.title);
  }
  if (song.lyrics !== undefined) {
    fields.push('lyrics = ?');
    values.push(song.lyrics);
  }
  if (song.key !== undefined) {
    fields.push('key = ?');
    values.push(song.key);
  }
  if (song.guitar !== undefined) {
    fields.push('guitar = ?');
    values.push(song.guitar);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const stmt = db.prepare(`
    UPDATE songs SET ${fields.join(', ')}
    WHERE id = ?
  `);
  stmt.run(...values);
}

export function deleteSong(id: number): void {
  const db = getDb();
  
  // First, get all files for this song and delete them from disk
  const files = getFilesBySongId(id);
  for (const file of files) {
    try {
      fs.unlinkSync(file.file_path);
    } catch (err) {
      console.error(`Failed to delete file ${file.file_path} for song ${id}:`, err);
    }
  }
  
  // Then delete the song (CASCADE will delete file records)
  const stmt = db.prepare('DELETE FROM songs WHERE id = ?');
  stmt.run(id);
}

// File operations
export function addFile(file: FileRecord): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO files (song_id, filename, original_name, file_type, file_path, file_size)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    file.song_id,
    file.filename,
    file.original_name,
    file.file_type,
    file.file_path,
    file.file_size
  );
  return result.lastInsertRowid as number;
}

export function getFilesBySongId(songId: number): FileRecord[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM files WHERE song_id = ? ORDER BY created_at DESC');
  return stmt.all(songId) as FileRecord[];
}

export function getFile(id: number): FileRecord | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM files WHERE id = ?');
  return stmt.get(id) as FileRecord | undefined;
}

export function deleteFile(id: number): void {
  const db = getDb();
  const file = getFile(id);
  
  if (file) {
    try {
      fs.unlinkSync(file.file_path);
    } catch (err) {
      console.error(`Failed to delete file ${file.file_path} with id ${id}:`, err);
    }
    
    const stmt = db.prepare('DELETE FROM files WHERE id = ?');
    stmt.run(id);
  }
}

// Ensure uploads directory exists
export function ensureUploadsDir(): string {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}
