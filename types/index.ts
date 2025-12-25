export type Readiness =
  | "Idea"
  | "Writing"
  | "Practice"
  | "GigReady"
  | "Archived";

export type GuitarType = "Acoustic" | "Electric" | "Bass" | "Other";

export interface Guitar {
  id?: number;
  name: string;
  type: GuitarType;
  notes?: string;
  image_url?: string;
  created_at?: string;
}

export interface Song {
  id?: number;
  title: string;
  lyrics?: string;
  key?: string;
  guitar?: string; // Legacy field, will be deprecated
  guitar_id?: number | null;
  guitarInfo?: Guitar; // Joined guitar data
  readiness?: Readiness;
  last_played_at?: string | null;
  play_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FileRecord {
  id?: number;
  song_id: number;
  filename: string;
  original_name: string;
  file_type: string;
  file_path: string;
  file_size: number;
  created_at?: string;
}
