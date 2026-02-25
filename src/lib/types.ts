export type Paper = {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  summary: string[];
  pdfUrl: string;
  tags: string[];
  /** Single collection (matches DB collection_id). */
  collection_id?: string | null;
  /** Derived for list/filter; prefer collection_id. */
  collectionIds: string[];
  publisher?: string | null;
  typeOfWork?: string | null;
  language?: string | null;
  city?: string | null;
  country?: string | null;
  doi?: string | null;
};

export type Collection = {
  id: string;
  name: string;
  paperCount: number;
};
