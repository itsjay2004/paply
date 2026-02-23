import { config } from 'dotenv';
config();

import '@/ai/flows/paper-list-abstract-summaries.ts';
import '@/ai/flows/text-explainer.ts';
import '@/ai/flows/abstract-summarizer.ts';
import '@/ai/flows/fetch-paper-details-from-doi.ts';
import '@/ai/flows/extract-paper-details-from-pdf.ts';
