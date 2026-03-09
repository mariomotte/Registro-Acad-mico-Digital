import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ClipboardList, AlertTriangle, TrendingUp } from "lucide-react"

export function StatCards() {
  const stats = [
    {
      title: "Alumnos Totales",
      value: "842",
      description: "+12 este mes",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Incidencias Hoy",
      value: "12",
      description: "4 de alta severidad",
      icon: ClipboardList,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      title: "Alertas Activas",
      value: "5",
      description: "Requieren revisión urgente",
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      title: "Tasa de Asistencia",
      value: "94%",
      description: "+2% respecto a ayer",
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, idx) => (
        <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon size={18} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}