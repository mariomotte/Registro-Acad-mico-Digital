"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertTriangle, Clock, Trash2, Phone, ClipboardList, Loader2, Download, Bot, ShieldAlert, Flame, CheckCircle2, ArrowRight } from "lucide-react"
import { format, parseISO, subDays } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { Incidencia, Alerta } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { summarizeStudentAlerts } from "@/ai/flows/summarize-student-alerts"
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts"

export default function AlertsPage() {
  const { user, loading: isUserLoading } = useSupabaseAuth()
  const [alerts, setAlerts] = useState<Alerta[]>([])
  const [incidences, setIncidences] = useState<Incidencia[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Estados para exportación
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [exportPeriod, setExportPeriod] = useState("semanal")

  // Estados para IA
  const [summaries, setSummaries] = useState<Record<string, string>>({})
  const [isSummarizing, setIsSummarizing] = useState<Record<string, boolean>>({})
  const unreadAlerts = alerts.filter(a => !a.leido)
  const redAlerts = alerts.filter(a => a.nivel === "rojo")
  const attendedAlerts = alerts.filter(a => a.leido)
  const riskSummary = Object.values(
    alerts.reduce((acc: any, alert) => {
      const id = alert.alumnoId || alert.alumnoNombre
      acc[id] = acc[id] || { alumnoId: alert.alumnoId, alumnoNombre: alert.alumnoNombre, rojo: 0, amarillo: 0, verde: 0, total: 0, score: 0 }
      acc[id][alert.nivel] = (acc[id][alert.nivel] || 0) + 1
      acc[id].total += 1
      acc[id].score += alert.nivel === "rojo" ? 5 : alert.nivel === "amarillo" ? 3 : 1
      return acc
    }, {})
  ).sort((a: any, b: any) => b.score - a.score).slice(0, 6)

  const riskGaugeData = [
    { name: "Rojas", value: redAlerts.length, fill: "#e11d48" },
    { name: "Pendientes", value: unreadAlerts.length, fill: "#f59e0b" },
    { name: "Atendidas", value: attendedAlerts.length, fill: "#0f766e" },
  ]

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!user) return;
      try {
        const ninetyDaysAgo = format(subDays(new Date(), 90), "yyyy-MM-dd");
        
        let alertsData: any[] = [];
        let incidentsData: any[] = [];
        let studentsData: any[] = [];

        if (user.role === 'docente') {
          // 1. Fetch teacher's own incidents
          const { data: docenteIncidents, error: incError } = await supabase
            .from('incidencias')
            .select('id, alumno_id, alumno_nombre, tipo, descripcion, severidad, fecha, registrado_por, registrador_user_id')
            .eq('registrador_user_id', user.id)
            .order('fecha', { ascending: false });
          
          if (incError) throw incError;
          incidentsData = docenteIncidents || [];

          // 2. Fetch alerts ONLY for students in the teacher's tutoría (grado and seccion)
          if (user.tutor_grado && user.tutor_seccion) {
            const { data: tutorStudents, error: tutorStudentsError } = await supabase
              .from('alumnos')
              .select('id')
              .eq('grado', user.tutor_grado)
              .eq('seccion', user.tutor_seccion);
              
            if (tutorStudentsError) throw tutorStudentsError;
            
            const tutorStudentIds = (tutorStudents || []).map((s: any) => s.id);
            
            if (tutorStudentIds.length > 0) {
              const { data: alertsFiltered, error: alertsError } = await supabase
                .from('alertas')
                .select('id, alumno_id, alumno_nombre, tipo, nivel, mensaje, fecha, leido, accion_requerida')
                .in('alumno_id', tutorStudentIds)
                .order('fecha', { ascending: false });
              
              if (alertsError) throw alertsError;
              alertsData = alertsFiltered || [];
            } else {
              alertsData = [];
            }
          } else {
            // Si no tiene tutoría asignada, no ve ninguna alerta
            alertsData = [];
          }

          // 3. Fetch students
          const { data: studentsRes, error: studError } = await supabase
            .from('alumnos')
            .select('id, grado, seccion');
          
          if (studError) throw studError;
          studentsData = studentsRes || [];

        } else {
          // Global views for other roles (auxiliar, director, subdirector, admin)
          const [alertsRes, incidentsRes, studentsRes] = await Promise.all([
            supabase.from('alertas').select('id, alumno_id, alumno_nombre, tipo, nivel, mensaje, fecha, leido, accion_requerida').order('fecha', { ascending: false }),
            supabase.from('incidencias').select('id, alumno_id, alumno_nombre, tipo, descripcion, severidad, fecha, registrado_por').gte('fecha', ninetyDaysAgo).order('fecha', { ascending: false }),
            supabase.from('alumnos').select('id, grado, seccion')
          ]);
          
          if (alertsRes.error) throw alertsRes.error;
          if (incidentsRes.error) throw incidentsRes.error;
          if (studentsRes.error) throw studentsRes.error;

          alertsData = alertsRes.data || [];
          incidentsData = incidentsRes.data || [];
          studentsData = studentsRes.data || [];
        }
        
        if (mounted) {
          setAlerts(alertsData.map((a: any) => ({
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

          setIncidences(incidentsData.map((i: any) => ({
            id: i.id,
            alumnoId: i.alumno_id,
            alumnoNombre: i.alumno_nombre,
            tipo: i.tipo,
            descripcion: i.descripcion,
            severidad: i.severidad,
            fecha: i.fecha,
            registradoPor: i.registrado_por
          })));

          setStudents(studentsData);
        }
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    
    if (!isUserLoading) {
      loadData();
    }
    
    return () => { mounted = false; };
  }, [user, isUserLoading]);

  const formatFecha = (fechaStr: string, mode: 'time' | 'full' = 'full') => {
    try {
      if (!fechaStr) return "...";
      const d = parseISO(fechaStr);
      if (isNaN(d.getTime())) return fechaStr;
      return format(d, mode === 'time' ? "p" : "dd MMM, yyyy HH:mm", { locale: es });
    } catch {
      return fechaStr;
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await supabase.from('alertas').update({ leido: true }).eq('id', id);
      setAlerts(alerts.map(a => a.id === id ? { ...a, leido: true } : a))
    } catch (error) {
      console.error("Error marking as read", error);
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = alerts.filter(a => !a.leido).map(a => a.id);
      if (unreadIds.length === 0) return;
      await supabase.from('alertas').update({ leido: true }).in('id', unreadIds);
      setAlerts(alerts.map(a => ({ ...a, leido: true })));
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  }

  const deleteAlert = async (id: string) => {
    try {
      await supabase.from('alertas').delete().eq('id', id);
      setAlerts(alerts.filter(a => a.id !== id))
    } catch (error) {
      console.error("Error deleting alert", error);
    }
  }

  const handleExportExcel = () => {
    const now = new Date();
    
    let filteredAlerts = alerts;
    let periodText = "Todos los registros";
    
    if (exportPeriod === 'semanal') {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredAlerts = alerts.filter(a => new Date(a.fecha) >= lastWeek);
      periodText = "Semanal";
    } else if (exportPeriod === 'mensual') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filteredAlerts = alerts.filter(a => new Date(a.fecha) >= lastMonth);
      periodText = "Mensual";
    }

    const headers = "Alumno,Grado/Sección,Faltas,Tardanzas,Otras Incidencias,Motivo de Alerta,Nivel de Gravedad,Periodo Filtrado\n";
    
    const csvContent = "\uFEFF" + headers + filteredAlerts.map(alert => {
      const student = students.find(s => s.id === alert.alumnoId);
      const studentIncidences = incidences.filter(i => i.alumnoId === alert.alumnoId);
      
      let periodIncidences = studentIncidences;
      if (exportPeriod === 'semanal') {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        periodIncidences = studentIncidences.filter(i => new Date(i.fecha) >= lastWeek);
      } else if (exportPeriod === 'mensual') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        periodIncidences = studentIncidences.filter(i => new Date(i.fecha) >= lastMonth);
      }

      const faltas = periodIncidences.filter(i => i.tipo === 'Inasistencia').length;
      const tardanzas = periodIncidences.filter(i => i.tipo === 'Tardanza').length;
      const otras = periodIncidences.length - faltas - tardanzas;
      const gradoSeccion = student ? `${student.grado} - ${student.seccion}` : "N/A";

      return `"${alert.alumnoNombre}","${gradoSeccion}","${faltas}","${tardanzas}","${otras}","${alert.mensaje}","${alert.nivel}","${periodText}"`
    }).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_alertas_${exportPeriod}_${format(now, 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDialogOpen(false);
  }

  const generateSummary = async (alumnoId: string, alumnoNombre: string, motivoAlerta: string) => {
    setIsSummarizing(prev => ({ ...prev, [alumnoId]: true }));
    try {
      const studentIncidences = incidences.filter(i => i.alumnoId === alumnoId);
      const incidentsData = studentIncidences.map(i => 
        `[${formatFecha(i.fecha, 'full')}] ${i.tipo} (${i.severidad}): ${i.descripcion}`
      ).join('\n');

      const response = await summarizeStudentAlerts({
        studentName: alumnoNombre,
        alertReason: motivoAlerta,
        incidentsData: incidentsData || "No hay incidencias registradas recientemente."
      });

      setSummaries(prev => ({ ...prev, [alumnoId]: response.summary }));
    } catch (error) {
      console.error("Error generating summary", error);
    } finally {
      setIsSummarizing(prev => ({ ...prev, [alumnoId]: false }));
    }
  }

  const getNivelColor = (nivel: string) => {
    switch (nivel?.toLowerCase()) {
      case 'rojo': return 'border-l-red-500 bg-card/40 hover:bg-card/60';
      case 'amarillo': return 'border-l-amber-500 bg-card/40 hover:bg-card/60';
      case 'verde': return 'border-l-emerald-500 bg-card/40 hover:bg-card/60';
      default: return 'border-l-slate-500 bg-card/40';
    }
  }

  const getSeverityBadgeVariant = (severidad: string) => {
    switch (severidad?.toLowerCase()) {
      case 'alto': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medio': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'bajo': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-white/10 text-slate-300 border-white/5';
    }
  }

  const getBadgeVariant = (nivel: string) => {
    switch (nivel?.toLowerCase()) {
      case 'rojo': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'amarillo': return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      case 'verde': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  }

  if (isUserLoading || isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="rounded-2xl border border-amber-900/10 bg-gradient-to-r from-amber-600 via-rose-700 to-slate-950 p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-headline flex items-center gap-2">
            <ShieldAlert className="text-white/85" />
            Seguimiento Prioritario
          </h2>
          <p className="text-sm font-medium text-white/75">Bandeja de atención urgente para alumnos con riesgo activo.</p>
        </div>
        
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
              <Download className="mr-2 h-4 w-4" /> Exportar en Excel
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exportar Reporte de Alumnos en Alerta</DialogTitle>
              <DialogDescription>
                Descargue un archivo ordenado con los alumnos que presentan dificultades, faltas o incidencias.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Seleccionar Periodo</Label>
                <Select value={exportPeriod} onValueChange={setExportPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanal">Semanal (Últimos 7 días)</SelectItem>
                    <SelectItem value="mensual">Mensual (Últimos 30 días)</SelectItem>
                    <SelectItem value="todos">Todos los registros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700">Descargar CSV</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-red-500/15 bg-red-500/10 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-red-800 dark:text-red-200">
              <span className="text-xs font-black uppercase">Riesgo alto</span>
              <Flame size={18} />
            </div>
            <p className="mt-2 text-3xl font-black text-red-700 dark:text-red-200">{redAlerts.length}</p>
            <p className="text-xs font-semibold text-red-700/75 dark:text-red-200/75">alertas rojas activas o registradas</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/15 bg-amber-500/10 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-amber-800 dark:text-amber-200">
              <span className="text-xs font-black uppercase">Pendientes</span>
              <Bell size={18} />
            </div>
            <p className="mt-2 text-3xl font-black text-amber-700 dark:text-amber-200">{unreadAlerts.length}</p>
            <p className="text-xs font-semibold text-amber-700/75 dark:text-amber-200/75">requieren revisión del equipo</p>
          </CardContent>
        </Card>
        <Card className="border-teal-500/15 bg-teal-500/10 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-teal-800 dark:text-teal-200">
              <span className="text-xs font-black uppercase">Atendidas</span>
              <CheckCircle2 size={18} />
            </div>
            <p className="mt-2 text-3xl font-black text-teal-700 dark:text-teal-200">{attendedAlerts.length}</p>
            <p className="text-xs font-semibold text-teal-700/75 dark:text-teal-200/75">ya fueron visualizadas</p>
          </CardContent>
        </Card>
        <Card className="border-slate-900/10 bg-slate-900 text-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-white/80">
              <span className="text-xs font-black uppercase">Alumnos en radar</span>
              <AlertTriangle size={18} />
            </div>
            <p className="mt-2 text-3xl font-black">{riskSummary.length}</p>
            <p className="text-xs font-semibold text-white/60">priorizados por puntaje de riesgo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="overflow-hidden border-amber-900/10 bg-surface-container-lowest shadow-sm dark:border-white/10">
          <CardContent className="h-72 p-6">
            <div className="mb-3">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-100">Pulso de atención</h3>
              <p className="text-xs font-semibold text-slate-500">Volumen de alertas por estado de respuesta.</p>
            </div>
            <ResponsiveContainer width="100%" height="78%">
              <RadialBarChart innerRadius="30%" outerRadius="100%" data={riskGaugeData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, Math.max(alerts.length, 1)]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={12} background />
                <Tooltip contentStyle={{ borderRadius: 12 }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-rose-900/10 bg-surface-container-lowest shadow-sm dark:border-white/10">
          <CardContent className="h-72 p-6">
            <div className="mb-3">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-800 dark:text-slate-100">Ranking de alumnos en riesgo</h3>
              <p className="text-xs font-semibold text-slate-500">Puntaje ponderado: rojo 5, amarillo 3, verde 1.</p>
            </div>
            {riskSummary.length > 0 ? (
              <ResponsiveContainer width="100%" height="78%">
                <BarChart data={riskSummary} layout="vertical" margin={{ top: 4, right: 18, left: 16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#fee2e2" />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="alumnoNombre" width={160} tick={{ fontSize: 11, fontWeight: 700 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #fecdd3" }} />
                  <Bar dataKey="score" name="Puntaje" fill="#e11d48" radius={[3, 10, 10, 3]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-48 items-center justify-center text-sm font-semibold text-slate-400">Sin alumnos en riesgo</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alertas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alertas" className="flex items-center gap-2">
            <Bell size={16} /> Bandeja prioritaria
          </TabsTrigger>
          <TabsTrigger value="reportes" className="flex items-center gap-2">
            <ClipboardList size={16} /> Contexto reciente
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="alertas" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Marcar todas como leídas
            </Button>
          </div>
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <Card key={alert.id} className={cn(
                "border border-slate-100 dark:border-white/[0.08] shadow-sm backdrop-blur-md transition-all hover:shadow-md hover:-translate-y-0.5 duration-300 border-l-4 rounded-xl",
                getNivelColor(alert.nivel),
                alert.leido && "opacity-60"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-xl mt-1 border shadow-sm",
                      alert.nivel === 'rojo' ? 'bg-red-500/10 text-red-600 border-red-500/20' : 
                      alert.nivel === 'amarillo' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    )}>
                      <AlertTriangle size={20} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight leading-none">{alert.alumnoNombre}</h3>
                          <Badge variant="outline" className={cn("text-[9px] uppercase px-2 font-black tracking-wider rounded-full", getBadgeVariant(alert.nivel))}>
                            {alert.nivel}
                          </Badge>
                        </div>
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <Clock size={13} />
                          {formatFecha(alert.fecha, 'full')}
                        </span>
                      </div>
                      
                      <div className="bg-slate-50/50 dark:bg-white/[0.02] p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Motivo / Tipo de Alerta: <span className="font-black text-slate-700 dark:text-slate-200">{alert.tipo}</span></p>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">{alert.mensaje}</p>
                      </div>
                      
                      {alert.nivel === 'rojo' && alert.accionRequerida && (
                        <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                          <Phone size={16} className="text-red-600" />
                          <span className="text-xs text-red-700 font-extrabold tracking-wide uppercase">
                            ACCIÓN REQUERIDA: {alert.accionRequerida}
                          </span>
                        </div>
                      )}

                      {/* Sección Gemini AI Resumen */}
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        {summaries[alert.alumnoId] ? (
                          <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/40 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-100/80 dark:border-blue-900/30 rounded-xl p-4 relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                            <div className="flex items-center gap-2 mb-2">
                              <Bot size={18} className="text-blue-600 dark:text-blue-400 animate-bounce" />
                              <h4 className="font-extrabold text-blue-900 dark:text-blue-200 text-xs uppercase tracking-wider">Resumen Gemini AI</h4>
                            </div>
                            <p className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-wrap leading-relaxed font-semibold">{summaries[alert.alumnoId]}</p>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-blue-50/80 border-blue-100 text-blue-700 hover:bg-blue-100 hover:border-blue-200 rounded-lg text-xs font-bold py-4"
                            onClick={() => generateSummary(alert.alumnoId, alert.alumnoNombre, alert.mensaje)}
                            disabled={isSummarizing[alert.alumnoId]}
                          >
                            {isSummarizing[alert.alumnoId] ? (
                              <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Generando...</>
                            ) : (
                              <><Bot className="mr-2 h-3.5 w-3.5" /> Generar resumen para apoderado</>
                            )}
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        {user?.role === 'docente' ? (
                          <Button variant="link" size="sm" className="h-auto p-0 text-primary font-bold text-xs" asChild>
                            <Link href={`/incidents/new?studentId=${alert.alumnoId}`}>Reportar Incidencia</Link>
                          </Button>
                        ) : (
                          <Button variant="link" size="sm" className="h-auto p-0 text-primary font-bold text-xs" asChild>
                            <Link href={`/students/${alert.alumnoId}`}>Ver Ficha del Alumno</Link>
                          </Button>
                        )}
                        {!alert.leido && (
                          <Button variant="ghost" size="sm" className="h-auto p-0 text-slate-500 dark:text-slate-400 font-semibold text-xs hover:bg-transparent hover:text-slate-800 dark:hover:text-slate-100" onClick={() => markAsRead(alert.id)}>
                            Marcar como Leída
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-slate-400 hover:bg-transparent hover:text-destructive ml-auto font-semibold text-xs" onClick={() => deleteAlert(alert.id)}>
                          <Trash2 size={15} className="mr-1" /> Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 bg-card rounded-lg border-2 border-dashed border-white/5">
              <Bell size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-400">No hay alertas activas</h3>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reportes" className="space-y-4">
          {(!incidences || incidences.length === 0) ? (
            <div className="text-center py-20 bg-card rounded-lg border-2 border-dashed border-white/5">
              <ClipboardList size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-400">No hay reportes guardados en el sistema</h3>
            </div>
          ) : (
            incidences.map((incident) => (
              <Card key={incident.id} className="border border-slate-100 dark:border-white/[0.08] shadow-2xl backdrop-blur-md transition-all hover:shadow-md hover:-translate-y-0.5 duration-300 border-l-4 border-l-slate-500 rounded-xl bg-card/60 dark:bg-card/40 hover:bg-card/80 dark:hover:bg-card/60">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 mt-1 shadow-sm">
                      <ClipboardList size={18} />
                    </div>
                    <div className="flex-1 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight leading-none">{incident.alumnoNombre}</h3>
                          <Badge variant="outline" className={cn("text-[9px] uppercase px-2 font-black tracking-wider rounded-full", getSeverityBadgeVariant(incident.severidad))}>
                            {incident.severidad || 'normal'}
                          </Badge>
                        </div>
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <Clock size={13} />
                          {formatFecha(incident.fecha, 'full')}
                        </span>
                      </div>
                      <div className="bg-slate-50/50 dark:bg-white/[0.02] p-3 rounded-xl border border-slate-100 dark:border-white/5">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Tipo: <span className="font-black text-slate-700 dark:text-slate-200">{incident.tipo}</span></p>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">{incident.descripcion}</p>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        {user?.role === 'docente' ? (
                          <Button variant="link" size="sm" className="h-auto p-0 text-primary font-bold text-xs" asChild>
                            <Link href={`/incidents/new?studentId=${incident.alumnoId}`}>Reportar Nueva Incidencia</Link>
                          </Button>
                        ) : (
                          <Button variant="link" size="sm" className="h-auto p-0 text-primary font-bold text-xs" asChild>
                            <Link href={`/students/${incident.alumnoId}`}>Ver Ficha</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
