"use client"

import { useState, useEffect } from "react"
import { StatCards } from "@/components/dashboard/StatCards"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ClipboardList, LineChart as LineIcon, Eye } from "lucide-react"
import Link from "next/link"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { Incidencia } from "@/types"
import { format, parseISO, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts"

interface DocentePanelProps {
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

export function DocentePanel({
  isDark,
  gridStroke,
  textStroke,
  lineStroke,
  lineDotFill,
  tooltipBg,
  tooltipBorder,
  tooltipLabel,
  tooltipItem
}: DocentePanelProps) {
  const { user } = useSupabaseAuth()
  const [recentIncidents, setRecentIncidents] = useState<Incidencia[]>([])
  const [sectionIncidents, setSectionIncidents] = useState<Incidencia[]>([])
  const [lineChartData, setLineChartData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true;
    
    async function loadDocenteData() {
      if (!user) return;
      setIsLoading(true);
      try {
        // 1. Fetch personal incidents (last 90 days)
        const ninetyDaysAgo = format(subDays(new Date(), 90), "yyyy-MM-dd");
        const { data: incidents, error: incError } = await supabase
          .from('incidencias')
          .select('id, alumno_id, alumno_nombre, alumno_grado, alumno_seccion, tipo, descripcion, severidad, fecha, registrado_por')
          .eq('registrador_user_id', user.id)
          .gte('fecha', ninetyDaysAgo)
          .order('created_at', { ascending: false });

        if (incError) throw incError;

        let mappedIncidents: Incidencia[] = [];
        if (incidents) {
          mappedIncidents = incidents.map((i: any) => ({
            id: i.id,
            alumnoId: i.alumno_id,
            alumnoNombre: i.alumno_nombre,
            alumnoGrado: i.alumno_grado,
            alumnoSeccion: i.alumno_seccion,
            tipo: i.tipo,
            descripcion: i.descripcion,
            severidad: i.severidad,
            fecha: i.fecha,
            registradoPor: i.registrado_por || ""
          }));
        }

        // 2. Fetch recent reports for students in the teacher's assigned tutor section.
        let mappedSectionIncidents: Incidencia[] = [];
        if (user.tutor_grado && user.tutor_seccion && mounted) {
          const { data: sectionData, error: sectionError } = await supabase
            .from('incidencias')
            .select('id, alumno_id, alumno_nombre, alumno_grado, alumno_seccion, tipo, descripcion, severidad, fecha, fecha_suceso, registrado_por')
            .eq('alumno_grado', user.tutor_grado)
            .eq('alumno_seccion', user.tutor_seccion)
            .gte('fecha', ninetyDaysAgo)
            .order('created_at', { ascending: false })
            .limit(8);

          if (sectionError) throw sectionError;

          if (sectionData) {
            mappedSectionIncidents = sectionData.map((i: any) => ({
              id: i.id,
              alumnoId: i.alumno_id,
              alumnoNombre: i.alumno_nombre,
              alumnoGrado: i.alumno_grado,
              alumnoSeccion: i.alumno_seccion,
              tipo: i.tipo,
              descripcion: i.descripcion,
              severidad: i.severidad,
              fecha: i.fecha_suceso || i.fecha,
              registradoPor: i.registrado_por || ""
            }));
          }
        }

        if (mounted) {
          setRecentIncidents(mappedIncidents.slice(0, 5));
          setSectionIncidents(mappedSectionIncidents);

          // 3. Compute chart data for teacher's own report volume (last 7 days)
          const dateMap: { [key: string]: number } = {}
          for (let i = 6; i >= 0; i--) {
            const dayKey = format(subDays(new Date(), i), "yyyy-MM-dd")
            dateMap[dayKey] = 0
          }

          mappedIncidents.forEach(inc => {
            const dayKey = inc.fecha
            if (dateMap[dayKey] !== undefined) {
              dateMap[dayKey] += 1
            }
          })

          const lineData = Object.keys(dateMap).map(key => ({
            fecha: format(parseISO(key), "dd MMM", { locale: es }),
            reportes: dateMap[key]
          }))

          setLineChartData(lineData);
        }
      } catch (err) {
        console.error("Error loading Docente dashboard data", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadDocenteData();
    return () => { mounted = false; };
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Quick Stat Cards */}
      <StatCards />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Line Chart for Teacher's Reports */}
        <Card className="border border-slate-200/60 bg-white/75 dark:border-[#35445f] dark:bg-[#111827] backdrop-blur-lg shadow-lg dark:shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-[#35445f] dark:bg-[#163849]">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <LineIcon size={16} className="text-primary" />
                Mis Reportes (Últimos 7 Días)
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-400 dark:text-slate-300 font-semibold">Tus registros diarios en el sistema.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {lineChartData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={26}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                    <XAxis dataKey="fecha" stroke={textStroke} fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                    <YAxis stroke={textStroke} fontSize={11} fontWeight={600} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: tooltipBg, borderRadius: '12px', border: '1px solid ' + tooltipBorder }}
                      labelStyle={{ fontWeight: 'bold', color: tooltipLabel }}
                      itemStyle={{ color: tooltipItem }}
                    />
                    <Bar dataKey="reportes" fill="hsl(var(--primary))" radius={[8, 8, 3, 3]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-slate-400 text-sm italic font-medium">
                Sin datos de reportes recientes.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teacher's Recent Incidents list */}
        <Card className="border border-slate-200/60 bg-white/75 dark:border-[#35445f] dark:bg-[#111827] backdrop-blur-lg shadow-lg dark:shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-[#35445f] dark:bg-[#1d2940]">
            <div>
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <ClipboardList size={16} className="text-primary" />
                Mis Incidencias Recientes
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-400 dark:text-slate-300 font-semibold">Los últimos 5 reportes creados por ti.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-xs font-bold" asChild>
              <Link href="/incidents">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentIncidents.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.06]">
                {recentIncidents.map((inc) => (
                  <div key={inc.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-white/[0.01]">
                    <div className="space-y-1 overflow-hidden">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block truncate">
                        {inc.alumnoNombre}
                      </span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {inc.alumnoGrado} {inc.alumnoSeccion}
                        </span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300">{inc.tipo}</span>
                      </div>
                    </div>
                    <Badge className={cn("text-[9px] px-1.5 uppercase font-bold shrink-0", 
                      inc.severidad === 'alto' ? 'bg-red-500/10 text-red-700' :
                      inc.severidad === 'medio' ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700'
                    )}>
                      {inc.severidad}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm italic font-medium">
                Aún no has registrado ninguna incidencia.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tutor section recent reports */}
      <Card className="border border-slate-200/60 bg-white/75 dark:border-[#35445f] dark:bg-[#111827] backdrop-blur-lg shadow-lg dark:shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-[#35445f] bg-transparent dark:bg-[#2b2334] py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                <Eye className="text-primary" size={18} />
                Seguimiento de mi sección
              </CardTitle>
              <CardDescription className="text-[11px] text-slate-400 dark:text-slate-300 font-semibold">
                {user?.tutor_grado && user?.tutor_seccion
                  ? `Reportes recientes de ${user.tutor_grado} ${user.tutor_seccion}.`
                  : "Aún no tienes una sección de tutoría asignada."}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-xs font-bold" asChild>
              <Link href="/incidents">Ver historial</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {sectionIncidents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {sectionIncidents.map((incident) => (
                <div key={incident.id} className="p-4 border rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/50 dark:border-white/[0.06] hover:bg-white dark:hover:bg-white/[0.06] transition-all duration-300">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm block">
                        {incident.alumnoNombre}
                      </span>
                      <span className={cn("inline-flex text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase border",
                        incident.severidad === 'alto' || incident.severidad === 'grave'
                          ? 'bg-red-500/10 text-red-700 border-red-500/20'
                          : incident.severidad === 'medio' || incident.severidad === 'moderada'
                            ? 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                      )}>
                        {incident.severidad}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold ml-2">{incident.tipo}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500" asChild>
                      <Link href={`/students/${incident.alumnoId}`}>Ver ficha</Link>
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-355 font-medium mt-2 leading-relaxed bg-white/40 dark:bg-black/10 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                    {incident.descripcion}
                  </p>
                  <div className="mt-3 flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">{format(parseISO(incident.fecha), "dd MMM, HH:mm", { locale: es })}</span>
                    <span className="text-slate-400 font-medium">Registrado por: {incident.registradoPor}</span>
                    <Button variant="link" size="sm" className="h-auto p-0 font-bold" asChild>
                      <Link href={`/students/${incident.alumnoId}`}>Historial</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm italic font-medium">
              No hay reportes recientes de tu sección asignada.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
