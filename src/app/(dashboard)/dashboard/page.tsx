
"use client"

import { StatCards } from "@/components/dashboard/StatCards"
import { RecentIncidents } from "@/components/dashboard/RecentIncidents"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, AlertCircle, Calendar } from "lucide-react"
import Link from "next/link"
import { useUser } from "@/firebase"

export default function DashboardPage() {
  const { user } = useUser()

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 font-headline">Resumen Institucional</h2>
          <p className="text-muted-foreground">Bienvenido, {user?.displayName || "Usuario"}. Aquí tienes el estado actual del colegio.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="hidden md:flex">
            <Link href="/students">
              <Users className="mr-2 h-4 w-4" /> Ver Alumnos
            </Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/incidents/new">
              <Plus className="mr-2 h-4 w-4" /> Nueva Incidencia
            </Link>
          </Button>
        </div>
      </div>

      {/* Tarjetas de estadísticas generales */}
      <StatCards />

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        {/* Sección de incidencias recientes para un vistazo rápido */}
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50">
            <div className="space-y-1">
              <CardTitle className="text-xl">Últimos Reportes</CardTitle>
              <CardDescription>Eventos registrados en las últimas 48 horas.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary font-bold">
              <Link href="/incidents">Ver historial completo</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <RecentIncidents />
          </CardContent>
        </Card>

        {/* Sección de alertas críticas prioritarias */}
        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              Casos Prioritarios
            </CardTitle>
            <CardDescription>Alumnos con seguimiento urgente por conducta o asistencia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Ana Martínez", status: "Alerta Roja", grade: "3ro C", icon: "🔴" },
              { name: "Carlos Rodríguez", status: "Alerta Amarilla", grade: "4to A", icon: "🟡" },
              { name: "Juan Pérez", status: "Seguimiento", grade: "5to A", icon: "🟢" },
            ].map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="text-xl">{alert.icon}</div>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700 group-hover:text-primary transition-colors">{alert.name}</span>
                    <span className="text-xs text-muted-foreground">{alert.grade}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{alert.status}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/students/st_${i+1}`}>
                      <Calendar size={14} />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-2 text-xs font-bold py-5" asChild>
              <Link href="/alerts">Gestionar todas las alertas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
