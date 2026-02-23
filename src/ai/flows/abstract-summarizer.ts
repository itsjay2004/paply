'use server';
/**
 * @fileOverview A Genkit flow to summarize a paper abstract into three bullet points.
 *
 * - abstractSummarizer - A function that generates a three-bullet summary of a given abstract.
 * - AbstractSummarizerInput - The input type for the abstractSummarizer function.
 * - AbstractSummarizerOutput - The return type for the abstractSummarizer function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AbstractSummarizerInputSchema = z.object({
  abstract: z.string().describe('The abstract of the academic paper to summarize.'),
});
export type AbstractSummarizerInput = z.infer<typeof AbstractSummarizerInputSchema>;

const AbstractSummarizerOutputSchema = z.object({
  summaryPoints: z.array(z.string()).min(3).max(3).describe('A three-bullet summary of the abstract.'),
});
export type AbstractSummarizerOutput = z.infer<typeof AbstractSummarizerOutputSchema>;

export async function abstractSummarizer(input: AbstractSummarizerInput): Promise<AbstractSummarizerOutput> {
  return abstractSummarizerFlow(input);
}

const abstractSummarizerPrompt = ai.definePrompt({
  name: 'abstractSummarizerPrompt',
  input: { schema: AbstractSummarizerInputSchema },
  output: { schema: AbstractSummarizerOutputSchema },
  prompt: `You are an expert academic summarizer. Your task is to condense the provided abstract into a concise three-bullet point summary.
Each bullet point should capture a main idea or finding from the abstract.

Abstract:
{{{abstract}}}`,
});

const abstractSummarizerFlow = ai.defineFlow(
  {
    name: 'abstractSummarizerFlow',
    inputSchema: AbstractSummarizerInputSchema,
    outputSchema: AbstractSummarizerOutputSchema,
  },
  async (input) => {
    const { output } = await abstractSummarizerPrompt(input);
    return output!;
  }
);
