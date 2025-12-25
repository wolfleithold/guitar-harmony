import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { Song, FileRecord, Readiness } from "@/types";

const dbPath = path.join(process.cwd(), "guitar-harmony.db");

// Initialize database
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
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
      readiness TEXT DEFAULT 'Writing' CHECK(readiness IN ('Idea', 'Writing', 'Practice', 'GigReady', 'Archived')),
      last_played_at DATETIME,
      play_count INTEGER DEFAULT 0,
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

  // Migration: Add new columns if they don't exist
  const tableInfo = database.pragma("table_info(songs)") as Array<{
    name: string;
  }>;
  const columns = tableInfo.map((col) => col.name);

  if (!columns.includes("readiness")) {
    database.exec(
      `ALTER TABLE songs ADD COLUMN readiness TEXT DEFAULT 'Writing' CHECK(readiness IN ('Idea', 'Writing', 'Practice', 'GigReady', 'Archived'));`
    );
  }
  if (!columns.includes("last_played_at")) {
    database.exec(`ALTER TABLE songs ADD COLUMN last_played_at DATETIME;`);
  }
  if (!columns.includes("play_count")) {
    database.exec(`ALTER TABLE songs ADD COLUMN play_count INTEGER DEFAULT 0;`);
  }
}

export type { Song, FileRecord, Readiness };

// Song CRUD operations
export function createSong(song: Song): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO songs (title, lyrics, key, guitar, readiness)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    song.title,
    song.lyrics || "",
    song.key || "",
    song.guitar || "",
    song.readiness || "Writing"
  );
  return result.lastInsertRowid as number;
}

export function getSong(id: number): Song | undefined {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM songs WHERE id = ?");
  return stmt.get(id) as Song | undefined;
}

export function getAllSongs(
  readiness?: Readiness,
  sortBy?: "updated" | "played-recent" | "played-oldest",
  excludeArchived?: boolean
): Song[] {
  const db = getDb();
  let query = "SELECT * FROM songs";
  const params: any[] = [];

  const conditions: string[] = [];

  if (readiness) {
    conditions.push("readiness = ?");
    params.push(readiness);
  }

  if (excludeArchived) {
    conditions.push("readiness != 'Archived'");
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  // Add sorting
  switch (sortBy) {
    case "played-recent":
      query += " ORDER BY last_played_at DESC NULLS LAST, updated_at DESC";
      break;
    case "played-oldest":
      query += " ORDER BY last_played_at ASC NULLS LAST, updated_at DESC";
      break;
    default:
      query += " ORDER BY updated_at DESC";
  }

  const stmt = db.prepare(query);
  return stmt.all(...params) as Song[];
}

export function searchSongs(query: string, readiness?: Readiness): Song[] {
  const db = getDb();
  let sql = `
    SELECT * FROM songs 
    WHERE (title LIKE ? OR lyrics LIKE ? OR key LIKE ? OR guitar LIKE ?)`;
  const searchTerm = `%${query}%`;
  const params: any[] = [searchTerm, searchTerm, searchTerm, searchTerm];

  if (readiness) {
    sql += " AND readiness = ?";
    params.push(readiness);
  }

  sql += " ORDER BY updated_at DESC";

  const stmt = db.prepare(sql);
  return stmt.all(...params) as Song[];
}

export function updateSong(id: number, song: Partial<Song>): void {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (song.title !== undefined) {
    fields.push("title = ?");
    values.push(song.title);
  }
  if (song.lyrics !== undefined) {
    fields.push("lyrics = ?");
    values.push(song.lyrics);
  }
  if (song.key !== undefined) {
    fields.push("key = ?");
    values.push(song.key);
  }
  if (song.guitar !== undefined) {
    fields.push("guitar = ?");
    values.push(song.guitar);
  }
  if (song.readiness !== undefined) {
    fields.push("readiness = ?");
    values.push(song.readiness);
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  const stmt = db.prepare(`
    UPDATE songs SET ${fields.join(", ")}
    WHERE id = ?
  `);
  stmt.run(...values);
}

export function markSongAsPlayed(id: number): void {
  const db = getDb();
  const stmt = db.prepare(`
    UPDATE songs 
    SET last_played_at = CURRENT_TIMESTAMP, 
        play_count = play_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run(id);
}

export function deleteSong(id: number): void {
  const db = getDb();

  // First, get all files for this song and delete them from disk
  const files = getFilesBySongId(id);
  for (const file of files) {
    try {
      fs.unlinkSync(file.file_path);
    } catch (err) {
      console.error(
        `Failed to delete file ${file.file_path} for song ${id}:`,
        err
      );
    }
  }

  // Then delete the song (CASCADE will delete file records)
  const stmt = db.prepare("DELETE FROM songs WHERE id = ?");
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
  const stmt = db.prepare(
    "SELECT * FROM files WHERE song_id = ? ORDER BY created_at DESC"
  );
  return stmt.all(songId) as FileRecord[];
}

export function getFile(id: number): FileRecord | undefined {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM files WHERE id = ?");
  return stmt.get(id) as FileRecord | undefined;
}

export function deleteFile(id: number): void {
  const db = getDb();
  const file = getFile(id);

  if (file) {
    try {
      fs.unlinkSync(file.file_path);
    } catch (err) {
      console.error(
        `Failed to delete file ${file.file_path} with id ${id}:`,
        err
      );
    }

    const stmt = db.prepare("DELETE FROM files WHERE id = ?");
    stmt.run(id);
  }
}

// Ensure uploads directory exists
export function ensureUploadsDir(): string {
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}
