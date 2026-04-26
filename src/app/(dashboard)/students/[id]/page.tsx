"use client"

import { useDoc, useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { doc, collection, query, where, orderBy } from "firebase/firestore"
import { useParams, useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  Calendar, 
  User, 
  BookOpen, 
  History,
  Plus,
  Loader2,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  ShieldAlert
} from "lucide-react"
import Link from "next/link"
import { IncidentAiSummary } from "@/components/incidents/IncidentAiSummary"
import { format, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { Alumno, Incidencia } from "@/types"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const db = useFirestore()
  const id = params?.id as string
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const studentRef = useMemoFirebase(() => id ? doc(db, "students", id) : null, [db, id])
  const { data: student, isLoading: isStudentLoading, error: studentError } = useDoc<Alumno>(studentRef)

  const incidentsQuery = useMemoFirebase(() => {
    if (!id) return null;
    return query(collection(db, "incidences"), where("alumnoId", "==", id), orderBy("fecha", "desc"))
  }, [db, id])
  
  const { data: incidents, isLoading: isIncidentsLoading, error: incidentsError } = useCollection<Incidencia>(incidentsQuery)

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
          <p className="text-sm font-medium text-slate-500 animate-pulse">Cargando expediente académico...</p>
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
        <h2 className="text-2xl font-bold text-slate-900">Error de Acceso</h2>
        <p className="text-slate-600 text-sm">
          No se pudieron cargar los datos. Verifique sus permisos de red o intente iniciar sesión nuevamente.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => window.location.reload()} variant="outline">Reintentar</Button>
          <Button onClick={() => router.push('/dashboard')}>Ir al Dashboard</Button>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl shadow-sm border p-10">
        <History size={48} className="mx-auto text-slate-200 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Alumno no encontrado</h2>
        <p className="text-slate-500 mb-6 max-w-sm mx-auto">El registro solicitado no existe o fue eliminado de la base de datos institucional.</p>
        <Button onClick={() => router.push('/students')} className="bg-primary px-8">Volver a la Lista</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full shadow-sm">
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-headline">Ficha del Estudiante</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400">Expediente Oficial</Badge>
              <span className="text-xs text-muted-foreground">• EduControl 2024</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="shadow-sm" asChild>
            <Link href={`/incidents/new?studentId=${student.id}`}>
              <Plus className="mr-2 h-4 w-4" /> Nueva Incidencia
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Left: Profile Info Card */}
        <div className="space-y-6">
          <Card className="border-none shadow-lg overflow-hidden bg-white">
            <div className="h-32 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
            <CardContent className="-mt-16 text-center pb-8 px-6">
              <Avatar className="h-32 w-32 mx-auto border-4 border-white shadow-xl mb-6 ring-4 ring-primary/5">
                <AvatarImage src={`https://picsum.photos/seed/${student.id}/400`} />
                <AvatarFallback className="text-3xl bg-slate-100 font-bold text-primary">{student.nombre.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">{student.nombre} {student.apellido}</h3>
              <p className="text-primary font-bold mt-1 mb-4">{student.grado} Grado - Sección {student.seccion}</p>
              
              <Badge className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold shadow-sm border",
                student.estado === 'Activo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                student.estado === 'Suspendido' ? 'bg-red-50 text-red-700 border-red-100' :
                'bg-slate-50 text-slate-600 border-slate-200'
              )}>
                {student.estado?.toUpperCase()}
              </Badge>
            </CardContent>
            
            <div className="border-t bg-slate-50/50 px-6 py-8 space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Información de Identidad</p>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border">
                      <Calendar size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Nacimiento</p>
                      <span className="font-semibold text-slate-700">{formatSafeDate(student.fechaNacimiento)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border">
                      <User size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">ID Institucional</p>
                      <span className="font-mono text-xs text-slate-600 font-bold">{student.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-2">Contacto y Residencia</p>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border">
                      <Phone size={18} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Teléfono Apoderado</p>
                      <span className="text-xs italic text-muted-foreground">Reservado (Solo Directivos)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="p-2.5 bg-white rounded-xl shadow-sm border">
                      <MapPin size={18} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Dirección</p>
                      <span className="text-xs italic text-muted-foreground">Datos Protegidos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-md bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert size={18} className="text-red-500" />
                Alertas Activas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {incidents && incidents.length > 5 ? (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
                  <p className="text-xs font-bold text-red-700 uppercase mb-1">Alerta Roja</p>
                  <p className="text-xs text-red-600">Este alumno ha superado el umbral de incidencias permitido.</p>
                </div>
              ) : (
                <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                  <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Sin Alertas Críticas</p>
                  <p className="text-xs text-emerald-600 italic">Comportamiento regular registrado.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: AI Analysis & Disciplinary History */}
        <div className="md:col-span-2 space-y-8">
          <IncidentAiSummary student={student} incidents={incidents || []} />

          <Card className="border-none shadow-xl bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b px-8 bg-white/50">
              <div className="space-y-1">
                <CardTitle className="text-xl font-black text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                  <History size={24} className="text-primary" />
                  Historial Disciplinario
                </CardTitle>
                <CardDescription className="font-medium">Cronología de sucesos y reportes académicos.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-8 px-8">
              {isIncidentsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                </div>
              ) : incidents && incidents.length > 0 ? (
                <div className="space-y-10 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-1 before:bg-slate-100/80 before:rounded-full">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="relative pl-14 animate-in slide-in-from-left-4 fade-in duration-500">
                      <div className="absolute left-2.5 top-1 w-5 h-5 rounded-full bg-white border-4 border-primary shadow-md z-10 ring-4 ring-white" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-md border border-primary/10">
                              {inc.tipo}
                            </span>
                            {inc.severidad === 'alto' && <Badge className="bg-red-500 animate-pulse h-2 w-2 p-0 rounded-full" />}
                          </div>
                          <h4 className="text-lg font-black text-slate-900 tracking-tight">
                            {formatSafeDate(inc.fecha, "PPPP")}
                          </h4>
                        </div>
                        <Badge variant="outline" className={cn(
                          "px-4 py-1.5 font-black uppercase text-[10px] tracking-widest shadow-sm",
                          getSeverityColor(inc.severidad)
                        )}>
                          Gravedad {inc.severidad}
                        </Badge>
                      </div>

                      <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 shadow-inner group hover:bg-white hover:shadow-md transition-all duration-300">
                        <p className="text-sm text-slate-700 leading-relaxed font-medium mb-4 italic">
                          "{inc.descripcion}"
                        </p>
                        
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4 border-slate-200/50">
                          <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-bold bg-white px-3 py-1.5 rounded-lg border shadow-sm">
                            <User size={14} className="text-primary/60" />
                            Registrado por: <span className="text-slate-900">{inc.registradoPor}</span>
                          </div>
                          
                          {inc.evidenceUrls && inc.evidenceUrls.length > 0 && (
                            <div className="flex gap-2">
                              {inc.evidenceUrls.map((url, idx) => (
                                <div key={idx} className="h-12 w-12 rounded-xl border-2 border-white shadow-md overflow-hidden cursor-zoom-in hover:scale-125 transition-transform duration-300">
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
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  <History size={60} className="mx-auto text-slate-200 mb-6" />
                  <h3 className="text-xl font-bold text-slate-400">Sin historial registrado</h3>
                  <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto italic">Este estudiante no presenta reportes disciplinarios ni observaciones académicas hasta la fecha.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}