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
  summaryPoints: z.array(z.string()).min(2).max(4).describe('Two to four complete sentences summarizing the abstract; each array element is one sentence.'),
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
- Write in 2 to 4 complete sentences (not bullet points).
-CONTENT: The summary must explicitly cover:
        1. Context: What is the paper or study is about? 
        2. What approach, experiment, or method is discussed (if mentioned)?
        3. The key findings or arguments
        4. Findings/Conclusion: What was discovered or concluded?
- Use formal academic tone.
- Do not add information that is not present in the abstract.
- Do not repeat phrases unnecessarily.
- Do not use generic phrases like "This paper discusses" or "The study talks about."
- Keep it clear, precise, and information-dense.

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
