export type Paper = {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  abstract: string;
  summary: string[];
  pdfUrl: string;
  tags: string[];
  collectionIds: string[];
  publisher?: string;
  typeOfWork?: string;
  language?: string;
  city?: string;
  country?: string;
  url?: string;
  doi?: string;
};

export type Collection = {
  id: string;
  name: string;
  paperCount: number;
};
