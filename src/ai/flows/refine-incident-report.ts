'use server';
/**
 * @fileOverview Genkit flow for refining student incident reports.
 *
 * - refineIncidentReport - Function to polish a rough incident description.
 * - RefineIncidentReportInput - Input schema (rough text).
 * - RefineIncidentReportOutput - Output schema (refined text).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RefineIncidentReportInputSchema = z.object({
  roughDescription: z.string().describe('The initial, potentially informal or brief description of the incident.'),
  studentName: z.string().optional().describe('Optional name of the student for context.'),
});

export type RefineIncidentReportInput = z.infer<typeof RefineIncidentReportInputSchema>;

const RefineIncidentReportOutputSchema = z.object({
  refinedText: z.string().describe('The professional, structured, and objective version of the incident report.'),
});

export type RefineIncidentReportOutput = z.infer<typeof RefineIncidentReportOutputSchema>;

export async function refineIncidentReport(input: RefineIncidentReportInput): Promise<RefineIncidentReportOutput> {
  return refineIncidentReportFlow(input);
}

const refineReportPrompt = ai.definePrompt({
  name: 'refineReportPrompt',
  input: { schema: RefineIncidentReportInputSchema },
  output: { schema: RefineIncidentReportOutputSchema },
  prompt: `Eres un asistente experto en redacción administrativa escolar. Tu objetivo es convertir descripciones informales o breves de incidentes estudiantiles en reportes profesionales, objetivos y claros.

Instrucciones:
1. Mantén un tono formal y profesional.
2. Sé objetivo: evita juicios de valor innecesarios, describe los hechos.
3. Asegúrate de que la gramática y ortografía sean impecables (en español).
4. Estructura el reporte si es necesario (Antecedentes, Suceso, Consecuencia inmediata).

Nombre del Estudiante (si se provee): {{{studentName}}}
Descripción Original: {{{roughDescription}}}

Devuelve la versión refinada del texto.`,
});

const refineIncidentReportFlow = ai.defineFlow(
  {
    name: 'refineIncidentReportFlow',
    inputSchema: RefineIncidentReportInputSchema,
    outputSchema: RefineIncidentReportOutputSchema,
  },
  async (input) => {
    const { output } = await refineReportPrompt(input);
    return output!;
  }
);
