'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating an AI-powered summary
 * of a student's incident history and suggesting actions for directors.
 *
 * - aiIncidentSummaryAndSuggestions - A function that triggers the AI analysis.
 * - AiIncidentSummaryAndSuggestionsInput - The input type for the AI analysis.
 * - AiIncidentSummaryAndSuggestionsOutput - The return type for the AI analysis.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const IncidentSchema = z.object({
  type: z.string().describe('The type of incident (e.g., Inasistencia, Problema de comportamiento, Problema de salud, Conflicto entre alumnos, Observación académica).'),
  description: z.string().describe('A detailed description of the incident.'),
  severity: z.enum(['bajo', 'medio', 'alto']).describe('The severity level of the incident.'),
  date: z.string().datetime().describe('The date and time when the incident occurred, in ISO 8601 format.'),
  registeredBy: z.string().describe('The ID or name of the user who registered the incident.'),
  evidenceUrls: z.array(z.string().url()).optional().describe('Optional list of URLs pointing to evidence files (e.g., photos).'),
});

const AiIncidentSummaryAndSuggestionsInputSchema = z.object({
  studentName: z.string().describe('The full name of the student for whom the incidents are being summarized.'),
  incidents: z.array(IncidentSchema).describe('An array of incident objects related to the student.'),
});

export type AiIncidentSummaryAndSuggestionsInput = z.infer<typeof AiIncidentSummaryAndSuggestionsInputSchema>;

const AiIncidentSummaryAndSuggestionsOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the student\'s incident history, highlighting key issues and patterns.'),
  suggestedActions: z.array(z.string()).describe('A list of actionable steps or interventions suggested for educators or directors.'),
});

export type AiIncidentSummaryAndSuggestionsOutput = z.infer<typeof AiIncidentSummaryAndSuggestionsOutputSchema>;

export async function aiIncidentSummaryAndSuggestions(input: AiIncidentSummaryAndSuggestionsInput): Promise<AiIncidentSummaryAndSuggestionsOutput> {
  return aiIncidentSummaryAndSuggestionsFlow(input);
}

const incidentSummaryPrompt = ai.definePrompt({
  name: 'incidentSummaryPrompt',
  input: { schema: AiIncidentSummaryAndSuggestionsInputSchema },
  output: { schema: AiIncidentSummaryAndSuggestionsOutputSchema },
  prompt: `Eres un analista educativo experto. Tu tarea es revisar el historial de incidentes de un estudiante, resumir los problemas clave, identificar patrones y sugerir pasos de acción concretos para que los educadores o directivos apoyen al estudiante.

Nombre del Estudiante: {{{studentName}}}

Historial de Incidentes:
{{#if incidents}}
  {{#each incidents}}
    - Fecha: {{{date}}}
    - Tipo: {{{type}}}
    - Severidad: {{{severity}}}
    - Descripción: {{{description}}}
    - Registrado por: {{{registeredBy}}}
  {{/each}}
{{else}}
  No se han reportado incidentes para este estudiante.
{{/if}}

Por favor, proporciona un resumen conciso del historial de incidentes del estudiante, destacando cualquier tema recurrente o evento crítico. Después del resumen, sugiere entre 3 y 5 pasos de acción o intervenciones concretas y aplicables que los educadores o directivos podrían considerar para abordar la situación del estudiante. Formatea tu respuesta estrictamente como un objeto JSON con las claves 'summary' (resumen) y 'suggestedActions' (acciones sugeridas).`,
});

const aiIncidentSummaryAndSuggestionsFlow = ai.defineFlow(
  {
    name: 'aiIncidentSummaryAndSuggestionsFlow',
    inputSchema: AiIncidentSummaryAndSuggestionsInputSchema,
    outputSchema: AiIncidentSummaryAndSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await incidentSummaryPrompt(input);
    return output!;
  }
);
