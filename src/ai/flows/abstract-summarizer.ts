'use server';
/**
 * @fileOverview A Genkit flow to summarize a paper abstract into a paragraph.
 *
 * - abstractSummarizer - A function that generates a paragraph summary of a given abstract.
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
  summary: z.string().describe('A concise paragraph (2-4 sentences) summarizing the abstract. Write as a flowing paragraph, not bullet points.'),
});
export type AbstractSummarizerOutput = z.infer<typeof AbstractSummarizerOutputSchema>;

export async function abstractSummarizer(input: AbstractSummarizerInput): Promise<AbstractSummarizerOutput> {
  return abstractSummarizerFlow(input);
}

const abstractSummarizerPrompt = ai.definePrompt({
  name: 'abstractSummarizerPromptV2',
  input: { schema: AbstractSummarizerInputSchema },
  output: { schema: AbstractSummarizerOutputSchema },
  prompt: `
  You are an expert academic research summarizer.
  
  Your task is to generate a concise high-quality summary of the provided abstract.

STRICT REQUIREMENTS:
- Write a single flowing paragraph with 2 to 4 complete sentences (NOT bullet points or a list).
- CONTENT: The summary must explicitly cover:
        1. Context: What is the paper or study about? 
        2. What approach, experiment, or method is discussed (if mentioned)?
        3. The key findings or arguments
        4. Findings/Conclusion: What was discovered or concluded?
- Use formal academic tone.
- Write as a continuous paragraph with smooth transitions between sentences.
- Do not add information that is not present in the abstract.
- Do not repeat phrases unnecessarily.
- Do not use generic phrases like "This paper discusses" or "The study talks about."
- Keep it clear, precise, and information-dense.
- Return ONLY the paragraph text, no formatting, no bullet points, no numbering.

Abstract:
{{{abstract}}}`,
});

const abstractSummarizerFlow = ai.defineFlow(
  {
    name: 'abstractSummarizerFlowV2',
    inputSchema: AbstractSummarizerInputSchema,
    outputSchema: AbstractSummarizerOutputSchema,
  },
  async (input) => {
    const { output } = await abstractSummarizerPrompt(input);
    return output!;
  }
);
