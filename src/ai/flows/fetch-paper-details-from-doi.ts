'use server';
/**
 * @fileOverview Fetches paper details from a DOI using the OpenAlex API.
 * - fetchPaperDetailsFromDoi - Fetches paper metadata from OpenAlex (no AI).
 */
import { formatAuthorNames } from '@/lib/format-author-name';

const OPENALEX_WORKS_BASE = 'https://api.openalex.org/works';

/** Reconstruct abstract text from OpenAlex inverted index. */
function abstractFromInvertedIndex(
  index: Record<string, number[]> | null | undefined
): string {
  if (!index || typeof index !== 'object') return '';
  const pairs: { word: string; pos: number }[] = [];
  for (const [word, positions] of Object.entries(index)) {
    if (Array.isArray(positions)) {
      for (const p of positions) pairs.push({ word, pos: p });
    }
  }
  pairs.sort((a, b) => a.pos - b.pos);
  return pairs.map((x) => x.word).join(' ');
}

/** OpenAlex work (single work) API response shape (subset we use). */
interface OpenAlexWork {
  id?: string | null;
  doi?: string | null;
  title?: string | null;
  display_name?: string | null;
  type?: string | null;
  publication_year?: number | null;
  publication_date?: string | null;
  language?: string | null;
  cited_by_count?: number | null;
  primary_location?: {
    landing_page_url?: string | null;
    source?: { display_name?: string | null } | null;
  } | null;
  authorships?: Array<{
    author?: { display_name?: string | null } | null;
    raw_author_name?: string | null;
  }> | null;
  abstract_inverted_index?: Record<string, number[]> | null;
}

export type FetchPaperDetailsFromDoiInput = {
  doi: string;
};

export type FetchPaperDetailsFromDoiOutput = {
  title: string;
  authors: string[];
  year: number;
  publication_date?: string | null;
  abstract: string;
  doi?: string;
  language?: string;
  source?: string;
  paperUrl?: string;
  landingPageUrl?: string;
  citedByCount?: number;
  work_type?: string;
};

export async function fetchPaperDetailsFromDoi(
  input: FetchPaperDetailsFromDoiInput
): Promise<FetchPaperDetailsFromDoiOutput> {
  const rawDoi = input.doi.trim();
  if (!rawDoi) {
    throw new Error('DOI is required.');
  }

  const doiParam = encodeURIComponent(`doi:${rawDoi}`);
  const apiKey = process.env.OPENALEX_API_KEY;
  const url = apiKey
    ? `${OPENALEX_WORKS_BASE}/${doiParam}?api_key=${apiKey}`
    : `${OPENALEX_WORKS_BASE}/${doiParam}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`No work found for DOI: ${rawDoi}`);
    }
    throw new Error(
      `Failed to fetch from OpenAlex: ${response.status} ${response.statusText}`
    );
  }

  const work = (await response.json()) as OpenAlexWork;

  const title =
    work.title ?? work.display_name ?? 'Title not found';

  const rawAuthors: string[] = [];
  if (Array.isArray(work.authorships)) {
    for (const a of work.authorships) {
      const name = a.author?.display_name ?? a.raw_author_name ?? '';
      if (name.trim()) rawAuthors.push(name.trim());
    }
  }
  const authors = formatAuthorNames(rawAuthors);

  const pubDate = work.publication_date ?? undefined;
  const year =
    work.publication_year ??
    (pubDate ? parseInt(pubDate.slice(0, 4), 10) : 0) ?? 0;
  const yearNum = typeof year === 'number' && !Number.isNaN(year) ? year : 0;

  const primaryLocation = work.primary_location;
  const source = primaryLocation?.source?.display_name ?? undefined;
  const landingPageUrl = primaryLocation?.landing_page_url ?? undefined;
  const citedByCount = work.cited_by_count ?? undefined;
  const work_type = work.type ?? undefined;

  const abstract =
    abstractFromInvertedIndex(work.abstract_inverted_index) ||
    'Abstract not found.';

  const doi = work.doi
    ? (work.doi.startsWith('http') ? work.doi.replace(/^https?:\/\/doi\.org\//i, '') : work.doi)
    : rawDoi;

  return {
    title,
    authors,
    year: yearNum,
    publication_date: pubDate ?? null,
    abstract,
    doi,
    language: work.language ?? undefined,
    source,
    paperUrl: work.id ?? undefined,
    landingPageUrl,
    citedByCount,
    work_type,
  };
}
