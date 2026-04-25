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
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { IncidentAiSummary } from "@/components/incidents/IncidentAiSummary"
import { format, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { Alumno, Incidencia } from "@/types"
import { useState, useEffect } from "react"

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

  if (isStudentLoading || !isMounted) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando expediente...</p>
        </div>
      </div>
    )
  }

  if (studentError || incidentsError) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Error de acceso</h2>
        <p className="text-muted-foreground text-sm">
          No tienes permisos suficientes para ver esta información o hubo un error en la red.
        </p>
        <Button onClick={() => router.back()} variant="outline">Volver</Button>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Alumno no encontrado</h2>
        <p className="text-muted-foreground mb-6">El registro solicitado no existe en nuestra base de datos.</p>
        <Button onClick={() => router.back()}>Volver a la lista</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline">Ficha del Estudiante</h2>
          <p className="text-xs text-muted-foreground">Expediente oficial institucional</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: Profile Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-md overflow-hidden bg-white">
            <div className="h-24 bg-gradient-to-r from-primary to-primary/80" />
            <CardContent className="-mt-12 text-center pb-8">
              <Avatar className="h-24 w-24 mx-auto border-4 border-white shadow-lg mb-4">
                <AvatarImage src={`https://picsum.photos/seed/${student.id}/200`} />
                <AvatarFallback className="text-2xl bg-slate-100">{student.nombre.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold text-slate-900">{student.nombre} {student.apellido}</h3>
              <p className="text-sm font-medium text-primary mb-4">{student.grado} - {student.seccion}</p>
              <Badge className={
                student.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                student.estado === 'Suspendido' ? 'bg-red-100 text-red-700 border-red-200' :
                'bg-slate-100 text-slate-700'
              }>
                {student.estado}
              </Badge>
            </CardContent>
            <div className="border-t px-6 py-6 space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <Calendar size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Nacimiento</p>
                  <span className="font-medium">{formatSafeDate(student.fechaNacimiento)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <User size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">ID Estudiante</p>
                  <span className="font-mono text-xs">{student.id}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <BookOpen size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Nivel Académico</p>
                  <span className="font-medium">Regular</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-md flex items-center gap-2">
                <User size={18} className="text-primary" />
                Datos de Apoderado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-muted-foreground text-center">
                  Información de contacto protegida. Solo accesible por personal directivo o psicología.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: AI Analysis & Incidents */}
        <div className="md:col-span-2 space-y-6">
          <IncidentAiSummary student={student} incidents={incidents || []} />

          <Card className="border-none shadow-md bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History size={20} className="text-primary" />
                  Historial Disciplinario
                </CardTitle>
                <CardDescription>Registro cronológico de todas las incidencias.</CardDescription>
              </div>
              <Button size="sm" className="bg-primary shadow-sm" asChild>
                <Link href={`/incidents/new?studentId=${student.id}`}>
                  <Plus className="mr-2 h-4 w-4" /> Registrar Nuevo
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {isIncidentsLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : incidents && incidents.length > 0 ? (
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-slate-100">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="relative pl-12">
                      <div className="absolute left-3 top-0 w-4 h-4 rounded-full bg-white border-4 border-primary shadow-sm z-10" />
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded">
                            {inc.tipo}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1">
                            {formatSafeDate(inc.fecha, "PPP")}
                          </h4>
                        </div>
                        <Badge variant="outline" className={
                          inc.severidad === 'alto' ? 'bg-red-50 text-red-600 border-red-100' :
                          inc.severidad === 'medio' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-emerald-50 text-emerald-600 border-emerald-100'
                        }>
                          Gravedad {inc.severidad?.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed mb-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                        {inc.descripcion}
                      </p>
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                          <User size={14} className="text-slate-300" />
                          Registrado por: <span className="text-slate-600">{inc.registradoPor}</span>
                        </div>
                        {inc.evidenceUrls && inc.evidenceUrls.length > 0 && (
                          <div className="flex gap-2">
                            {inc.evidenceUrls.map((url, idx) => (
                              <div key={idx} className="h-10 w-10 rounded-lg border shadow-sm overflow-hidden cursor-zoom-in hover:scale-105 transition-transform">
                                <img src={url} className="w-full h-full object-cover" alt="Evidencia" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <History size={40} className="mx-auto text-slate-200 mb-4" />
                  <h3 className="text-slate-400 font-semibold">Sin historial previo</h3>
                  <p className="text-xs text-slate-400 mt-1">No se han registrado incidencias para este estudiante.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}