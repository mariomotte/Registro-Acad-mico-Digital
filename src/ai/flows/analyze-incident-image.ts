'use server';

import { ai } from '@/ai/genkit';

export async function analyzeIncidentImage(imageBase64DataUri: string): Promise<string> {
  try {
    const response = await ai.generate({
      prompt: [
        { text: 'Analiza esta imagen que representa una evidencia de una incidencia en una institución educativa. Describe de manera detallada lo que se observa (por ejemplo, daños materiales, desorden, agresión, comportamiento inadecuado, etc.) y redacta un reporte formal y objetivo en español de los hechos observados, de forma que sirva directamente como la descripción de un reporte de incidencia escolar. Sé conciso pero completo (alrededor de 2 a 4 oraciones).' },
        { media: { url: imageBase64DataUri } }
      ]
    });
    
    return response.text;
  } catch (error: any) {
    console.error("Error running analyzeIncidentImage:", error);
    throw new Error(error.message || "No se pudo analizar la imagen con IA.");
  }
}

export async function transcribeIncidentSheet(imageBase64DataUri: string): Promise<{
  transcription: string;
  description: string;
  suggestedType?: string;
  suggestedSeverity?: string;
  suggestedStudent?: string;
}> {
  try {
    const response = await ai.generate({
      prompt: [
        {
          text: `Analiza esta imagen que contiene una hoja de reporte de incidencias escolares (puede estar escrita a mano o impresa).
Extrae la información relevante y realiza las siguientes tareas:
1. Transcribe textualmente todo el contenido legible de la hoja.
2. Basándote en el contenido, redacta una descripción detallada, formal y objetiva en español del suceso.
3. Intenta identificar:
   - Tipo de incidencia (debe sugerir uno de los siguientes valores exactos si aplica: 'Inasistencia', 'Tardanza', 'Problema de comportamiento', 'Problema de salud', 'Conflicto entre alumnos', 'Observación académica').
   - Nivel de gravedad (debe sugerir uno de los siguientes valores exactos si aplica: 'bajo', 'medio', 'alto').
   - Nombre o apellido del alumno mencionado en el reporte.

Devuelve la información estructurada como un objeto JSON con el siguiente formato exacto:
{
  "transcription": "Texto completo transcrito de la hoja",
  "description": "Descripción formal de la incidencia para el formulario",
  "suggestedType": "Tipo de incidencia sugerido",
  "suggestedSeverity": "bajo|medio|alto",
  "suggestedStudent": "Nombre o apellido del alumno"
}

Asegúrate de responder ÚNICAMENTE con el objeto JSON válido, sin bloques de código markdown, sin texto explicativo extra.`
        },
        { media: { url: imageBase64DataUri } }
      ]
    });

    const cleanText = response.text.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const result = JSON.parse(cleanText);
    return result;
  } catch (error: any) {
    console.error("Error in transcribeIncidentSheet:", error);
    throw new Error(error.message || "No se pudo transcribir la imagen con IA.");
  }
}
