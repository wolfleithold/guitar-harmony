import { sql } from "@vercel/postgres";
import { Song, FileRecord, Readiness, Guitar, GuitarType } from "@/types";

// Initialize database tables
export async function initDb() {
  try {
    // Create songs table
    await sql`
      CREATE TABLE IF NOT EXISTS songs (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        lyrics TEXT,
        key TEXT,
        guitar TEXT,
        guitar_id INTEGER REFERENCES guitars(id),
        readiness TEXT DEFAULT 'Writing' CHECK(readiness IN ('Idea', 'Writing', 'Practice', 'GigReady', 'Archived')),
        last_played_at TIMESTAMP,
        play_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create guitars table
    await sql`
      CREATE TABLE IF NOT EXISTS guitars (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('Acoustic', 'Electric', 'Bass', 'Other')),
        notes TEXT,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create files table
    await sql`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        blob_url TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_files_song_id ON files(song_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_songs_guitar_id ON songs(guitar_id);`;

    // Check if we need to seed guitars
    const { rows } = await sql`SELECT COUNT(*) as count FROM guitars`;
    if (rows[0].count === "0") {
      await seedGuitars();
    }
  } catch (error: any) {
    // Ignore errors if tables already exist
    if (!error.message?.includes("already exists")) {
      console.error("Database initialization error:", error);
    }
  }
}

async function seedGuitars() {
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

  for (const guitar of guitars) {
    await sql`
      INSERT INTO guitars (name, type, notes)
      VALUES (${guitar.name}, ${guitar.type}, ${guitar.notes})
    `;
  }
}

export type { Song, FileRecord, Readiness, Guitar, GuitarType };

// Song CRUD operations
export async function createSong(song: Song): Promise<number> {
  const { rows } = await sql`
    INSERT INTO songs (title, lyrics, key, guitar, guitar_id, readiness)
    VALUES (${song.title}, ${song.lyrics || ""}, ${song.key || ""}, ${
    song.guitar || ""
  }, ${song.guitar_id || null}, ${song.readiness || "Writing"})
    RETURNING id
  `;
  return rows[0].id;
}

