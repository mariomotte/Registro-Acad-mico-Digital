"use client"

import { useParams, useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  Calendar, 
  User, 
  History,
  Plus,
  Loader2,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  HeartPulse,
  Users
} from "lucide-react"
import Link from "next/link"
import { IncidentAiSummary } from "@/components/incidents/IncidentAiSummary"
import { format, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { Alumno, Incidencia } from "@/types"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { user, loading: isUserLoading } = useSupabaseAuth()

  const [isMounted, setIsMounted] = useState(false)
  
  const [student, setStudent] = useState<any>(null)
  const [isStudentLoading, setIsStudentLoading] = useState(true)
  const [studentError, setStudentError] = useState<Error | null>(null)
  
  const [incidents, setIncidents] = useState<any[]>([])
  const [isIncidentsLoading, setIsIncidentsLoading] = useState(true)
  const [incidentsError, setIncidentsError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true;
    setIsMounted(true)
    
    async function loadData() {
      if (!id || !user) return;
      
      try {
        const { data: sData, error: sError } = await supabase
          .from('alumnos')
          .select('*')
          .eq('id', id)
          .single();
          
        if (sError) throw sError;
        if (mounted) setStudent(sData);
      } catch (err) {
        if (mounted) setStudentError(err as Error);
      } finally {
        if (mounted) setIsStudentLoading(false);
      }

      try {
        const { data: iData, error: iError } = await supabase
          .from('incidencias')
          .select('*')
          .eq('alumno_id', id)
          .order('fecha', { ascending: false });
          
        if (iError) throw iError;
        if (mounted) setIncidents(iData);
      } catch (err) {
        if (mounted) setIncidentsError(err as Error);
      } finally {
        if (mounted) setIsIncidentsLoading(false);
      }
    }
    
    if (!isUserLoading) {
      loadData();
    }
    
    return () => { mounted = false; };
  }, [id, user, isUserLoading])

  const formatSafeDate = (dateString: string | undefined, pattern: string = "PP") => {
    if (!isMounted || !dateString) return "..."
    const d = new Date(dateString)
    if (!isValid(d)) return "Fecha inválida"
    return format(d, pattern, { locale: es })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'alto': return 'bg-red-50 text-red-700 border-red-200';
      case 'medio': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'bajo': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50';
    }
  }

  if (isStudentLoading || !isMounted) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">Cargando ficha oficial...</p>
        </div>
      </div>
    )
  }

  if (studentError || incidentsError) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 bg-white rounded-2xl shadow-xl p-8 border border-red-100">
        <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Acceso Denegado</h2>
        <p className="text-slate-600 text-sm">
          No tienes permisos para ver esta ficha o el registro no existe.
        </p>
        <Button onClick={() => router.push('/dashboard')}>Volver al Panel</Button>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800">Estudiante no encontrado</h2>
        <Button onClick={() => router.push('/students')} className="mt-4">Ver lista de alumnos</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full">
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-headline uppercase">Ficha Académica</h2>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-1">Expediente Disciplinario #{(student.id || "").slice(-6)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/incidents/new?studentId=${student.id}`}>
              <Plus className="mr-2 h-4 w-4" /> Nueva Incidencia
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Perfil y Datos Personales */}
        <div className="space-y-6">
          <Card className="border-none shadow-lg overflow-hidden">
            <div className="h-32 bg-primary" />
            <CardContent className="-mt-16 text-center pb-8 px-6">
              <Avatar className="h-32 w-32 mx-auto border-4 border-white shadow-xl mb-6">
                <AvatarImage src={`https://picsum.photos/seed/${student.id}/400`} />
                <AvatarFallback className="text-3xl font-bold text-primary">{student.nombre?.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">{student.nombre} {student.apellido}</h3>
              <p className="text-primary font-bold mt-1 mb-4">{student.grado} - {student.seccion}</p>
              
              <Badge className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold",
                student.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 
                student.estado === 'Suspendido' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
              )}>
                {student.estado?.toUpperCase()}
              </Badge>
            </CardContent>
            
            <div className="border-t bg-slate-50/50 px-6 py-6 space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Información del Alumno</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={16} className="text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Nacimiento</p>
                      <span className="font-semibold text-slate-700">{formatSafeDate(student.fecha_nacimiento || student.fechaNacimiento)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <User size={16} className="text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Género</p>
                      <span className="font-semibold text-slate-700">No especificado</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Datos de Contacto</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Users size={16} className="text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Apoderado</p>
                      <span className="font-semibold text-slate-700">Tutor Legal Asignado</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-slate-400" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Teléfono Emergencia</p>
                      <span className="font-semibold text-slate-700">9XX XXX XXX</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Información Médica</p>
                <div className="flex items-center gap-3 text-sm">
                  <HeartPulse size={16} className="text-red-400" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Alergias / Cuidados</p>
                    <span className="font-semibold text-slate-700 italic">Ninguna reportada</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Análisis IA e Historial */}
        <div className="md:col-span-2 space-y-8">
          <IncidentAiSummary student={student} incidents={incidents || []} />

          <Card className="border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-white border-b px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
                    <History size={24} className="text-primary" />
                    Bitácora Disciplinaria
                  </CardTitle>
                  <CardDescription>Cronología detallada de sucesos y reportes.</CardDescription>
                </div>
                <Badge variant="outline" className="px-3 py-1 bg-slate-50">
                  {incidents?.length || 0} Registros
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-8 px-8">
              {isIncidentsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              ) : incidents && incidents.length > 0 ? (
                <div className="space-y-8">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="relative pl-8 border-l-2 border-slate-100 pb-2">
                      <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-primary border-4 border-white shadow-sm" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-black text-primary uppercase bg-primary/5 px-2 py-0.5 rounded border border-primary/10 mr-2">
                            {inc.tipo}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            {formatSafeDate(inc.fecha, "PPP")}
                          </span>
                        </div>
                        <Badge variant="outline" className={cn(
                          "text-[10px] font-black uppercase tracking-widest",
                          getSeverityColor(inc.severidad)
                        )}>
                          Severidad {inc.severidad}
                        </Badge>
                      </div>

                      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                        <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                          "{inc.descripcion}"
                        </p>
                        
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t pt-3 border-slate-200/50">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                            <User size={12} className="text-primary/60" />
                            Reportado por: <span className="text-slate-900">{inc.registrado_por || inc.registradoPor}</span>
                          </div>
                          
                          {(inc.evidence_urls || inc.evidenceUrls) && (inc.evidence_urls || inc.evidenceUrls).length > 0 && (
                            <div className="flex gap-1">
                              {(inc.evidence_urls || inc.evidenceUrls).map((url: string, idx: number) => (
                                <div key={idx} className="h-10 w-10 rounded-lg border-2 border-white shadow-sm overflow-hidden">
                                  <img src={url} className="w-full h-full object-cover" alt="Evidencia" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Sin reportes registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}