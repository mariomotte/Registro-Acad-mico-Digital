"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ClipboardList, AlertTriangle, TrendingUp, Loader2 } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, where } from "firebase/firestore"
import { Alumno, Incidencia, Alerta } from "@/types"

export function StatCards() {
  const db = useFirestore()
  const { user, isUserLoading } = useUser()

  const studentsQuery = useMemoFirebase(() => {
    if (!user || isUserLoading) return null;
    return query(collection(db, "students"))
  }, [db, user, isUserLoading])
  
  const { data: students, isLoading: loadingStudents } = useCollection<Alumno>(studentsQuery)

  const incidentsQuery = useMemoFirebase(() => {
    if (!user || isUserLoading) return null;
    return query(collection(db, "incidences"))
  }, [db, user, isUserLoading])
  
  const { data: incidents, isLoading: loadingIncidents } = useCollection<Incidencia>(incidentsQuery)

  const alertsQuery = useMemoFirebase(() => {
    if (!user || isUserLoading) return null;
    return query(collection(db, "alerts"), where("leido", "==", false))
  }, [db, user, isUserLoading])
  
  const { data: alerts, isLoading: loadingAlerts } = useCollection<Alerta>(alertsQuery)

  const stats = [
    {
      title: "Alumnos Totales",
      value: loadingStudents ? "..." : (students?.length || 0).toString(),
      description: "Población estudiantil real",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Incidencias Totales",
      value: loadingIncidents ? "..." : (incidents?.length || 0).toString(),
      description: "Registros históricos",
      icon: ClipboardList,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      title: "Alertas Activas",
      value: loadingAlerts ? "..." : (alerts?.length || 0).toString(),
      description: "Casos sin resolver",
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      title: "Tasa de Asistencia",
      value: "94%",
      description: "Métrica del sistema",
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
            <div className="text-2xl font-bold">
              {stat.value === "..." ? <Loader2 className="h-6 w-6 animate-spin" /> : stat.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}