export async function getSong(id: number): Promise<Song | undefined> {
  const { rows } = await sql`
    SELECT s.*, 
           g.id as guitar_db_id,
           g.name as guitar_name, 
           g.type as guitar_type,
           g.notes as guitar_notes,
           g.image_url as guitar_image_url
    FROM songs s
    LEFT JOIN guitars g ON s.guitar_id = g.id
    WHERE s.id = ${id}
  `;

  if (rows.length === 0) return undefined;

  const row = rows[0];
  const song: Song = {
    id: row.id,
    title: row.title,
    lyrics: row.lyrics,
    key: row.key,
    guitar: row.guitar,
    guitar_id: row.guitar_id,
    readiness: row.readiness as Readiness,
    last_played_at: row.last_played_at,
    play_count: row.play_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  if (row.guitar_db_id) {
    song.guitarInfo = {
      id: row.guitar_db_id,
      name: row.guitar_name,
      type: row.guitar_type as GuitarType,
      notes: row.guitar_notes,
      image_url: row.guitar_image_url,
      created_at: row.created_at,
    };
  }

  return song;
}

export async function getAllSongs(
  readiness?: Readiness,
  sortBy?: "updated" | "played-recent" | "played-oldest",
  excludeArchived = false
): Promise<Song[]> {
  let whereClause = "";
  const conditions: string[] = [];

  if (readiness) {
    conditions.push(`readiness = '${readiness}'`);
  }
  if (excludeArchived) {
    conditions.push(`readiness != 'Archived'`);
  }

  if (conditions.length > 0) {
    whereClause = `WHERE ${conditions.join(" AND ")}`;
  }

  // Add sorting
  let orderBy = "s.updated_at DESC";
  if (sortBy === "played-recent") {
    orderBy = "s.last_played_at DESC NULLS LAST";
  } else if (sortBy === "played-oldest") {
    orderBy = "s.last_played_at ASC NULLS LAST";
  }

  const queryText = `
    SELECT s.*, 
           g.id as guitar_db_id,
           g.name as guitar_name, 
           g.type as guitar_type
    FROM songs s
    LEFT JOIN guitars g ON s.guitar_id = g.id
    ${whereClause}
    ORDER BY ${orderBy}
  `;

  const result = await sql.query(queryText);
  const rows = result.rows;

  return rows.map((row: any) => {
    const song: Song = {
      id: row.id,
      title: row.title,
      lyrics: row.lyrics,
      key: row.key,
      guitar: row.guitar,
      guitar_id: row.guitar_id,
      readiness: row.readiness as Readiness,
      last_played_at: row.last_played_at,
      play_count: row.play_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    if (row.guitar_db_id) {
      song.guitarInfo = {
        id: row.guitar_db_id,
        name: row.guitar_name,
        type: row.guitar_type as GuitarType,
        notes: undefined,
        image_url: undefined,
        created_at: undefined,
      };
    }

    return song;
  });
}

export async function searchSongs(query: string): Promise<Song[]> {
  const searchPattern = `%${query}%`;
  const { rows } = await sql`
    SELECT s.*, 
           g.id as guitar_db_id,
           g.name as guitar_name, 
           g.type as guitar_type
    FROM songs s
    LEFT JOIN guitars g ON s.guitar_id = g.id
    WHERE s.title ILIKE ${searchPattern}
       OR s.lyrics ILIKE ${searchPattern}
       OR s.key ILIKE ${searchPattern}
       OR s.guitar ILIKE ${searchPattern}
       OR g.name ILIKE ${searchPattern}
    ORDER BY s.updated_at DESC
  `;

  return rows.map((row: any) => {
    const song: Song = {
      id: row.id,
      title: row.title,
      lyrics: row.lyrics,
      key: row.key,
      guitar: row.guitar,
      guitar_id: row.guitar_id,
      readiness: row.readiness as Readiness,
      last_played_at: row.last_played_at,
      play_count: row.play_count,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    if (row.guitar_db_id) {
      song.guitarInfo = {
        id: row.guitar_db_id,
        name: row.guitar_name,
        type: row.guitar_type as GuitarType,
        notes: undefined,
        image_url: undefined,
        created_at: undefined,
      };
    }

    return song;
  });
}

export async function updateSong(id: number, updates: Partial<Song>) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(updates.title);
  }
  if (updates.lyrics !== undefined) {
    fields.push(`lyrics = $${paramIndex++}`);
    values.push(updates.lyrics);
  }
  if (updates.key !== undefined) {
    fields.push(`key = $${paramIndex++}`);
    values.push(updates.key);
  }
  if (updates.guitar !== undefined) {
    fields.push(`guitar = $${paramIndex++}`);
    values.push(updates.guitar);
  }
  if (updates.guitar_id !== undefined) {
    fields.push(`guitar_id = $${paramIndex++}`);
    values.push(updates.guitar_id);
  }
  if (updates.readiness !== undefined) {
    fields.push(`readiness = $${paramIndex++}`);
    values.push(updates.readiness);
  }

  if (fields.length === 0) return;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const queryText = `UPDATE songs SET ${fields.join(
    ", "
  )} WHERE id = $${paramIndex}`;
  await sql.query(queryText, values);
}

export async function deleteSong(id: number) {
  await sql`DELETE FROM songs WHERE id = ${id}`;
}

export async function markSongAsPlayed(id: number): Promise<Song | undefined> {
  await sql`
    UPDATE songs 
    SET last_played_at = CURRENT_TIMESTAMP,
        play_count = play_count + 1
    WHERE id = ${id}
  `;
  return getSong(id);
}

// Guitar CRUD operations
export async function createGuitar(guitar: Omit<Guitar, "id" | "created_at">) {
  const { rows } = await sql`
    INSERT INTO guitars (name, type, notes, image_url)
    VALUES (${guitar.name}, ${guitar.type}, ${guitar.notes || null}, ${
    guitar.image_url || null
  })
    RETURNING id
  `;
  return rows[0].id;
}

export async function getGuitar(id: number): Promise<Guitar | undefined> {
  const { rows } = await sql`
    SELECT * FROM guitars WHERE id = ${id}
  `;
  return rows[0] as Guitar | undefined;
}

export async function getAllGuitars(): Promise<Guitar[]> {
  const { rows } = await sql`
    SELECT * FROM guitars ORDER BY name ASC
  `;
  return rows as Guitar[];
}

export async function searchGuitars(query: string): Promise<Guitar[]> {
  const searchPattern = `%${query}%`;
  const { rows } = await sql`
    SELECT * FROM guitars 
    WHERE name ILIKE ${searchPattern}
       OR type ILIKE ${searchPattern}
       OR notes ILIKE ${searchPattern}
    ORDER BY name ASC
  `;
  return rows as Guitar[];
}

export async function updateGuitar(
  id: number,
  updates: Partial<Omit<Guitar, "id" | "created_at">>
) {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.type !== undefined) {
    fields.push(`type = $${paramIndex++}`);
    values.push(updates.type);
  }
  if (updates.notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(updates.notes);
  }
  if (updates.image_url !== undefined) {
    fields.push(`image_url = $${paramIndex++}`);
    values.push(updates.image_url);
  }

  if (fields.length === 0) return;

  values.push(id);

  const queryText = `UPDATE guitars SET ${fields.join(
    ", "
  )} WHERE id = $${paramIndex}`;
  await sql.query(queryText, values);
}

export async function deleteGuitar(id: number) {
  await sql`DELETE FROM guitars WHERE id = ${id}`;
}

// File CRUD operations
export async function createFile(file: Omit<FileRecord, "id" | "created_at">) {
  const { rows } = await sql`
    INSERT INTO files (song_id, filename, original_name, file_type, blob_url, file_size)
    VALUES (${file.song_id}, ${file.filename}, ${file.original_name}, ${file.file_type}, ${file.file_path}, ${file.file_size})
    RETURNING id
  `;
  return rows[0].id;
}

export async function getFile(id: number): Promise<FileRecord | undefined> {
  const { rows } = await sql`
    SELECT * FROM files WHERE id = ${id}
  `;
  if (rows.length === 0) return undefined;
  const row = rows[0];
  return {
    id: row.id,
    song_id: row.song_id,
    filename: row.filename,
    original_name: row.original_name,
    file_type: row.file_type,
    file_path: row.blob_url,
    file_size: row.file_size,
    created_at: row.created_at,
  };
}

export async function getFilesBySongId(songId: number): Promise<FileRecord[]> {
  const { rows } = await sql`
    SELECT * FROM files WHERE song_id = ${songId} ORDER BY created_at DESC
  `;
  return rows.map((row: any) => ({
    id: row.id,
    song_id: row.song_id,
    filename: row.filename,
    original_name: row.original_name,
    file_type: row.file_type,
    file_path: row.blob_url,
    file_size: row.file_size,
    created_at: row.created_at,
  }));
}

export async function deleteFile(id: number) {
  await sql`DELETE FROM files WHERE id = ${id}`;
}
