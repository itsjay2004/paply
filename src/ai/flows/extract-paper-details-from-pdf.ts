'use server';
/**
 * @fileOverview A Genkit flow to extract paper details from a PDF.
 *
 * - extractPaperDetailsFromPdf - A function that extracts structured data from a research paper PDF.
 * - ExtractPaperDetailsFromPdfInput - The input type for the function.
 * - ExtractPaperDetailsFromPdfOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExtractPaperDetailsFromPdfInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file of a research paper, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type ExtractPaperDetailsFromPdfInput = z.infer<typeof ExtractPaperDetailsFromPdfInputSchema>;

const ExtractPaperDetailsFromPdfOutputSchema = z.object({
    title: z.string().describe('The title of the paper.'),
    authors: z.array(z.string()).describe('The authors of the paper.'),
    year: z.number().describe('The publication year of the paper.'),
    journal: z.string().describe('The journal or conference where the paper was published.'),
    abstract: z.string().describe('The abstract of the paper.'),
    doi: z.string().optional().describe('The DOI of the paper, if it is present in the document.'),
});
export type ExtractPaperDetailsFromPdfOutput = z.infer<typeof ExtractPaperDetailsFromPdfOutputSchema>;


export async function extractPaperDetailsFromPdf(input: ExtractPaperDetailsFromPdfInput): Promise<ExtractPaperDetailsFromPdfOutput> {
  return extractPaperDetailsFromPdfFlow(input);
}


const extractPrompt = ai.definePrompt({
    name: 'extractPaperDetailsFromPdfPrompt',
    input: { schema: ExtractPaperDetailsFromPdfInputSchema },
    output: { schema: ExtractPaperDetailsFromPdfOutputSchema },
    prompt: `You are an expert at analyzing academic papers.
Examine the provided PDF and extract the following information:
- Title
- All authors
- Publication year
- Journal or conference name
- The full abstract
- The DOI, if it is present in the document.

PDF: {{media url=pdfDataUri}}`
});

const extractPaperDetailsFromPdfFlow = ai.defineFlow(
  {
    name: 'extractPaperDetailsFromPdfFlow',
    inputSchema: ExtractPaperDetailsFromPdfInputSchema,
    outputSchema: ExtractPaperDetailsFromPdfOutputSchema,
  },
  async (input) => {
    const { output } = await extractPrompt(input);
    return output!;
  }
);
