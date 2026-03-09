import { StatCards } from "@/components/dashboard/StatCards"
import { RecentIncidents } from "@/components/dashboard/RecentIncidents"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, Plus } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">Panel de Control</h2>
          <p className="text-muted-foreground">Bienvenido de nuevo al sistema de gestión académica.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/incidents/new">
              <Plus className="mr-2 h-4 w-4" /> Registrar Incidencia
            </Link>
          </Button>
        </div>
      </div>

      <StatCards />

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Incidencias Recientes</CardTitle>
              <CardDescription>Resumen de los últimos reportes registrados hoy.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/incidents">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RecentIncidents />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Alumnos con Alertas</CardTitle>
            <CardDescription>Alumnos con múltiples incidencias esta semana.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Ana Martínez", count: 12, severity: "alto", grade: "3ro C" },
              { name: "Carlos Rodríguez", count: 8, severity: "medio", grade: "4to A" },
              { name: "Juan Pérez", count: 5, severity: "bajo", grade: "5to A" },
            ].map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-700">{alert.name}</span>
                  <span className="text-xs text-muted-foreground">{alert.grade}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    alert.severity === 'alto' ? 'bg-red-100 text-red-700' :
                    alert.severity === 'medio' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {alert.count} reportes
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/students/st_${i+1}`}>Detalles</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}