"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Loader2 } from "lucide-react"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { DocentePanel } from "@/components/dashboard/panels/DocentePanel"
import { AuxiliarPanel } from "@/components/dashboard/panels/AuxiliarPanel"
import { DirectivoPanel } from "@/components/dashboard/panels/DirectivoPanel"

export default function DashboardPage() {
  const { user, loading: isUserLoading } = useSupabaseAuth()
  const { theme, resolvedTheme } = useTheme()
  const [mountedState, setMountedState] = useState(false)

  useEffect(() => {
    setMountedState(true)
  }, [])

  const currentTheme = theme === "system" ? resolvedTheme : theme
  const isDark = mountedState && currentTheme === "dark"

  const gridStroke = isDark ? "rgba(255,255,255,0.05)" : "#e2e8f0"
  const textStroke = isDark ? "#64748b" : "#94a3b8"
  const lineStroke = isDark ? "#60a5fa" : "#2563eb"
  const lineDotFill = isDark ? "#090d16" : "#ffffff"
  const tooltipBg = isDark ? "#090d16" : "#ffffff"
  const tooltipBorder = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"
  const tooltipLabel = isDark ? "#f1f5f9" : "#1e293b"
  const tooltipItem = isDark ? "#60a5fa" : "#2563eb"

  if (isUserLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const renderDashboardPanel = () => {
    switch (user?.role) {
      case "docente":
        return (
          <DocentePanel
            isDark={isDark}
            gridStroke={gridStroke}
            textStroke={textStroke}
            lineStroke={lineStroke}
            lineDotFill={lineDotFill}
            tooltipBg={tooltipBg}
            tooltipBorder={tooltipBorder}
            tooltipLabel={tooltipLabel}
            tooltipItem={tooltipItem}
          />
        )
      case "auxiliar":
        return <AuxiliarPanel />
      default:
        // admin (Superusuario), director y subdirector ven el panel directivo completo
        return (
          <DirectivoPanel
            isDark={isDark}
            gridStroke={gridStroke}
            textStroke={textStroke}
            lineStroke={lineStroke}
            lineDotFill={lineDotFill}
            tooltipBg={tooltipBg}
            tooltipBorder={tooltipBorder}
            tooltipLabel={tooltipLabel}
            tooltipItem={tooltipItem}
          />
        )
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 relative">
      {/* Background ambient glowing shapes for glassmorphism */}
      <div className="absolute top-10 left-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-1/4 w-[350px] h-[350px] bg-accent/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="rounded-2xl border border-slate-900/10 bg-gradient-to-r from-slate-700 via-slate-800 to-slate-950 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-headline uppercase">
              Panel de Control
            </h2>
            <p className="text-sm font-medium text-white/75">
              {user?.role === "docente" && "Tus registros de convivencia y reportes en tiempo real."}
              {user?.role === "auxiliar" && "Monitoreo operativo diario de incidencias y asistencia."}
              {user?.role !== "docente" && user?.role !== "auxiliar" && "Monitoreo en tiempo real de la convivencia y el rendimiento escolar institucional."}
            </p>
          </div>
        </div>
      </div>

      {renderDashboardPanel()}
    </div>
  )
}
