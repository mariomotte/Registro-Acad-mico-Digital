"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowRight, ClipboardList, Clock, Loader2, UserX } from "lucide-react"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"

export function StatCards() {
  const { user, loading: isUserLoading } = useSupabaseAuth()
  const [counts, setCounts] = useState({
    alertasActivas: 0,
    incidenciasTotales: 0,
    faltas: 0,
    tardanzas: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchCounts() {
      if (!user) return

      try {
        let incidenciasBaseQuery = supabase.from("incidencias").select("id", { count: "exact", head: true })
        let faltasQuery = supabase.from("incidencias").select("id", { count: "exact", head: true }).eq("tipo", "Inasistencia")
        let tardanzasQuery = supabase.from("incidencias").select("id", { count: "exact", head: true }).eq("tipo", "Tardanza")

        if (user.role === "docente") {
          incidenciasBaseQuery = incidenciasBaseQuery.eq("registrador_user_id", user.id)
          faltasQuery = faltasQuery.eq("registrador_user_id", user.id)
          tardanzasQuery = tardanzasQuery.eq("registrador_user_id", user.id)
        }

        const [alertsRes, incidentsRes, faltasRes, tardanzasRes] = await Promise.all([
          supabase.from("alertas").select("id", { count: "exact", head: true }).eq("leido", false),
          incidenciasBaseQuery,
          faltasQuery,
          tardanzasQuery,
        ])

        if (mounted) {
          setCounts({
            alertasActivas: alertsRes.count || 0,
            incidenciasTotales: incidentsRes.count || 0,
            faltas: faltasRes.count || 0,
            tardanzas: tardanzasRes.count || 0,
          })
        }
      } catch (err) {
        console.error("Error fetching stats counts", err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    if (!isUserLoading) {
      fetchCounts()
    }

    return () => {
      mounted = false
    }
  }, [user, isUserLoading])

  const stats = [
    {
      title: "Alumnos en Alerta",
      value: isLoading ? "..." : counts.alertasActivas.toString(),
      description: "Casos activos prioritarios",
      icon: AlertTriangle,
      card: "bg-red-600 text-white border-red-500 shadow-red-950/15 dark:bg-red-950 dark:border-red-800",
      iconBox: "bg-white/15 border-white/20 text-white",
      badge: "bg-white/15 text-white border-white/20",
      href: "/alerts",
      badgeText: "Urgente",
    },
    {
      title: "Incidencias",
      value: isLoading ? "..." : counts.incidenciasTotales.toString(),
      description: "Total de reportes",
      icon: ClipboardList,
      card: "bg-teal-700 text-white border-teal-600 shadow-teal-950/15 dark:bg-teal-950 dark:border-teal-800",
      iconBox: "bg-white/15 border-white/20 text-white",
      badge: "bg-white/15 text-white border-white/20",
      href: "/incidents",
      badgeText: "Acumulado",
    },
    {
      title: "Inasistencias",
      value: isLoading ? "..." : counts.faltas.toString(),
      description: "Reportadas como incidencia",
      icon: UserX,
      card: "bg-amber-500 text-amber-950 border-amber-400 shadow-amber-950/15 dark:bg-amber-700 dark:text-white dark:border-amber-600",
      iconBox: "bg-white/25 border-white/25 text-current",
      badge: "bg-white/25 text-current border-white/25",
      href: "/incidents",
      badgeText: "Seguimiento",
    },
    {
      title: "Tardanzas",
      value: isLoading ? "..." : counts.tardanzas.toString(),
      description: "Llegadas tarde registradas",
      icon: Clock,
      card: "bg-emerald-700 text-white border-emerald-600 shadow-emerald-950/15 dark:bg-emerald-950 dark:border-emerald-800",
      iconBox: "bg-white/15 border-white/20 text-white",
      badge: "bg-white/15 text-white border-white/20",
      href: "/incidents",
      badgeText: "Control",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className={`overflow-hidden border shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${stat.card}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-transparent">
            <div className="flex flex-col gap-1.5">
              <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-current/75">{stat.title}</CardTitle>
              <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full w-max ${stat.badge}`}>
                {stat.badgeText}
              </span>
            </div>
            <div className={`p-2.5 rounded-xl border shadow-sm ${stat.iconBox}`}>
              <stat.icon size={18} />
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-3xl font-black tracking-tight">
              {stat.value === "..." ? (
                <div className="h-9 flex items-center">
                  <Loader2 className="h-5 w-5 animate-spin text-current/70" />
                </div>
              ) : (
                stat.value
              )}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-current/75 font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-current/60 animate-pulse inline-block" />
                {stat.description}
              </p>
              <Link href={stat.href} className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15 text-current hover:bg-white/25" aria-label={`Ir a ${stat.title}`}>
                <ArrowRight size={14} />
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
