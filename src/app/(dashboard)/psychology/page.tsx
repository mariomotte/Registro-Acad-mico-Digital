"use client"

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Brain, Users, Calendar, ArrowRight, MessageSquare, Sparkles } from "lucide-react"
import { MOCK_STUDENTS, MOCK_ALERTS, MOCK_SESSIONS } from "@/lib/mock-data"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function PsychologyDashboard() {
  const criticalStudents = MOCK_ALERTS.filter(a => a.nivel === 'rojo');
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 font-headline">Gabinete Psicopedagógico</h2>
          <p className="text-muted-foreground">Seguimiento de bienestar emocional y atención de casos críticos.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-accent hover:bg-accent/90">
            <Sparkles className="mr-2 h-4 w-4" /> Generar Informe de Aula (IA)
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} className="text-red-500" />
              Estudiantes Derivados (Casos Críticos)
            </CardTitle>
            <CardDescription>Estudiantes con alerta roja que requieren atención inmediata.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {criticalStudents.map((alert) => {
              const student = MOCK_STUDENTS.find(s => s.id === alert.alumnoId);
              return (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-xl bg-red-50/30 border-red-100">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800">{alert.alumnoNombre}</span>
                    <span className="text-xs text-slate-500">{student?.grado} {student?.seccion} • {alert.tipo}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/students/${alert.alumnoId}`}>Ver Ficha</Link>
                    </Button>
                    <Button size="sm" className="bg-accent" asChild>
                      <Link href={`/psychology/sessions/new?studentId=${alert.alumnoId}`}>
                        <MessageSquare size={14} className="mr-2" /> Iniciar Sesión
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={20} className="text-primary" />
              Sesiones Recientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {MOCK_SESSIONS.map((session) => (
              <div key={session.id} className="p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm">
                    {MOCK_STUDENTS.find(s => s.id === session.alumnoId)?.nombre}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {session.clasificacion}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{session.motivo}</p>
                <div className="mt-2 text-[10px] text-slate-400">
                  {format(new Date(session.fecha), "dd MMM, yyyy", { locale: es })}
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-xs" asChild>
              <Link href="/psychology/sessions">Ver historial completo <ArrowRight size={14} className="ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-accent/20 bg-accent/5">
        <CardHeader>
          <CardTitle className="text-accent flex items-center gap-2">
            <Brain size={20} />
            Recomendaciones para el Personal
          </CardTitle>
          <CardDescription>Basado en el análisis anónimo de los casos actuales.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "Reforzar dinámicas de integración grupal en 3ro C.",
              "Implementar pausas activas para reducir niveles de ansiedad reportados.",
              "Capacitar en detección de signos de alerta emocional temprana.",
              "Fomentar la comunicación asertiva docente-alumno en secundaria."
            ].map((rec, i) => (
              <div key={i} className="flex gap-3 bg-white p-3 rounded-lg border shadow-sm items-start">
                <div className="h-2 w-2 rounded-full bg-accent mt-1.5 shrink-0" />
                <span className="text-sm text-slate-700">{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
