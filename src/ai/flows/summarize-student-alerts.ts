'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SummarizeAlertsInputSchema = z.object({
  studentName: z.string().describe('Nombre del estudiante.'),
  alertReason: z.string().describe('Motivo de la alerta principal.'),
  incidentsData: z.string().describe('Información concatenada o JSON de las faltas, tardanzas e incidencias.'),
});

export type SummarizeAlertsInput = z.infer<typeof SummarizeAlertsInputSchema>;

const SummarizeAlertsOutputSchema = z.object({
  summary: z.string().describe('Resumen claro y conciso dirigido al apoderado.'),
});

export type SummarizeAlertsOutput = z.infer<typeof SummarizeAlertsOutputSchema>;

export async function summarizeStudentAlerts(input: SummarizeAlertsInput): Promise<SummarizeAlertsOutput> {
  return summarizeAlertsFlow(input);
}

const summarizeAlertsPrompt = ai.definePrompt({
  name: 'summarizeAlertsPrompt',
  input: { schema: SummarizeAlertsInputSchema },
  output: { schema: SummarizeAlertsOutputSchema },
  prompt: `Eres un asistente experto en comunicación escolar. Tu objetivo es generar un texto breve, no técnico y fácil de entender dirigido al apoderado (padre o tutor) indicando la situación actual de su hijo/a.

Instrucciones:
1. El tono debe ser respetuoso, empático, claro y libre de tecnicismos excesivos o tablas.
2. Identifica al estudiante e indica claramente cuál es el motivo de la alerta principal (Motivo de Alerta).
3. Resume los incidentes recientes (ej. "Ha presentado 3 inasistencias injustificadas y 2 tardanzas en las últimas semanas").
4. El resumen no debe ser más largo de 2 o 3 párrafos cortos.

Nombre del Estudiante: {{{studentName}}}
Motivo de Alerta Principal: {{{alertReason}}}
Datos Registrados:
{{{incidentsData}}}

Devuelve únicamente el resumen en formato de texto claro para el apoderado.`,
});

export const summarizeAlertsFlow = ai.defineFlow(
  {
    name: 'summarizeAlertsFlow',
    inputSchema: SummarizeAlertsInputSchema,
    outputSchema: SummarizeAlertsOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeAlertsPrompt(input);
    return output!;
  }
);
