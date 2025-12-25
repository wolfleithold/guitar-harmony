export type Readiness =
  | "Idea"
  | "Writing"
  | "Practice"
  | "GigReady"
  | "Archived";

export interface Song {
  id?: number;
  title: string;
  lyrics?: string;
  key?: string;
  guitar?: string;
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
