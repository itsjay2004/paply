'use server';

import { auth } from '@clerk/nextjs/server';
import { abstractSummarizer } from '@/ai/flows/abstract-summarizer';
import { explainText } from '@/ai/flows/text-explainer';
import { fetchPaperDetailsFromDoi } from '@/ai/flows/fetch-paper-details-from-doi';
import { extractPaperDetailsFromPdf } from '@/ai/flows/extract-paper-details-from-pdf';
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
    const { summaryPoints } = await abstractSummarizer({ abstract: parsed.data.abstract });
    return summaryPoints;
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

/**
 * Upload-first then extract (server receives PDF). Kept for fallback; prefer presigned flow.
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

  try {
    const buffer = dataUriToBuffer(parsed.data.pdfDataUri);
    const objectKeyId = crypto.randomUUID();
    const pdfUrl = await uploadPdfToS3({
      userId,
      objectKeyId,
      file: buffer,
      contentType: 'application/pdf',
    });

    const details = await extractPaperDetailsFromPdf({
      pdfDataUri: parsed.data.pdfDataUri,
    });

    return {
      title: details.title,
      authors: details.authors,
      year: details.year,
      abstract: details.abstract,
      doi: details.doi ?? null,
      source: details.journal ?? undefined,
      pdfUrl,
      summary: [],
      tags: [],
      collectionIds: [],
    };
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
 * Verifies the key belongs to the current user. On extraction failure, deletes the orphan object.
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

  try {
    const buffer = await getPdfBufferFromS3(key);
    const pdfDataUri = `data:application/pdf;base64,${buffer.toString('base64')}`;
    const details = await extractPaperDetailsFromPdf({ pdfDataUri });

    return {
      title: details.title,
      authors: details.authors,
      year: details.year,
      abstract: details.abstract,
      doi: details.doi ?? null,
      source: details.journal ?? undefined,
      pdfUrl: key,
      summary: [],
      tags: [],
      collectionIds: [],
    };
  } catch (error) {
    await deletePdfFromS3(key);
    console.error('Error importing from PDF (S3 key):', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to import paper from PDF.'
    );
  }
}
