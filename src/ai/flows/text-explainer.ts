'use server';
/**
 * @fileOverview An AI agent for explaining complex text.
 *
 * - explainText - A function that handles the text explanation process.
 * - TextExplainerInput - The input type for the explainText function.
 * - TextExplainerOutput - The return type for the explainText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TextExplainerInputSchema = z.object({
  text: z.string().describe('The complex text to be explained.'),
});
export type TextExplainerInput = z.infer<typeof TextExplainerInputSchema>;

const TextExplainerOutputSchema = z.object({
  explanation: z.string().describe('A simplified explanation of the complex text.'),
});
export type TextExplainerOutput = z.infer<typeof TextExplainerOutputSchema>;

export async function explainText(input: TextExplainerInput): Promise<TextExplainerOutput> {
  return textExplainerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'textExplainerPrompt',
  input: {schema: TextExplainerInputSchema},
  output: {schema: TextExplainerOutputSchema},
  prompt: `You are an expert at simplifying complex academic and scientific jargon for a general audience.

Your task is to take the provided complex text and explain it in a clear, concise, and easy-to-understand manner.
Avoid using overly technical terms and break down concepts into simpler parts. Focus on the core meaning.

Complex Text: {{{text}}}`,
});

const textExplainerFlow = ai.defineFlow(
  {
    name: 'textExplainerFlow',
    inputSchema: TextExplainerInputSchema,
    outputSchema: TextExplainerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  },
);
