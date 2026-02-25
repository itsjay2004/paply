'use server';
/**
 * @fileOverview A Genkit flow to fetch paper details from a DOI.
 *
 * - fetchPaperDetailsFromDoi - Fetches paper metadata from a given DOI.
 * - FetchPaperDetailsFromDoiInput - The input type for the function.
 * - FetchPaperDetailsFromDoiOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const fetchFromCrossRefTool = ai.defineTool(
    {
        name: 'fetchFromCrossRef',
        description: 'Fetches paper metadata from CrossRef using DOI.',
        inputSchema: z.object({ doi: z.string() }),
        outputSchema: z.any(),
    },
    async ({ doi }) => {
        try {
            const encodedDoi = encodeURIComponent(doi.trim());
            const response = await fetch(`https://api.crossref.org/works/${encodedDoi}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data from CrossRef: ${response.statusText}`);
            }
            const data = await response.json();
            return data.message;
        } catch (error) {
            console.error('CrossRef fetch error:', error);
            if (error instanceof Error) {
                throw new Error(`Could not fetch DOI details: ${error.message}`);
            }
            throw new Error('An unknown error occurred while fetching from CrossRef.');
        }
    }
);

const FetchPaperDetailsFromDoiInputSchema = z.object({
  doi: z.string().describe('The DOI of the paper.'),
});
export type FetchPaperDetailsFromDoiInput = z.infer<typeof FetchPaperDetailsFromDoiInputSchema>;

const FetchPaperDetailsFromDoiOutputSchema = z.object({
    title: z.string(),
    authors: z.array(z.string()),
    year: z.number(),
    journal: z.string(),
    abstract: z.string(),
    doi: z.string().optional(),
});
export type FetchPaperDetailsFromDoiOutput = z.infer<typeof FetchPaperDetailsFromDoiOutputSchema>;


export async function fetchPaperDetailsFromDoi(input: FetchPaperDetailsFromDoiInput): Promise<FetchPaperDetailsFromDoiOutput> {
    return fetchPaperDetailsFromDoiFlow(input);
}

const fetchPaperDetailsFromDoiFlow = ai.defineFlow(
    {
        name: 'fetchPaperDetailsFromDoiFlow',
        inputSchema: FetchPaperDetailsFromDoiInputSchema,
        outputSchema: FetchPaperDetailsFromDoiOutputSchema,
    },
    async ({ doi }) => {
        const crossrefData = await fetchFromCrossRefTool({ doi });

        const title = Array.isArray(crossrefData.title) && crossrefData.title.length > 0 ? crossrefData.title[0] : 'Title not found';
        const authors = Array.isArray(crossrefData.author) ? crossrefData.author.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()).filter((name:string) => name) : [];
        const year = crossrefData.published?.['date-parts']?.[0]?.[0] || crossrefData.issued?.['date-parts']?.[0]?.[0] || 0;
        const journal = Array.isArray(crossrefData['container-title']) && crossrefData['container-title'].length > 0 ? crossrefData['container-title'][0] : (Array.isArray(crossrefData['short-container-title']) && crossrefData['short-container-title'].length > 0 ? crossrefData['short-container-title'][0] : 'Journal not found');
        let abstract = crossrefData.abstract || 'Abstract not found.';
        if (abstract.startsWith('<')) {
            abstract = abstract.replace(/<[^>]*>?/gm, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        }

        return {
            title,
            authors,
            year,
            journal,
            abstract,
            doi,
        };
    }
);
