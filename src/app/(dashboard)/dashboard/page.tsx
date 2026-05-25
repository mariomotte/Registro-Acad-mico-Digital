"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { StatCards } from "@/components/dashboard/StatCards"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Zap, BarChart3, PieChart as PieIcon, LineChart as LineIcon } from "lucide-react"
import Link from "next/link"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { Alerta } from "@/types"
import { format, parseISO, subDays } from "date-fns"
import { es } from "date-fns/locale"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

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

  const [alerts, setAlerts] = useState<Alerta[]>([])
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true)
  
  // Chart Data States
  const [lineChartData, setLineChartData] = useState<any[]>([])
  const [pieChartData, setPieChartData] = useState<any[]>([])
  const [isChartsLoading, setIsChartsLoading] = useState(true)

  useEffect(() => {
    let mounted = true;
    
    async function loadDashboardData() {
      if (!user) return;
      
      // 1. Fetch Alerts
      try {
        const { data, error } = await supabase
          .from('alertas')
          .select('id, alumno_id, alumno_nombre, tipo, nivel, mensaje, fecha, leido, accion_requerida')
          .eq('leido', false)
          .order('fecha', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        
        if (data && mounted) {
          setAlerts(data.map((a: any) => ({
            id: a.id,
            alumnoId: a.alumno_id,
            alumnoNombre: a.alumno_nombre,
            tipo: a.tipo,
            nivel: a.nivel,
            mensaje: a.mensaje,
            fecha: a.fecha,
            leido: a.leido,
            accionRequerida: a.accion_requerida
          })));
        }
      } catch (err) {
        console.error("Error fetching alerts", err);
      } finally {
        if (mounted) setIsLoadingAlerts(false);
      }

      // 2. Fetch Incidents for Chart aggregates
      try {
        const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd")
        const { data: incidents, error: incError } = await supabase
          .from('incidencias')
          .select('fecha, tipo')
          .gte('fecha', thirtyDaysAgo)
          .order('fecha', { ascending: true })

        if (incError) throw incError

        if (incidents && mounted) {
          // A. Line Chart: Last 7 Days Volume
          const dateMap: { [key: string]: number } = {}
          // Initialize last 7 days
          for (let i = 6; i >= 0; i--) {
            const dayKey = format(subDays(new Date(), i), "yyyy-MM-dd")
            dateMap[dayKey] = 0
          }

          incidents.forEach(inc => {
            const dayKey = inc.fecha
            if (dateMap[dayKey] !== undefined) {
              dateMap[dayKey] += 1
            }
          })

          const lineData = Object.keys(dateMap).map(key => ({
            fecha: format(parseISO(key), "dd MMM", { locale: es }),
            reportes: dateMap[key]
          }))

          setLineChartData(lineData)

          // B. Donut Chart: Types distribution
          const typeMap: { [key: string]: number } = {}
          incidents.forEach(inc => {
            typeMap[inc.tipo] = (typeMap[inc.tipo] || 0) + 1
          })

          const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#ec4899']
          const pieData = Object.keys(typeMap).map((type, idx) => ({
            name: type,
            value: typeMap[type],
            color: colors[idx % colors.length]
          }))

          setPieChartData(pieData)
        }
      } catch (err) {
        console.error("Error aggregating charts", err)
      } finally {
        if (mounted) setIsChartsLoading(false)
      }
    }
    
    if (!isUserLoading) {
      loadDashboardData();
    }
    
    return () => { mounted = false; };
  }, [user, isUserLoading]);

  if (isUserLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 relative">
      {/* Background ambient glowing shapes for glassmorphism */}
      <div className="absolute top-10 left-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-1/4 w-[350px] h-[350px] bg-accent/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-headline uppercase bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Panel de Control
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Monitoreo en tiempo real de la convivencia y el rendimiento escolar.</p>
        </div>
      </div>

      <StatCards />

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border border-slate-200/60 bg-white/75 dark:border-white/[0.08] dark:bg-white/[0.03] backdrop-blur-lg shadow-lg dark:shadow-2xl shadow-slate-100/40 dark:shadow-black/20 rounded-2xl overflow-hidden hover:shadow-xl dark:hover:shadow-black/40 hover:bg-white/90 dark:hover:bg-white/[0.04] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08] bg-transparent">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <LineIcon size={16} className="text-primary" />
                Flujo de Reportes (Últimos 7 Días)
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-400 font-semibold">Cantidad de incidencias registradas diariamente.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isChartsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" />
              </div>
            ) : lineChartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="fecha" stroke={textStroke} fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                    <YAxis stroke={textStroke} fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: tooltipBg, borderRadius: '12px', border: '1px solid ' + tooltipBorder, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: tooltipLabel }}
                      itemStyle={{ color: tooltipItem }}
                    />
                    <Line type="monotone" dataKey="reportes" stroke={lineStroke} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: lineDotFill }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-slate-400 text-sm italic font-medium">
                Sin datos de reportes recientes.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/60 bg-white/75 dark:border-white/[0.08] dark:bg-white/[0.03] backdrop-blur-lg shadow-lg dark:shadow-2xl shadow-slate-100/40 dark:shadow-black/20 rounded-2xl overflow-hidden hover:shadow-xl dark:hover:shadow-black/40 hover:bg-white/90 dark:hover:bg-white/[0.04] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08] bg-transparent">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <PieIcon size={16} className="text-primary" />
                Categorías de Incidencias
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-400 font-semibold">Distribución porcentual por tipo de reporte.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isChartsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400 dark:text-slate-500" />
              </div>
            ) : pieChartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke={isDark ? "#090d16" : "#ffffff"} strokeWidth={1.5} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: tooltipBg, borderRadius: '12px', border: '1px solid ' + tooltipBorder }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={40} 
                      iconType="circle"
                      iconSize={6}
                      formatter={(value) => <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-slate-400 text-sm italic font-medium">
                Sin datos de categorías.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid gap-6 grid-cols-1">
        <Card className="border border-slate-200/60 bg-white/75 dark:border-white/[0.08] dark:bg-white/[0.03] backdrop-blur-lg shadow-lg dark:shadow-2xl shadow-slate-100/40 dark:shadow-black/20 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 dark:border-white/[0.08] bg-transparent py-4">
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              <AlertCircle className="text-red-500 dark:text-red-400 animate-pulse" size={18} />
              Alertas Prioritarias Activas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {isLoadingAlerts ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400 dark:text-slate-500" />
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border border-slate-200/50 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-white/[0.06] hover:border-slate-250 dark:hover:border-white/[0.12] hover:shadow-md dark:hover:shadow-black/20 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      {/* Pulse Circle Indicator */}
                      <span className="relative flex h-3 w-3 shrink-0">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          alert.nivel === 'rojo' ? 'bg-red-400' : alert.nivel === 'amarillo' ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}></span>
                        <span className={`relative inline-flex rounded-full h-3 w-3 ${
                          alert.nivel === 'rojo' ? 'bg-red-500' : alert.nivel === 'amarillo' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></span>
                      </span>
                      
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-primary transition-colors truncate">
                          {alert.alumnoNombre}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            alert.nivel === 'rojo' ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' : 
                            alert.nivel === 'amarillo' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' : 
                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {alert.nivel.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">{alert.tipo}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary rounded-lg shrink-0" asChild>
                      <Link href={`/students/${alert.alumnoId}`}>
                        <Zap size={14} className="text-amber-500" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm italic font-medium">
                Sin alertas críticas pendientes.
              </div>
            )}
            <Button variant="outline" className="w-full mt-2 text-xs font-bold py-5 bg-white/50 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors" asChild>
              <Link href="/alerts">Ver todas las alertas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}