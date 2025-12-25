import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { Song, FileRecord, Readiness, Guitar, GuitarType } from "@/types";

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

  // Create guitars table
  database.exec(`
    CREATE TABLE IF NOT EXISTS guitars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Acoustic', 'Electric', 'Bass', 'Other')),
      notes TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create basic indexes
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
  if (!columns.includes("guitar_id")) {
    database.exec(
      `ALTER TABLE songs ADD COLUMN guitar_id INTEGER REFERENCES guitars(id);`
    );
  }

  // Create guitar_id index after column exists
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_songs_guitar_id ON songs(guitar_id);
  `);

  // Seed guitars if table is empty
  const guitarCount = database
    .prepare("SELECT COUNT(*) as count FROM guitars")
    .get() as { count: number };
  if (guitarCount.count === 0) {
    seedGuitars(database);
  }
}

function seedGuitars(database: Database.Database) {
  const guitars = [
    {
      name: "Martin D-28",
      type: "Acoustic",
      notes: "Classic dreadnought, great for strumming",
    },
    {
      name: "Taylor 814ce",
      type: "Acoustic",
      notes: "Cutaway acoustic-electric",
    },
    { name: "Gibson J-45", type: "Acoustic", notes: "Vintage round shoulder" },
    {
      name: "Fender Stratocaster",
      type: "Electric",
      notes: "Versatile solid body",
    },
    { name: "Gibson Les Paul", type: "Electric", notes: "Classic rock tone" },
    { name: "Fender Telecaster", type: "Electric", notes: "Country and rock" },
    {
      name: "PRS Custom 24",
      type: "Electric",
      notes: "Modern versatile electric",
    },
    {
      name: "Ibanez RG",
      type: "Electric",
      notes: "Fast neck, great for shred",
    },
    { name: "Fender Precision Bass", type: "Bass", notes: "Classic P-Bass" },
    { name: "Music Man StingRay", type: "Bass", notes: "Punchy active bass" },
    { name: "Fender Jazz Bass", type: "Bass", notes: "Versatile J-Bass" },
    {
      name: "Classical Nylon",
      type: "Acoustic",
      notes: "Nylon string classical",
    },
    { name: "12-String Acoustic", type: "Acoustic", notes: "Rich, full sound" },
    { name: "Resonator Guitar", type: "Other", notes: "Bluegrass and slide" },
  ];

  const stmt = database.prepare(`
    INSERT INTO guitars (name, type, notes)
    VALUES (?, ?, ?)
  `);

  for (const guitar of guitars) {
    stmt.run(guitar.name, guitar.type, guitar.notes);
  }
}

export type { Song, FileRecord, Readiness, Guitar, GuitarType };

// Song CRUD operations
export function createSong(song: Song): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO songs (title, lyrics, key, guitar, guitar_id, readiness)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    song.title,
    song.lyrics || "",
    song.key || "",
    song.guitar || "",
    song.guitar_id || null,
    song.readiness || "Writing"
  );
  return result.lastInsertRowid as number;
}

export function getSong(id: number): Song | undefined {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT s.*, 
           g.id as guitar_id,
           g.name as guitar_name, 
           g.type as guitar_type,
           g.notes as guitar_notes,
           g.image_url as guitar_image_url
    FROM songs s
    LEFT JOIN guitars g ON s.guitar_id = g.id
    WHERE s.id = ?
  `);
  const row = stmt.get(id) as any;
  if (!row) return undefined;

  const song: Song = {
    id: row.id,
    title: row.title,
    lyrics: row.lyrics,
    key: row.key,
    guitar: row.guitar,
    guitar_id: row.guitar_id,
    readiness: row.readiness,
    last_played_at: row.last_played_at,
    play_count: row.play_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  if (row.guitar_id) {
    song.guitarInfo = {
      id: row.guitar_id,
      name: row.guitar_name,
      type: row.guitar_type,
      notes: row.guitar_notes,
      image_url: row.guitar_image_url,
    };
  }

  return song;
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
  const values: (string | number | null)[] = [];

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
  if (song.guitar_id !== undefined) {
    fields.push("guitar_id = ?");
    values.push(song.guitar_id === null ? null : song.guitar_id);
  }
  if (song.readiness !== undefined) {
    fields.push("readiness = ?");
    values.push(song.readiness);
  }

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id as number);

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

// Guitar CRUD operations
export function createGuitar(guitar: Guitar): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO guitars (name, type, notes, image_url)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    guitar.name,
    guitar.type,
    guitar.notes || null,
    guitar.image_url || null
  );
  return result.lastInsertRowid as number;
}

export function getGuitar(id: number): Guitar | undefined {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM guitars WHERE id = ?");
  return stmt.get(id) as Guitar | undefined;
}

export function getAllGuitars(): Guitar[] {
  const db = getDb();
  const stmt = db.prepare("SELECT * FROM guitars ORDER BY type, name");
  return stmt.all() as Guitar[];
}

export function searchGuitars(query: string): Guitar[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM guitars 
    WHERE name LIKE ? OR type LIKE ? OR notes LIKE ?
    ORDER BY type, name
  `);
  const searchTerm = `%${query}%`;
  return stmt.all(searchTerm, searchTerm, searchTerm) as Guitar[];
}

export function updateGuitar(id: number, guitar: Partial<Guitar>): void {
  const db = getDb();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (guitar.name !== undefined) {
    fields.push("name = ?");
    values.push(guitar.name);
  }
  if (guitar.type !== undefined) {
    fields.push("type = ?");
    values.push(guitar.type);
  }
  if (guitar.notes !== undefined) {
    fields.push("notes = ?");
    values.push(guitar.notes || null);
  }
  if (guitar.image_url !== undefined) {
    fields.push("image_url = ?");
    values.push(guitar.image_url || null);
  }

  if (fields.length === 0) return;

  values.push(id);
  const stmt = db.prepare(`
    UPDATE guitars SET ${fields.join(", ")}
    WHERE id = ?
  `);
  stmt.run(...values);
}

export function deleteGuitar(id: number): void {
  const db = getDb();
  // Note: Songs referencing this guitar will have guitar_id set to NULL (if we set up ON DELETE SET NULL)
  // For now, we'll just delete the guitar
  const stmt = db.prepare("DELETE FROM guitars WHERE id = ?");
  stmt.run(id);
}
