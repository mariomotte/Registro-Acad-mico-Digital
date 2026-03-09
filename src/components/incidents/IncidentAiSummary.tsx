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
      const result = await aiIncidentSummaryAndSuggestions({
        studentName: `${student.nombre} ${student.apellido}`,
        incidents: incidents.map(inc => ({
          type: inc.tipo,
          description: inc.descripcion,
          severity: inc.severidad,
          date: inc.fecha,
          registeredBy: inc.registradoPor
        }))
      })
      setSummary(result)
    } catch (error) {
      console.error("AI Summary generation failed", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-accent/20 bg-accent/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-accent">
            <Sparkles size={20} />
            Análisis de Inteligencia Artificial
          </CardTitle>
          <CardDescription>Resumen automatizado y sugerencias para directivos.</CardDescription>
        </div>
        {!summary && (
          <Button 
            onClick={generateSummary} 
            disabled={isLoading || incidents.length === 0}
            className="bg-accent hover:bg-accent/90"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generar Informe
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {summary ? (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-accent" />
                Resumen del Caso
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-lg border shadow-sm">
                {summary.summary}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <ListChecks size={16} className="text-accent" />
                Acciones Sugeridas
              </h4>
              <ul className="grid gap-2">
                {summary.suggestedActions.map((action, i) => (
                  <li key={i} className="text-sm text-slate-700 bg-white/50 border border-accent/10 p-3 rounded-md flex gap-3 items-start">
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
        ) : !isLoading ? (
          <div className="text-center py-8">
            <Sparkles size={40} className="mx-auto text-accent/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              {incidents.length === 0 
                ? "El alumno no tiene incidencias registradas para analizar."
                : "Haz clic en 'Generar Informe' para analizar el historial del alumno."}
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-sm text-accent font-medium animate-pulse">Analizando patrones y comportamientos...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}