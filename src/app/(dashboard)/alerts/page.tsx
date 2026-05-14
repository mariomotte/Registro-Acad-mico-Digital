"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertTriangle, Clock, Trash2, Phone, ClipboardList, Loader2, Download, Bot } from "lucide-react"
import { format, parseISO } from "date-fns"
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

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!user) return;
      try {
        const [alertsRes, incidentsRes, studentsRes] = await Promise.all([
          supabase.from('alertas').select('*').order('fecha', { ascending: false }),
          supabase.from('incidencias').select('*').order('fecha', { ascending: false }),
          supabase.from('alumnos').select('id, grado, seccion')
        ]);
        
        if (alertsRes.error) throw alertsRes.error;
        if (incidentsRes.error) throw incidentsRes.error;
        if (studentsRes.error) throw studentsRes.error;
        
        if (mounted) {
          setAlerts(alertsRes.data.map((a: any) => ({
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

          setIncidences(incidentsRes.data.map((i: any) => ({
            id: i.id,
            alumnoId: i.alumno_id,
            alumnoNombre: i.alumno_nombre,
            tipo: i.tipo,
            descripcion: i.descripcion,
            severidad: i.severidad,
            fecha: i.fecha,
            registradoPor: i.registrado_por
          })));

          if (studentsRes.data) {
            setStudents(studentsRes.data);
          }
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
      case 'rojo': return 'border-l-red-500 bg-red-50/50';
      case 'amarillo': return 'border-l-amber-500 bg-amber-50/50';
      case 'verde': return 'border-l-emerald-500 bg-emerald-50/50';
      default: return 'border-l-slate-300';
    }
  }

  const getSeverityBadgeVariant = (severidad: string) => {
    switch (severidad?.toLowerCase()) {
      case 'alto': return 'bg-red-100 text-red-700 border-red-200';
      case 'medio': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'bajo': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100';
    }
  }

  const getBadgeVariant = (nivel: string) => {
    switch (nivel?.toLowerCase()) {
      case 'rojo': return 'bg-red-100 text-red-700 border-red-200';
      case 'amarillo': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'verde': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100';
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline flex items-center gap-2">
            <Bell className="text-primary" />
            Centro de Alertas y Reportes
          </h2>
          <p className="text-muted-foreground">Seguimiento de tardanzas, inasistencias, casos graves y reportes guardados.</p>
        </div>
        
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
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

      <Tabs defaultValue="alertas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alertas" className="flex items-center gap-2">
            <Bell size={16} /> Alertas Automáticas
          </TabsTrigger>
          <TabsTrigger value="reportes" className="flex items-center gap-2">
            <ClipboardList size={16} /> Todos los Reportes Guardados
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
                "border-none shadow-sm transition-all hover:shadow-md border-l-4",
                getNivelColor(alert.nivel),
                alert.leido && "opacity-60"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-3 rounded-full mt-1",
                      alert.nivel === 'rojo' ? 'bg-red-100 text-red-600' : 
                      alert.nivel === 'amarillo' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                    )}>
                      <AlertTriangle size={24} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-slate-900">{alert.alumnoNombre}</h3>
                          <Badge variant="outline" className={cn("text-[10px] uppercase px-2 font-bold", getBadgeVariant(alert.nivel))}>
                            Gravedad: {alert.nivel}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                          <Clock size={14} />
                          {formatFecha(alert.fecha, 'full')}
                        </span>
                      </div>
                      
                      <div className="bg-white/60 p-3 rounded-lg border border-slate-200">
                        <p className="text-sm font-semibold text-slate-700 mb-1">Motivo / Tipo de Alerta: <span className="font-bold text-slate-900">{alert.tipo}</span></p>
                        <p className="text-sm text-slate-600">{alert.mensaje}</p>
                      </div>
                      
                      {alert.nivel === 'rojo' && alert.accionRequerida && (
                        <div className="p-3 bg-red-100/80 rounded-md border border-red-200 flex items-center gap-3">
                          <Phone size={18} className="text-red-700" />
                          <span className="text-sm text-red-800 font-bold">
                            ACCIÓN REQUERIDA: {alert.accionRequerida}
                          </span>
                        </div>
                      )}

                      {/* Sección Gemini AI Resumen */}
                      <div className="mt-4 pt-4 border-t border-slate-200/60">
                        {summaries[alert.alumnoId] ? (
                          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                            <div className="flex items-center gap-2 mb-2">
                              <Bot size={18} className="text-blue-500" />
                              <h4 className="font-bold text-blue-900 text-sm">Resumen para el Apoderado</h4>
                            </div>
                            <p className="text-sm text-blue-800 whitespace-pre-wrap leading-relaxed">{summaries[alert.alumnoId]}</p>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                            onClick={() => generateSummary(alert.alumnoId, alert.alumnoNombre, alert.mensaje)}
                            disabled={isSummarizing[alert.alumnoId]}
                          >
                            {isSummarizing[alert.alumnoId] ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
                            ) : (
                              <><Bot className="mr-2 h-4 w-4" /> Generar resumen para apoderado</>
                            )}
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        {user?.role === 'Docente' ? (
                          <Button variant="link" size="sm" className="h-auto p-0 text-primary font-semibold" asChild>
                            <Link href={`/incidents/new?studentId=${alert.alumnoId}`}>Reportar Incidencia</Link>
                          </Button>
                        ) : (
                          <Button variant="link" size="sm" className="h-auto p-0 text-primary font-semibold" asChild>
                            <Link href={`/students/${alert.alumnoId}`}>Ver Ficha del Alumno</Link>
                          </Button>
                        )}
                        {alert.nivel === 'rojo' && user?.role !== 'Docente' && (
                          <Button variant="link" size="sm" className="h-auto p-0 text-accent font-semibold" asChild>
                            <Link href={`/psychology?studentId=${alert.alumnoId}`}>Derivar a Psicología</Link>
                          </Button>
                        )}
                        {!alert.leido && (
                          <Button variant="ghost" size="sm" className="h-auto p-0 text-slate-500" onClick={() => markAsRead(alert.id)}>
                            Marcar como Leída
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-slate-400 hover:text-destructive ml-auto" onClick={() => deleteAlert(alert.id)}>
                          <Trash2 size={16} /> Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-lg border-2 border-dashed">
              <Bell size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-semibold text-slate-400">No hay alertas activas</h3>
            </div>
          )}
        </TabsContent>

        <TabsContent value="reportes" className="space-y-4">
          {(!incidences || incidences.length === 0) ? (
            <div className="text-center py-20 bg-white rounded-lg border-2 border-dashed">
              <ClipboardList size={48} className="mx-auto text-slate-200 mb-4" />
              <h3 className="text-lg font-semibold text-slate-400">No hay reportes guardados en el sistema</h3>
            </div>
          ) : (
            incidences.map((incident) => (
              <Card key={incident.id} className="border-none shadow-sm transition-all hover:shadow-md border-l-4 border-l-slate-400">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-full bg-slate-100 text-slate-600 mt-1">
                      <ClipboardList size={20} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-slate-900">{incident.alumnoNombre}</h3>
                          <Badge variant="outline" className={cn("text-[10px] uppercase px-2", getSeverityBadgeVariant(incident.severidad))}>
                            Nivel: {incident.severidad || 'normal'}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium text-slate-500 flex items-center gap-1">
                          <Clock size={14} />
                          {formatFecha(incident.fecha, 'full')}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <p className="text-sm text-slate-800 font-bold mb-1">Tipo: {incident.tipo}</p>
                        <p className="text-sm text-slate-600">{incident.descripcion}</p>
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        {user?.role === 'Docente' ? (
                          <Button variant="link" size="sm" className="h-auto p-0 text-primary font-semibold" asChild>
                            <Link href={`/incidents/new?studentId=${incident.alumnoId}`}>Reportar Nueva Incidencia</Link>
                          </Button>
                        ) : (
                          <Button variant="link" size="sm" className="h-auto p-0 text-primary font-semibold" asChild>
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

