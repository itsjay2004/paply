'use server';

import { abstractSummarizer } from '@/ai/flows/abstract-summarizer';
import { explainText } from '@/ai/flows/text-explainer';
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
