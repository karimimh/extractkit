export interface NoteImage {
  id: number;
  image: string;
  alt_text: string;
  uploaded_at: string;
}

export interface NoteLabel {
  id: number;
  name: string;
  color: string;
}

export interface Note {
  id: number;
  title?: string;
  content: string;
  content_type: "text" | "markdown";
  rendered_content?: string;
  images: NoteImage[];
  labels?: NoteLabel[]; // Array of label objects
  is_pinned: boolean;
  pin_order: number;
  order: number;
  color: string;
  bg_color: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationData {
  page: number;
  page_size: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface NotesResponse {
  notes: Note[];
  pagination: PaginationData;
}

export interface NoteHistoryEntry {
  id: number;
  title: string;
  content: string;
  content_type: "text" | "markdown";
  saved_at: string;
}
