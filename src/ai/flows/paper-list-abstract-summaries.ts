'use server';
/**
 * @fileOverview Generates a concise, three-bullet summary of a paper's abstract.
 *
 * - summarizeAbstract - A function that handles the abstract summarization process.
 * - SummarizeAbstractInput - The input type for the summarizeAbstract function.
 * - SummarizeAbstractOutput - The return type for the summarizeAbstract function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeAbstractInputSchema = z.object({
  abstract: z.string().describe('The abstract of the research paper to summarize.'),
});
export type SummarizeAbstractInput = z.infer<typeof SummarizeAbstractInputSchema>;

const SummarizeAbstractOutputSchema = z.array(z.string()).describe('A three-bullet summary of the abstract.');
export type SummarizeAbstractOutput = z.infer<typeof SummarizeAbstractOutputSchema>;

export async function summarizeAbstract(input: SummarizeAbstractInput): Promise<SummarizeAbstractOutput> {
  return summarizeAbstractFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeAbstractPrompt',
  input: { schema: SummarizeAbstractInputSchema },
  output: { schema: SummarizeAbstractOutputSchema },
  prompt: `You are an expert academic summarizer. Your task is to condense the provided research paper abstract into a concise, three-bullet point summary.

Abstract:
{{{abstract}}}

Three-bullet summary:`,
});

const summarizeAbstractFlow = ai.defineFlow(
  {
    name: 'summarizeAbstractFlow',
    inputSchema: SummarizeAbstractInputSchema,
    outputSchema: SummarizeAbstractOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
