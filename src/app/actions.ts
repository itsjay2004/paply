'use server';

import { auth } from '@clerk/nextjs/server';
import { abstractSummarizer } from '@/ai/flows/abstract-summarizer';
import { explainText } from '@/ai/flows/text-explainer';
import { fetchPaperDetailsFromDoi } from '@/ai/flows/fetch-paper-details-from-doi';
import { extractTitleDoiFromPdf } from '@/ai/flows/extract-title-doi-from-pdf';
import { deletePdfFromS3, getPdfBufferFromS3, uploadPdfToS3 } from '@/lib/s3';
import type { Paper } from '@/lib/types';
import { z } from 'zod';

const summarizeSchema = z.object({
  abstract: z.string(),
});

export async function getSummary(data: { abstract: string }) {
  const parsed = summarizeSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid input for summarization.');
  }

  try {
    const { summary } = await abstractSummarizer({ abstract: parsed.data.abstract });
    // Return as array with single paragraph for backward compatibility with existing code
    // The UI will display it as a paragraph
    return [summary];
  } catch (error) {
    console.error('Error summarizing abstract:', error);
    throw new Error('Failed to generate summary.');
  }
}

const explainSchema = z.object({
  text: z.string(),
});

export async function getExplanation(data: { text: string }) {
  const parsed = explainSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid input for explanation.');
  }

  try {
    const { explanation } = await explainText({ text: parsed.data.text });
    return explanation;
  } catch (error) {
    console.error('Error explaining text:', error);
    throw new Error('Failed to generate explanation.');
  }
}

const importFromDoiSchema = z.object({
  doi: z.string(),
});

export async function importPaperFromDoi(data: { doi: string }) {
  const parsed = importFromDoiSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid input for DOI import.');
  }

  try {
    const details = await fetchPaperDetailsFromDoi({ doi: parsed.data.doi });
    return details;
  } catch (error) {
    console.error('Error importing from DOI:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to import paper from DOI: ${msg}`);
  }
}

const importFromPdfSchema = z.object({
  pdfDataUri: z.string(),
  filename: z.string().optional(),
});

/**
 * Decode a data URI (e.g. data:application/pdf;base64,...) to a Buffer.
 */
function dataUriToBuffer(dataUri: string): Buffer {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid PDF data URI format.');
  }
  return Buffer.from(match[2], 'base64');
}

/** Normalize DOI for OpenAlex (strip https://doi.org/ prefix if present). */
function normalizeDoi(doi: string): string {
  const s = doi.trim();
  const m = s.match(/^(?:https?:\/\/)?(?:doi\.org\/)?(.+)$/i);
  return m ? m[1].trim() : s;
}

/** Build paper from OpenAlex result + our pdfUrl. */
function paperFromOpenAlex(
  details: Awaited<ReturnType<typeof fetchPaperDetailsFromDoi>>,
  pdfUrl: string
): Omit<Paper, 'id'> {
  return {
    title: details.title,
    authors: details.authors,
    year: details.year,
    publication_date: details.publication_date ?? undefined,
    abstract: details.abstract,
    doi: details.doi ?? null,
    source: details.source ?? undefined,
    pdfUrl,
    summary: [],
    tags: [],
    collectionIds: [],
    typeOfWork: details.work_type ?? undefined,
    language: details.language ?? undefined,
    paperUrl: details.paperUrl ?? undefined,
    landingPageUrl: details.landingPageUrl ?? undefined,
    citedByCount: details.citedByCount ?? undefined,
  };
}

/** Build minimal fallback paper (title + optional DOI when OpenAlex not used). */
function fallbackPaper(
  title: string,
  pdfUrl: string,
  doi: string | null
): Omit<Paper, 'id'> {
  return {
    title,
    authors: [],
    year: 0,
    abstract: '',
    doi: doi ?? null,
    pdfUrl,
    summary: [],
    tags: [],
    collectionIds: [],
  };
}

/**
 * Upload-first then extract (server receives PDF). Kept for fallback; prefer presigned flow.
 * Extracts only title + DOI from PDF, then fetches full metadata from OpenAlex by DOI.
 * Fallback: use extracted title + DOI; ultimate fallback: use filename as title.
 */
export async function importPaperFromPdf(
  data: { pdfDataUri: string; filename?: string }
): Promise<Omit<Paper, 'id'>> {
  const parsed = importFromPdfSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid input for PDF import.');
  }

  const { userId } = await auth();
  if (!userId) {
    throw new Error('You must be signed in to upload a PDF.');
  }

  const filenameFallback = parsed.data.filename?.trim() || 'Imported PDF';

  try {
    const buffer = dataUriToBuffer(parsed.data.pdfDataUri);
    const objectKeyId = crypto.randomUUID();
    const pdfUrl = await uploadPdfToS3({
      userId,
      objectKeyId,
      file: buffer,
      contentType: 'application/pdf',
    });

    const extracted = await extractTitleDoiFromPdf({
      pdfDataUri: parsed.data.pdfDataUri,
    });
    const rawDoi = extracted.doi?.trim();
    const titleFromPdf = extracted.title?.trim();

    if (rawDoi) {
      try {
        const details = await fetchPaperDetailsFromDoi({
          doi: normalizeDoi(rawDoi),
        });
        return paperFromOpenAlex(details, pdfUrl);
      } catch {
        // OpenAlex failed: use extracted title + DOI
      }
    }

    const title = titleFromPdf || filenameFallback;
    return fallbackPaper(title, pdfUrl, rawDoi ? rawDoi : null);
  } catch (error) {
    console.error('Error importing from PDF:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to import paper from PDF.'
    );
  }
}

const importFromPdfKeySchema = z.object({
  key: z.string().min(1).refine((k) => k.startsWith('uploads/'), 'Invalid key'),
});

/**
 * Extract paper details from a PDF already in S3 (uploaded by client via presigned PUT).
 * Extracts only title + DOI from PDF, then fetches full metadata from OpenAlex by DOI.
 * Fallback: use extracted title + DOI; ultimate fallback: use key basename (e.g. "file.pdf") as title.
 */
export async function importPaperFromPdfWithKey(
  data: { key: string }
): Promise<Omit<Paper, 'id'>> {
  const parsed = importFromPdfKeySchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid S3 key for PDF import.');
  }

  const { userId } = await auth();
  if (!userId) {
    throw new Error('You must be signed in to import a PDF.');
  }

  const key = parsed.data.key;
  const expectedPrefix = `uploads/${userId}/`;
  if (!key.startsWith(expectedPrefix)) {
    throw new Error('You do not have access to this upload.');
  }

  const filenameFallback = key.split('/').pop()?.trim() || 'Imported PDF';

  try {
    const buffer = await getPdfBufferFromS3(key);
    const pdfDataUri = `data:application/pdf;base64,${buffer.toString('base64')}`;
    const extracted = await extractTitleDoiFromPdf({ pdfDataUri });
    const rawDoi = extracted.doi?.trim();
    const titleFromPdf = extracted.title?.trim();

    if (rawDoi) {
      try {
        const details = await fetchPaperDetailsFromDoi({
          doi: normalizeDoi(rawDoi),
        });
        return paperFromOpenAlex(details, key);
      } catch {
        // OpenAlex failed: use extracted title + DOI
      }
    }

    const title = titleFromPdf || filenameFallback;
    return fallbackPaper(title, key, rawDoi ? rawDoi : null);
  } catch (error) {
    await deletePdfFromS3(key);
    console.error('Error importing from PDF (S3 key):', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to import paper from PDF.'
    );
  }
}
