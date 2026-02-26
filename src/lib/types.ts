export type Paper = {
  id: string;
  title: string;
  authors: string[];
  year: number;
  /** ISO date (YYYY-MM-DD); when set, used for DB publication_date. */
  publication_date?: string | null;
  abstract: string;
  summary: string[];
  pdfUrl: string;
  tags: string[];
  /** Single collection (matches DB collection_id). */
  collection_id?: string | null;
  /** Derived for list/filter; prefer collection_id. */
  collectionIds: string[];
  typeOfWork?: string | null;
  language?: string | null;
  doi?: string | null;
  /** OpenAlex: primary_location.source.display_name (journal/source). */
  source?: string | null;
  /** OpenAlex: work page URL (e.g. https://openalex.org/W...). */
  paperUrl?: string | null;
  /** OpenAlex: landing page URL. */
  landingPageUrl?: string | null;
  /** OpenAlex: number of citing works. */
  citedByCount?: number | null;
  /** User-starred for quick access (Starred tab). */
  starred?: boolean;
};

export type Collection = {
  id: string;
  name: string;
  paperCount: number;
};

/** Highlight area position (percent). Matches react-pdf-viewer HighlightArea. */
export type HighlightArea = {
  pageIndex: number;
  left: number;
  top: number;
  width: number;
  height: number;
};

export type Highlight = {
  id: string;
  paper_id: string;
  highlighted_text: string;
  explanation?: string | null;
  position: { areas: HighlightArea[]; color?: string } | null;
  created_at?: string;
};

export type Note = {
  id: string;
  paper_id: string;
  note_content: string;
  position: { pageIndex: number; x: number; y: number };
  created_at?: string;
};

/** Standalone notebook note (Tiptap JSON content). */
export type NotebookNote = {
  id: string;
  user_id: string;
  title: string | null;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};
