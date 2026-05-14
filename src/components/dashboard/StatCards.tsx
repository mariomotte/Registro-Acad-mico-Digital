"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, ClipboardList, AlertTriangle, Clock, Loader2, UserX } from "lucide-react"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"

export function StatCards() {
  const { user, loading: isUserLoading } = useSupabaseAuth()
  const [counts, setCounts] = useState({
    alertasActivas: 0,
    incidenciasTotales: 0,
    faltas: 0,
    tardanzas: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true;
    async function fetchCounts() {
      if (!user) return;
      try {
        let incidenciasBaseQuery = supabase.from('incidencias').select('*', { count: 'exact', head: true });
        let faltasQuery = supabase.from('incidencias').select('*', { count: 'exact', head: true }).eq('tipo', 'Inasistencia');
        let tardanzasQuery = supabase.from('incidencias').select('*', { count: 'exact', head: true }).eq('tipo', 'Tardanza');

        if (user.role === 'Docente') {
          incidenciasBaseQuery = incidenciasBaseQuery.eq('registrador_user_id', user.id);
          faltasQuery = faltasQuery.eq('registrador_user_id', user.id);
          tardanzasQuery = tardanzasQuery.eq('registrador_user_id', user.id);
        }

        const [alertsRes, incidentsRes, faltasRes, tardanzasRes] = await Promise.all([
          supabase.from('alertas').select('*', { count: 'exact', head: true }).eq('leido', false),
          incidenciasBaseQuery,
          faltasQuery,
          tardanzasQuery
        ]);

        if (mounted) {
          setCounts({
            alertasActivas: alertsRes.count || 0,
            incidenciasTotales: incidentsRes.count || 0,
            faltas: faltasRes.count || 0,
            tardanzas: tardanzasRes.count || 0
          });
        }
      } catch (err) {
        console.error("Error fetching stats counts", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    if (!isUserLoading) {
      fetchCounts();
    }

    return () => { mounted = false; };
  }, [user, isUserLoading]);

  const stats = [
    {
      title: "Alumnos en Alerta",
      value: isLoading ? "..." : counts.alertasActivas.toString(),
      description: "Casos activos que requieren atención",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-100",
    },
    {
      title: "Incidencias Registradas",
      value: isLoading ? "..." : counts.incidenciasTotales.toString(),
      description: "Histórico total de reportes",
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "Faltas (Inasistencias)",
      value: isLoading ? "..." : counts.faltas.toString(),
      description: "Inasistencias reportadas",
      icon: UserX,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      title: "Tardanzas",
      value: isLoading ? "..." : counts.tardanzas.toString(),
      description: "Llegadas tarde registradas",
      icon: Clock,
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