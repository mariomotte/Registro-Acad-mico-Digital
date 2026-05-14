import { config } from 'dotenv';
config();

import '@/ai/flows/ai-incident-summary-and-suggestions.ts';
import '@/ai/flows/refine-incident-report.ts';
import '@/ai/flows/summarize-student-alerts.ts';
