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
        let incidenciasBaseQuery = supabase.from('incidencias').select('id', { count: 'exact', head: true });
        let faltasQuery = supabase.from('incidencias').select('id', { count: 'exact', head: true }).eq('tipo', 'Inasistencia');
        let tardanzasQuery = supabase.from('incidencias').select('id', { count: 'exact', head: true }).eq('tipo', 'Tardanza');

        if (user.role === 'docente') {
          incidenciasBaseQuery = incidenciasBaseQuery.eq('registrador_user_id', user.id);
          faltasQuery = faltasQuery.eq('registrador_user_id', user.id);
          tardanzasQuery = tardanzasQuery.eq('registrador_user_id', user.id);
        }

        const [alertsRes, incidentsRes, faltasRes, tardanzasRes] = await Promise.all([
          supabase.from('alertas').select('id', { count: 'exact', head: true }).eq('leido', false),
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
      description: "Casos activos prioritarios",
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
      hoverBorder: "hover:border-red-500/30",
      badgeText: "Urgente"
    },
    {
      title: "Incidencias Registradas",
      value: isLoading ? "..." : counts.incidenciasTotales.toString(),
      description: "Histórico total de reportes",
      icon: ClipboardList,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      hoverBorder: "hover:border-blue-500/30",
      badgeText: "Acumulado"
    },
    {
      title: "Faltas (Inasistencias)",
      value: isLoading ? "..." : counts.faltas.toString(),
      description: "Inasistencias reportadas",
      icon: UserX,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      hoverBorder: "hover:border-amber-500/30",
      badgeText: "Mensual"
    },
    {
      title: "Tardanzas",
      value: isLoading ? "..." : counts.tardanzas.toString(),
      description: "Llegadas tarde registradas",
      icon: Clock,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      hoverBorder: "hover:border-emerald-500/30",
      badgeText: "Control"
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, idx) => (
        <Card key={idx} className={`border border-slate-200/60 bg-white/75 dark:border-white/[0.08] dark:bg-white/[0.03] backdrop-blur-xl shadow-lg dark:shadow-2xl shadow-slate-100/40 dark:shadow-black/20 hover:shadow-xl dark:hover:shadow-black/40 hover:-translate-y-1 hover:bg-white/90 dark:hover:bg-white/[0.06] transition-all duration-300 rounded-2xl ${stat.hoverBorder}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent">
            <div className="flex flex-col gap-1.5">
              <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{stat.title}</CardTitle>
              <span className="text-[9px] font-bold text-slate-650 dark:text-slate-300 px-2 py-0.5 bg-slate-500/10 dark:bg-white/10 border border-slate-500/5 dark:border-white/5 rounded-full w-max">
                {stat.badgeText}
              </span>
            </div>
            <div className={`p-2.5 rounded-xl border ${stat.bg} ${stat.color} shadow-sm`}>
              <stat.icon size={18} />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-black tracking-tight text-slate-800 dark:text-slate-100">
              {stat.value === "..." ? (
                <div className="h-9 flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400 dark:text-slate-500" />
                </div>
              ) : (
                stat.value
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-pulse inline-block" />
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}