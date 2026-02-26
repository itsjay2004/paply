'use server';
/**
 * Minimal PDF extraction: title and DOI only (saves AI cost).
 * Use with fetchPaperDetailsFromDoi for full metadata when DOI is present.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExtractTitleDoiInputSchema = z.object({
  pdfDataUri: z
    .string()
    .describe(
      "A PDF file as a data URI: 'data:application/pdf;base64,<encoded_data>'."
    ),
});
export type ExtractTitleDoiFromPdfInput = z.infer<typeof ExtractTitleDoiInputSchema>;

const ExtractTitleDoiOutputSchema = z.object({
  title: z.string().optional().describe('The title of the paper, if found.'),
  doi: z.string().optional().describe('The DOI of the paper, if present (e.g. 10.1234/example or full URL).'),
});
export type ExtractTitleDoiFromPdfOutput = z.infer<typeof ExtractTitleDoiOutputSchema>;

export async function extractTitleDoiFromPdf(
  input: ExtractTitleDoiFromPdfInput
): Promise<ExtractTitleDoiFromPdfOutput> {
  return extractTitleDoiFromPdfFlow(input);
}

const extractTitleDoiPrompt = ai.definePrompt({
  name: 'extractTitleDoiFromPdfPrompt',
  input: { schema: ExtractTitleDoiInputSchema },
  output: { schema: ExtractTitleDoiOutputSchema },
  prompt: `You are an expert at analyzing academic papers.
Examine the provided PDF and extract ONLY the following (nothing else):
1. Title - the main title of the paper (omit if not clearly visible).
2. DOI - the Digital Object Identifier, if present (e.g. 10.1234/example or https://doi.org/...). Omit if not found.

PDF: {{media url=pdfDataUri}}`,
});

const extractTitleDoiFromPdfFlow = ai.defineFlow(
  {
    name: 'extractTitleDoiFromPdfFlow',
    inputSchema: ExtractTitleDoiInputSchema,
    outputSchema: ExtractTitleDoiOutputSchema,
  },
  async (input) => {
    const { output } = await extractTitleDoiPrompt(input);
    return output ?? {};
  }
);
