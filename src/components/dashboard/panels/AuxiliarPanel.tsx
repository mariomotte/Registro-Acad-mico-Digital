"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Clock, UserX, AlertTriangle, AlertCircle, Eye, Check, Bell, Bot, ArrowRight, ClipboardList } from "lucide-react"
import Link from "next/link"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { Incidencia, Alerta, CasoPrioritario } from "@/types"
import { format, parseISO, subDays } from "date-fns"
import { es } from "date-fns/locale"
import { summarizeStudentAlerts } from "@/ai/flows/summarize-student-alerts"
import { cn } from "@/lib/utils"
import { evaluateStudentRisk } from "@/lib/alerts-engine"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export function AuxiliarPanel() {
  const { user } = useSupabaseAuth()
  const userId = user?.id
  const router = useRouter()
  const [todayIncidents, setTodayIncidents] = useState<Incidencia[]>([])
  const [alerts, setAlerts] = useState<Alerta[]>([])
  const [priorityCases, setPriorityCases] = useState<CasoPrioritario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUnreadModalOpen, setIsUnreadModalOpen] = useState(false)

  // Estados para IA
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [isSummarizing, setIsSummarizing] = useState<Record<string, boolean>>({})

  const getAuxiliarActionText = (action?: string) => {
    if (!action) return "";

    const normalized = action.toLowerCase();
    if (
      normalized.includes("psicolog") ||
      normalized.includes("dirección") ||
      normalized.includes("direccion") ||
      normalized.includes("subdirector") ||
      normalized.includes("derivar")
    ) {
      return "Revisar el caso, registrar la intervención inicial y coordinar con el apoderado si corresponde.";
    }

    return action;
  }

  useEffect(() => {
    let mounted = true;
    
    async function loadAuxiliarData() {
      if (!userId) return;
      setIsLoading(true);
      try {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
        
        const [incidentsRes, alertsRes, recentIncidentsRes] = await Promise.all([
          supabase
            .from('incidencias')
            .select('id, alumno_id, alumno_nombre, alumno_grado, alumno_seccion, tipo, descripcion, severidad, fecha, registrado_por, registrador_user_id, fecha_suceso')
            .eq('fecha', todayStr)
            .order('created_at', { ascending: false }),
          supabase
            .from('alertas')
            .select('id, alumno_id, alumno_nombre, tipo, nivel, mensaje, fecha, leido, accion_requerida')
            .eq('leido', false)
            .order('nivel', { ascending: true }) // rojo, amarillo, verde ord.
            .limit(10),
          supabase
            .from('incidencias')
            .select('id, alumno_id, alumno_nombre, alumno_grado, alumno_seccion, tipo, descripcion, severidad, fecha, registrado_por, registrador_user_id, fecha_suceso')
            .gte('fecha', thirtyDaysAgo)
            .order('fecha', { ascending: false })
        ]);

        if (incidentsRes.error) throw incidentsRes.error;
        if (alertsRes.error) throw alertsRes.error;
        if (recentIncidentsRes.error) throw recentIncidentsRes.error;

        if (mounted) {
          setTodayIncidents(incidentsRes.data.map((i: any) => ({
            id: i.id,
            alumnoId: String(i.alumno_id),
            alumnoNombre: i.alumno_nombre,
            alumnoGrado: i.alumno_grado,
            alumnoSeccion: i.alumno_seccion,
            tipo: i.tipo,
            descripcion: i.descripcion,
            severidad: i.severidad,
            fecha: i.fecha,
            registradoPor: i.registrado_por
          })));

          const fetchedAlerts = alertsRes.data.map((a: any) => ({
            id: a.id,
            alumnoId: String(a.alumno_id),
            alumnoNombre: a.alumno_nombre,
            tipo: a.tipo,
            nivel: a.nivel,
            mensaje: a.mensaje,
            fecha: a.fecha,
            leido: a.leido,
            accionRequerida: a.accion_requerida
          }));
          setAlerts(fetchedAlerts);

          // Activar modal si hay alertas pendientes y es el primer ingreso en esta sesión
          if (fetchedAlerts.length > 0 && !sessionStorage.getItem('auxiliarAlertsModalShown')) {
            setIsUnreadModalOpen(true);
            sessionStorage.setItem('auxiliarAlertsModalShown', 'true');
          }

          if (recentIncidentsRes.data) {
            const incidentsByStudent: { [key: string]: {
              alumnoNombre: string;
              grado: string;
              seccion: string;
              incidents: any[];
            }} = {};

            recentIncidentsRes.data.forEach((i: any) => {
              const studentIdKey = String(i.alumno_id);
              if (!incidentsByStudent[studentIdKey]) {
                incidentsByStudent[studentIdKey] = {
                  alumnoNombre: i.alumno_nombre,
                  grado: i.alumno_grado || "",
                  seccion: i.alumno_seccion || "",
                  incidents: []
                };
              }
              incidentsByStudent[studentIdKey].incidents.push({
                id: i.id,
                alumnoId: String(i.alumno_id),
                alumnoNombre: i.alumno_nombre,
                alumnoGrado: i.alumno_grado,
                alumnoSeccion: i.alumno_seccion,
                tipo: i.tipo,
                descripcion: i.descripcion,
                severidad: i.severidad,
                fecha: i.fecha,
                fecha_suceso: i.fecha_suceso,
                registradoPor: i.registrado_por,
                registradorUserId: i.registrador_user_id
              });
            });

            const cases = Object.keys(incidentsByStudent).map(studentId => {
              const data = incidentsByStudent[studentId];
              return evaluateStudentRisk(
                studentId,
                data.alumnoNombre,
                data.grado,
                data.seccion,
                data.incidents
              );
            });

            const priorityScore = { alta: 3, media: 2, baja: 1 };
            const sortedCases = cases.sort((a, b) => {
              const scoreDiff = priorityScore[b.prioridad] - priorityScore[a.prioridad];
              if (scoreDiff !== 0) return scoreDiff;
              return new Date(b.ultimaFecha).getTime() - new Date(a.ultimaFecha).getTime();
            });

            setPriorityCases(sortedCases);
          }
        }
      } catch (err) {
        console.error("Error loading Auxiliar data", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadAuxiliarData();
    return () => { mounted = false; };
  }, [userId]);

  // Realtime subscription for alerts list update in dashboard
  useEffect(() => {
    if (!userId) return;
    
    const channel = supabase
      .channel('dashboard-alerts-auxiliar')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alertas'
        },
        (payload) => {
          const newAlert = payload.new;
          if (newAlert && !newAlert.leido) {
            setAlerts(prev => {
              if (prev.some(a => a.id === newAlert.id)) return prev;
              const mapped = {
                id: newAlert.id,
                alumnoId: String(newAlert.alumno_id),
                alumnoNombre: newAlert.alumno_nombre,
                tipo: newAlert.tipo,
                nivel: newAlert.nivel,
                mensaje: newAlert.mensaje,
                fecha: newAlert.fecha,
                leido: newAlert.leido,
                accionRequerida: newAlert.accion_requerida
              };
              
              const updated = [mapped, ...prev];
              const levelPriority: Record<string, number> = { rojo: 1, amarillo: 2, verde: 3 };
              return updated.sort((a, b) => {
                const priorityA = levelPriority[a.nivel?.toLowerCase()] || 4;
                const priorityB = levelPriority[b.nivel?.toLowerCase()] || 4;
                return priorityA - priorityB;
              }).slice(0, 10);
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alertas'
        },
        (payload) => {
          const updatedAlert = payload.new;
          if (updatedAlert && (updatedAlert.leido || updatedAlert.estado === 'leida')) {
            setAlerts(prev => prev.filter(a => a.id !== updatedAlert.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('alertas').update({ leido: true, estado: 'leida' }).eq('id', id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error("Error marking alert as read", error);
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = alerts.map(a => a.id);
      if (unreadIds.length === 0) return;
      await supabase.from('alertas').update({ leido: true, estado: 'leida' }).in('id', unreadIds);
      setAlerts([]);
      setIsUnreadModalOpen(false);
    } catch (error) {
      console.error("Error marking all alerts as read", error);
    }
  }

  const goToStudentHistory = (alumnoId: string) => {
    setIsUnreadModalOpen(false)
    router.push(`/students/${alumnoId}`)
  }

  const generateSummary = async (alumnoId: string, alumnoNombre: string, motivoAlerta: string) => {
    setIsSummarizing(prev => ({ ...prev, [alumnoId]: true }));
    try {
      const ninetyDaysAgo = format(subDays(new Date(), 90), "yyyy-MM-dd");
      const { data: incidentData } = await supabase
        .from('incidencias')
        .select('tipo, severidad, fecha, descripcion')
        .eq('alumno_id', alumnoId)
        .gte('fecha', ninetyDaysAgo);

      const incidentsText = incidentData?.map(i => 
        `[${i.fecha}] ${i.tipo} (${i.severidad}): ${i.descripcion}`
      ).join('\n') || "No hay incidencias registradas recientemente.";

      const response = await summarizeStudentAlerts({
        studentName: alumnoNombre,
        alertReason: motivoAlerta,
        incidentsData: incidentsText
      });

      setSummaries(prev => ({ ...prev, [alumnoId]: response.summary }));
    } catch (error) {
      console.error("Error generating summary", error);
    } finally {
      setIsSummarizing(prev => ({ ...prev, [alumnoId]: false }));
    }
  }

  // Agrupaciones de incidencias de hoy
  const totalHoy = todayIncidents.length;
  const tardanzasHoy = todayIncidents.filter(i => i.tipo === 'Tardanza').length;
  const inasistenciasHoy = todayIncidents.filter(i => i.tipo === 'Inasistencia').length;
  const otrasHoy = totalHoy - tardanzasHoy - inasistenciasHoy;
  const typeBreakdown = [
    { tipo: "Tardanzas", total: tardanzasHoy, fill: "#10b981" },
    { tipo: "Inasistencias", total: inasistenciasHoy, fill: "#f59e0b" },
    { tipo: "Otras", total: otrasHoy, fill: "#ef4444" },
  ];
  const priorityBreakdown = [
    { prioridad: "Alta", total: priorityCases.filter(c => c.prioridad === "alta").length, fill: "#ef4444" },
    { prioridad: "Media", total: priorityCases.filter(c => c.prioridad === "media").length, fill: "#f59e0b" },
    { prioridad: "Baja", total: priorityCases.filter(c => c.prioridad === "baja").length, fill: "#10b981" },
  ];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { title: "Registrar reportes", desc: "Tardanzas, inasistencias e incidencias", href: "/incidents/new", icon: ClipboardList, className: "bg-teal-700 border-teal-600 text-white dark:bg-teal-950 dark:border-teal-800" },
          { title: "Ver alertas", desc: `${alerts.length} pendientes de revision`, href: "/alerts", icon: Bell, className: "bg-red-600 border-red-500 text-white dark:bg-red-950 dark:border-red-800" },
          { title: "Buscar alumnos", desc: "Abrir fichas y seguimiento", href: "/students", icon: Eye, className: "bg-slate-700 border-slate-600 text-white dark:bg-slate-900 dark:border-slate-700" },
        ].map((item) => (
          <Link key={item.title} href={item.href} className={cn("group flex items-center justify-between rounded-xl border p-4 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl", item.className)}>
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-white/20 bg-white/15 p-2.5">
                <item.icon size={18} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-wide">{item.title}</p>
                <p className="text-xs font-semibold text-current/75">{item.desc}</p>
              </div>
            </div>
            <ArrowRight size={16} className="opacity-70 transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </div>

      {/* Tarjetas de Convivencia de Hoy */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-600 bg-emerald-700 text-white shadow-lg shadow-emerald-950/10 dark:bg-emerald-950 dark:border-emerald-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Tardanzas de Hoy</span>
              <div className="text-3xl font-black mt-1">{tardanzasHoy}</div>
            </div>
            <div className="p-3 bg-white/15 text-white rounded-xl border border-white/20">
              <Clock size={20} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-amber-400 bg-amber-500 text-amber-950 shadow-lg shadow-amber-950/10 dark:bg-amber-700 dark:text-white dark:border-amber-600">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-current/70 uppercase tracking-wider">Inasistencias de Hoy</span>
              <div className="text-3xl font-black mt-1">{inasistenciasHoy}</div>
            </div>
            <div className="p-3 bg-white/25 text-current rounded-xl border border-white/25">
              <UserX size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500 bg-red-600 text-white shadow-lg shadow-red-950/10 dark:bg-red-950 dark:border-red-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Otras Incidencias (Hoy)</span>
              <div className="text-3xl font-black mt-1">{otrasHoy}</div>
            </div>
            <div className="p-3 bg-white/15 text-white rounded-xl border border-white/20">
              <AlertTriangle size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-teal-900/10 bg-card shadow-sm dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Distribucion del dia</CardTitle>
            <CardDescription className="text-xs">Lectura rapida por tipo de reporte.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeBreakdown} barSize={28} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="tipo" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "10px" }} />
                <Bar dataKey="total" radius={[8, 8, 3, 3]}>
                  {typeBreakdown.map((entry) => (
                    <Cell key={entry.tipo} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border border-teal-900/10 bg-card shadow-sm dark:border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Prioridad de casos</CardTitle>
            <CardDescription className="text-xs">Cantidad de alumnos por nivel de atencion.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityBreakdown} layout="vertical" barSize={24} margin={{ top: 10, right: 18, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
                <YAxis type="category" dataKey="prioridad" tickLine={false} axisLine={false} fontSize={11} width={54} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "10px" }} />
                <Bar dataKey="total" radius={[3, 8, 8, 3]}>
                  {priorityBreakdown.map((entry) => (
                    <Cell key={entry.prioridad} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Casos de Atención Prioritaria */}
      <Card className="border border-slate-200/60 bg-white/75 dark:border-white/[0.08] dark:bg-white/[0.03] rounded-2xl shadow-sm">
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <AlertTriangle className="text-red-500 animate-pulse" size={18} />
            Casos de Atención Prioritaria
          </CardTitle>
          <CardDescription className="text-xs">
            Estudiantes priorizados según el motor de reglas de reincidencia y gravedad.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {priorityCases.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-[300px] overflow-y-auto">
              {priorityCases.map((c) => (
                <div key={c.alumnoId} className="p-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1 overflow-hidden">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block">
                      {c.alumnoNombre}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                      <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold">
                        {c.grado} {c.seccion}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        Última actividad: {format(parseISO(c.ultimaFecha), "dd MMM, HH:mm", { locale: es })}
                      </span>
                    </div>
                    {/* Motivos */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {c.motivos.map((motivo, idx) => (
                        <span key={idx} className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-red-200/50 dark:border-red-900/30">
                          {motivo}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge className={cn("text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-full",
                      c.prioridad === 'alta' ? 'bg-red-500 text-white hover:bg-red-600' :
                      c.prioridad === 'media' ? 'bg-amber-500 text-white hover:bg-amber-600' :
                      'bg-emerald-500 text-white hover:bg-emerald-600'
                    )}>
                      Prioridad {c.prioridad}
                    </Badge>
                    <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-lg" asChild>
                      <Link href={`/students/${c.alumnoId}`}>
                        <Eye size={12} className="mr-1" /> Ver Ficha
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm italic font-medium">
              No hay casos prioritarios reportados recientemente.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Incidencias del día */}
        <Card className="border border-slate-200/60 bg-white/75 dark:border-white/[0.08] dark:bg-white/[0.03] rounded-2xl">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <AlertCircle size={18} className="text-primary" />
              Incidencias Reportadas Hoy
            </CardTitle>
            <CardDescription className="text-xs">Registro en tiempo real del día escolar.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {todayIncidents.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.06] max-h-[450px] overflow-y-auto">
                {todayIncidents.map((incident) => (
                  <div key={incident.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-3">
                    <div className="space-y-1 overflow-hidden">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block truncate">
                        {incident.alumnoNombre}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-[10px] font-bold">
                          {incident.alumnoGrado} {incident.alumnoSeccion}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{incident.tipo}</span>
                      </div>
                      <p className="text-xs text-slate-400 italic truncate max-w-sm">{incident.descripcion}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={cn("text-[9px] px-1.5 uppercase font-bold", 
                        incident.severidad === 'alto' ? 'bg-red-500/10 text-red-700' :
                        incident.severidad === 'medio' ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700'
                      )}>
                        {incident.severidad}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" asChild>
                        <Link href={`/students/${incident.alumnoId}`}>
                          <Eye size={14} />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm italic font-medium">
                No hay incidencias reportadas el día de hoy.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alertas y casos prioritarios */}
        <Card className="border border-slate-200/60 bg-white/75 dark:border-white/[0.08] dark:bg-white/[0.03] rounded-2xl">
          <CardHeader className="border-b py-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Bell size={18} className="text-amber-500 animate-bounce" />
              Alertas Activas y Casos Prioritarios
            </CardTitle>
            <CardDescription className="text-xs">Seguimiento de alumnos con dificultades recurrentes.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 max-h-[450px] overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className="p-3 border rounded-xl bg-white/50 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block">{alert.alumnoNombre}</span>
                      <span className={cn("inline-flex text-[8px] font-black uppercase px-1.5 py-0.5 rounded border mt-1",
                        alert.nivel === 'rojo' ? 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20' : 
                        alert.nivel === 'amarillo' ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' : 
                        'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                      )}>
                        {alert.nivel}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-400 ml-2">{alert.tipo}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-primary" asChild>
                      <Link href="/alerts">
                        <ArrowRight size={14} />
                      </Link>
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                    {alert.mensaje}
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1">
                    <span>{format(parseISO(alert.fecha), "dd MMM, HH:mm", { locale: es })}</span>
                    <Button variant="link" size="sm" className="h-auto p-0 text-[10px]" asChild>
                      <Link href={`/students/${alert.alumnoId}`}>Ver Ficha</Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm italic font-medium">
                No hay alertas activas en el sistema.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Alertas No Leídas al ingresar */}
      <Dialog open={isUnreadModalOpen} onOpenChange={setIsUnreadModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col p-6 overflow-hidden bg-slate-950 border border-slate-800 text-slate-100 rounded-xl shadow-2xl">
          <DialogHeader className="space-y-3 pb-4 border-b border-slate-800 flex-shrink-0">
            <DialogTitle className="text-xl font-bold font-headline flex items-center gap-3 text-amber-500">
              <div className="h-9 w-9 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500 animate-pulse">
                <AlertCircle className="h-5 w-5" />
              </div>
              Alertas Pendientes de Revisión
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Debes revisar y tomar conocimiento de las siguientes alertas activas en el sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  role="button"
                  tabIndex={0}
                  onClick={() => goToStudentHistory(alert.alumnoId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      goToStudentHistory(alert.alumnoId)
                    }
                  }}
                  className={cn(
                    "p-4 rounded-lg border flex flex-col justify-between gap-3 transition-all duration-200 hover:scale-[1.01] cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/70",
                    alert.nivel === 'rojo' 
                      ? "bg-rose-950/20 border-rose-900/50 text-rose-200" 
                      : alert.nivel === 'amarillo'
                        ? "bg-amber-950/20 border-amber-900/50 text-amber-200"
                        : "bg-emerald-950/20 border-emerald-900/50 text-emerald-200"
                  )}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{alert.alumnoNombre}</span>
                        <Badge 
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-full",
                            alert.nivel === 'rojo' 
                              ? "bg-red-500/20 text-red-300 border border-red-500/30" 
                              : alert.nivel === 'amarillo'
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          )}
                        >
                          {alert.nivel}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-medium">{alert.mensaje}</p>
                      {getAuxiliarActionText(alert.accionRequerida) && (
                        <p className="text-[11px] text-slate-400 italic mt-1 font-semibold">
                          Acción requerida: {getAuxiliarActionText(alert.accionRequerida)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-800/40">
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {format(parseISO(alert.fecha), "dd MMM, HH:mm", { locale: es })}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-3 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-slate-100 flex items-center gap-1.5 font-bold"
                      onClick={(event) => {
                        event.stopPropagation()
                        markAsRead(alert.id)
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                      He visualizado
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                <div className="h-12 w-12 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">¡Todo al día!</h4>
                  <p className="text-xs text-slate-400 max-w-[280px]">Has visualizado todas las alertas pendientes.</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-slate-800 flex-shrink-0 flex flex-row items-center justify-end gap-2">
            {alerts.length > 0 && (
              <Button 
                variant="default" 
                className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs px-4"
                onClick={markAllAsRead}
              >
                He visualizado todas
              </Button>
            )}
            <Button 
              variant="outline" 
              className="border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-bold"
              onClick={() => setIsUnreadModalOpen(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
