"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles, Loader2, CheckCircle2, ListChecks } from "lucide-react"
import { aiIncidentSummaryAndSuggestions, AiIncidentSummaryAndSuggestionsOutput } from "@/ai/flows/ai-incident-summary-and-suggestions"
import { Alumno, Incidencia } from "@/types"

interface IncidentAiSummaryProps {
  student: Alumno;
  incidents: Incidencia[];
}

export function IncidentAiSummary({ student, incidents }: IncidentAiSummaryProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState<AiIncidentSummaryAndSuggestionsOutput | null>(null)

  const generateSummary = async () => {
    setIsLoading(true)
    try {
      const normalizedIncidents = incidents.map(inc => {
        // Fallback for registeredBy
        let registeredBy = "No registrado";
        if (inc.registradoPor) {
          registeredBy = inc.registradoPor;
        } else if ((inc as any).registrado_por) {
          registeredBy = (inc as any).registrado_por;
        } else if (inc.registradorUserId) {
          registeredBy = inc.registradorUserId;
        } else if ((inc as any).registrador_user_id) {
          registeredBy = (inc as any).registrador_user_id;
        }

        // Fallback for evidenceUrls
        const rawEvidence = inc.evidenceUrls || (inc as any).evidence_urls;
        const evidenceUrls = Array.isArray(rawEvidence)
          ? rawEvidence.filter((url: string) => {
              try {
                new URL(url);
                return true;
              } catch {
                return false;
              }
            })
          : [];

        // Fallback and normalize severity to 'bajo' | 'medio' | 'alto'
        let severity: 'bajo' | 'medio' | 'alto' = 'bajo';
        const rawSeverity = (inc.severidad || (inc as any).severity || 'bajo').toLowerCase();
        if (rawSeverity === 'grave' || rawSeverity === 'alto') {
          severity = 'alto';
        } else if (rawSeverity === 'moderada' || rawSeverity === 'medio') {
          severity = 'medio';
        } else {
          severity = 'bajo';
        }

        // Fallback and format date to ISO 8601 string
        let dateStr = inc.fecha || inc.fecha_suceso || (inc as any).fecha;
        if (!dateStr) {
          dateStr = new Date().toISOString();
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          dateStr = `${dateStr}T12:00:00Z`;
        } else {
          try {
            dateStr = new Date(dateStr).toISOString();
          } catch {
            dateStr = new Date().toISOString();
          }
        }

        return {
          type: inc.tipo || (inc as any).type || "Observación",
          description: inc.descripcion || (inc as any).description || "Sin descripción",
          severity,
          date: dateStr,
          registeredBy,
          evidenceUrls
        };
      });

      const result = await aiIncidentSummaryAndSuggestions({
        studentName: `${student.nombres} ${student.apellidos}`,
        incidents: normalizedIncidents
      });
      setSummary(result);
    } catch (error) {
      console.error("AI Summary generation failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-accent">
            <Sparkles size={20} />
            Análisis de Inteligencia Artificial
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {summary ? (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-accent" />
                Resumen del Caso
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm">
                {summary.summary}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                <ListChecks size={16} className="text-accent" />
                Acciones Sugeridas
              </h4>
              <ul className="grid gap-2">
                {summary.suggestedActions.map((action, i) => (
                  <li key={i} className="text-sm text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-900/70 border border-accent/10 p-3 rounded-md flex gap-3 items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSummary(null)}>
              Recalcular Análisis
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-sm text-accent font-medium animate-pulse">Analizando patrones y comportamientos...</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-4">
            <Button 
              onClick={generateSummary} 
              disabled={incidents.length === 0}
              className="bg-accent hover:bg-accent/90"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generar Informe
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
