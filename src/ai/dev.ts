import { config } from 'dotenv';
config();

import '@/ai/flows/text-explainer.ts';
import '@/ai/flows/abstract-summarizer.ts';
import '@/ai/flows/fetch-paper-details-from-doi.ts';
import '@/ai/flows/extract-paper-details-from-pdf.ts';
import '@/ai/flows/extract-title-doi-from-pdf.ts';
