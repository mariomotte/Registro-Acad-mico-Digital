"use client"

import { useState, useEffect } from "react"
import { StatCards } from "@/components/dashboard/StatCards"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Loader2, BarChart3, PieChart as PieIcon, LineChart as LineIcon, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { format, parseISO, subDays } from "date-fns"
import { es } from "date-fns/locale"
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

interface DirectivoPanelProps {
  isDark: boolean
  gridStroke: string
  textStroke: string
  lineStroke: string
  lineDotFill: string
  tooltipBg: string
  tooltipBorder: string
  tooltipLabel: string
  tooltipItem: string
}

export function DirectivoPanel({
  isDark,
  gridStroke,
  textStroke,
  lineStroke,
  lineDotFill,
  tooltipBg,
  tooltipBorder,
  tooltipLabel,
  tooltipItem
}: DirectivoPanelProps) {
  const { user } = useSupabaseAuth()
  const [lineChartData, setLineChartData] = useState<any[]>([])
  const [pieChartData, setPieChartData] = useState<any[]>([])
  const [reincidenceSummary, setReincidenceSummary] = useState<any[]>([])
  const [isChartsLoading, setIsChartsLoading] = useState(true)
  useEffect(() => {
    let mounted = true;
    
    async function loadData() {
      if (!user) return;
      
      // Fetch Incidents and Alerts for chart aggregates (last 30 days)
      try {
        const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd")
        const [{ data: incidents, error: incError }, { data: alertRows, error: alertChartError }] = await Promise.all([
          supabase
          .from('incidencias')
          .select('alumno_id, alumno_nombre, alumno_grado, alumno_seccion, fecha, tipo')
          .gte('fecha', thirtyDaysAgo)
            .order('fecha', { ascending: true }),
          supabase
            .from('alertas')
            .select('fecha')
            .gte('fecha', thirtyDaysAgo)
            .order('fecha', { ascending: true })
        ])

        if (incError) throw incError
        if (alertChartError) throw alertChartError

        if (incidents && mounted) {
          // A. Line Chart: Last 7 Days Volume
          const dateMap: { [key: string]: number } = {}
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

          const alertDateMap: { [key: string]: number } = {}
          Object.keys(dateMap).forEach(key => {
            alertDateMap[key] = 0
          })
          ;(alertRows || []).forEach((alert: any) => {
            const dayKey = String(alert.fecha).slice(0, 10)
            if (alertDateMap[dayKey] !== undefined) {
              alertDateMap[dayKey] += 1
            }
          })

          const lineData = Object.keys(dateMap).map(key => ({
            fecha: format(parseISO(key), "dd MMM", { locale: es }),
            reportes: dateMap[key],
            alertas: alertDateMap[key]
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

          // C. Reincidence Breakdown (Highest counts first)
          const studentMap: { [key: string]: {
            alumnoId: string;
            alumnoNombre: string;
            grado: string;
            seccion: string;
            totalIncidents: number;
            typeCounts: { [key: string]: number };
          }} = {};

          incidents.forEach(inc => {
            const studentIdKey = String(inc.alumno_id);
            if (!studentMap[studentIdKey]) {
              studentMap[studentIdKey] = {
                alumnoId: studentIdKey,
                alumnoNombre: inc.alumno_nombre,
                grado: inc.alumno_grado || "",
                seccion: inc.alumno_seccion || "",
                totalIncidents: 0,
                typeCounts: {}
              };
            }
            const st = studentMap[studentIdKey];
            st.totalIncidents += 1;
            st.typeCounts[inc.tipo] = (st.typeCounts[inc.tipo] || 0) + 1;
          });

          const reincidencesList = Object.keys(studentMap).map(id => {
            const st = studentMap[id];
            let maxType = "...";
            let maxCount = 0;
            Object.keys(st.typeCounts).forEach(t => {
              if (st.typeCounts[t] > maxCount) {
                maxCount = st.typeCounts[t];
                maxType = t;
              }
            });

            return {
              alumnoId: id,
              alumnoNombre: st.alumnoNombre,
              grado: st.grado,
              seccion: st.seccion,
              totalIncidents: st.totalIncidents,
              tipoMasFrecuente: maxType
            };
          });

          const sortedReincidences = reincidencesList
            .sort((a, b) => b.totalIncidents - a.totalIncidents)
            .filter(r => r.totalIncidents >= 2)
            .slice(0, 5);

          setReincidenceSummary(sortedReincidences);
        }
      } catch (err) {
        console.error("Error aggregating charts", err)
      } finally {
        if (mounted) setIsChartsLoading(false)
      }
    }
    
    loadData();
    
    return () => { mounted = false; };
  }, [user]);

  return (
    <div className="space-y-8">
      <StatCards />

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden border-teal-900/10 bg-surface-container-lowest shadow-sm dark:border-[#35445f] dark:bg-[#111827]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-teal-900/10 bg-teal-50/80 pb-4 dark:border-[#35445f] dark:bg-[#163849]">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <LineIcon size={16} className="text-primary" />
                Reportes y Alertas (Ultimos 7 Dias)
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-400 dark:text-slate-300 font-semibold">Barras de incidencias con linea de alertas generadas.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isChartsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : lineChartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="fecha" stroke={textStroke} fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                    <YAxis stroke={textStroke} fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: tooltipBg, borderRadius: '12px', border: '1px solid ' + tooltipBorder }}
                      labelStyle={{ fontWeight: 'bold', color: tooltipLabel }}
                      itemStyle={{ color: tooltipItem }}
                    />
                    <Bar dataKey="reportes" name="Reportes" fill="hsl(var(--primary))" radius={[8, 8, 2, 2]} barSize={24} />
                    <Line type="monotone" dataKey="alertas" name="Alertas" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: lineDotFill }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-slate-400 text-sm italic font-medium">
                Sin datos de reportes recientes.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-indigo-900/10 bg-surface-container-lowest shadow-sm dark:border-[#35445f] dark:bg-[#111827]">
          <CardHeader className="flex flex-row items-center justify-between border-b border-indigo-900/10 bg-indigo-50/80 pb-4 dark:border-[#35445f] dark:bg-[#1d2940]">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <PieIcon size={16} className="text-primary" />
                Categorías de Incidencias
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-400 dark:text-slate-300 font-semibold">Distribución porcentual por tipo de reporte.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isChartsLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
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
                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderRadius: '12px', border: '1px solid ' + tooltipBorder }} />
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

      {/* Resumen de Reincidencia Conductual */}
      <Card className="overflow-hidden border-red-900/10 bg-surface-container-lowest shadow-sm dark:border-[#35445f] dark:bg-[#111827]">
        <CardHeader className="border-b border-red-900/10 bg-red-50/80 py-4 dark:border-[#35445f] dark:bg-[#2b2334]">
          <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            <BarChart3 className="text-primary" size={18} />
            Resumen de Reincidencia Conductual (Últimos 30 Días)
          </CardTitle>
          <CardDescription className="text-xs">
            Alumnos con múltiples registros, ordenados por nivel de reincidencia.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isChartsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : reincidenceSummary.length > 0 ? (
            <div className="space-y-4 p-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reincidenceSummary} layout="vertical" barSize={22} margin={{ top: 10, right: 18, left: 16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} stroke={textStroke} fontSize={11} />
                    <YAxis type="category" dataKey="alumnoNombre" tickLine={false} axisLine={false} stroke={textStroke} fontSize={11} width={150} />
                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderRadius: '12px', border: '1px solid ' + tooltipBorder }} />
                    <Bar dataKey="totalIncidents" name="Reportes" fill="#ef4444" radius={[3, 8, 8, 3]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {reincidenceSummary.map((r) => (
                  <Link key={r.alumnoId} href={`/students/${r.alumnoId}`} className="flex items-center justify-between rounded-lg border border-red-500/15 bg-red-500/10 p-3 text-xs font-semibold text-red-800 hover:bg-red-500/15 dark:text-red-200">
                    <span className="truncate">{r.grado} {r.seccion} - {r.tipoMasFrecuente}</span>
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm italic font-medium">
              No se registran alumnos con reincidencia (2 o más reportes) en los últimos 30 días.
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
