'use server';

import { abstractSummarizer } from '@/ai/flows/abstract-summarizer';
import { explainText } from '@/ai/flows/text-explainer';
import { fetchPaperDetailsFromDoi } from '@/ai/flows/fetch-paper-details-from-doi';
import { extractPaperDetailsFromPdf } from '@/ai/flows/extract-paper-details-from-pdf';
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
    throw new Error('Failed to import paper from DOI.');
  }
}

const importFromPdfSchema = z.object({
  pdfDataUri: z.string(),
});

export async function importPaperFromPdf(data: { pdfDataUri: string }) {
  const parsed = importFromPdfSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid input for PDF import.');
  }

  try {
    const details = await extractPaperDetailsFromPdf({ pdfDataUri: parsed.data.pdfDataUri });
    return details;
  } catch (error) {
    console.error('Error importing from PDF:', error);
    throw new Error('Failed to import paper from PDF.');
  }
}
