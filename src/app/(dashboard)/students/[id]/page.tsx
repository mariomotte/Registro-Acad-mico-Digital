
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
  FileText,
  Plus,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { IncidentAiSummary } from "@/components/incidents/IncidentAiSummary"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Alumno, Incidencia } from "@/types"
import { useState, useEffect } from "react"

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const db = useFirestore()
  const id = params.id as string
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const studentRef = useMemoFirebase(() => doc(db, "students", id), [db, id])
  const { data: student, isLoading: isStudentLoading } = useDoc<Alumno>(studentRef)

  const incidentsQuery = useMemoFirebase(() => 
    query(collection(db, "incidences"), where("alumnoId", "==", id), orderBy("fecha", "desc")),
  [db, id])
  const { data: incidents, isLoading: isIncidentsLoading } = useCollection<Incidencia>(incidentsQuery)

  if (isStudentLoading || !isMounted) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold">Alumno no encontrado</h2>
        <Button onClick={() => router.back()} className="mt-4">Volver</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft />
        </Button>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline">Ficha del Estudiante</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: Profile Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="h-24 bg-primary" />
            <CardContent className="-mt-12 text-center pb-8">
              <Avatar className="h-24 w-24 mx-auto border-4 border-white mb-4">
                <AvatarImage src={`https://picsum.photos/seed/${student.id}/200`} />
                <AvatarFallback className="text-2xl">{student.nombre.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-bold text-slate-900">{student.nombre} {student.apellido}</h3>
              <p className="text-sm text-muted-foreground mb-4">{student.grado} - {student.seccion}</p>
              <Badge className={student.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                {student.estado}
              </Badge>
            </CardContent>
            <div className="border-t px-6 py-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span>Nacimiento: {student.fechaNacimiento ? format(new Date(student.fechaNacimiento), "PP", { locale: es }) : "No registrada"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <User size={16} className="text-slate-400" />
                <span>ID: {student.id}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <BookOpen size={16} className="text-slate-400" />
                <span>Promedio General: --</span>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <User size={20} className="text-primary" />
                Datos de Apoderado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p className="font-semibold text-slate-700">Información Protegida</p>
                <p className="text-muted-foreground text-xs">Datos encriptados por seguridad.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: AI Analysis & Incidents */}
        <div className="md:col-span-2 space-y-6">
          <IncidentAiSummary student={student} incidents={incidents || []} />

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <History size={20} className="text-primary" />
                  Historial de Incidencias
                </CardTitle>
                <CardDescription>Registro cronológico de observaciones y reportes.</CardDescription>
              </div>
              <Button size="sm" className="bg-primary" asChild>
                <Link href="/incidents/new">
                  <Plus className="mr-2 h-4 w-4" /> Nuevo Reporte
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {isIncidentsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : incidents && incidents.length > 0 ? (
                <div className="space-y-6">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="relative pl-6 border-l-2 border-slate-100 pb-6 last:pb-0">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-primary" />
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs font-semibold text-primary uppercase tracking-wider">{inc.tipo}</span>
                          <h4 className="text-sm font-bold text-slate-900">{format(new Date(inc.fecha), "PPP", { locale: es })}</h4>
                        </div>
                        <Badge variant="outline" className={
                          inc.severidad === 'alto' ? 'bg-red-50 text-red-600 border-red-200' :
                          inc.severidad === 'medio' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }>
                          {inc.severidad.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{inc.descripcion}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User size={12} /> {inc.registradoPor}
                        </span>
                        {inc.evidenceUrls && inc.evidenceUrls.length > 0 && (
                          <div className="flex gap-1">
                            {inc.evidenceUrls.map((url, idx) => (
                              <div key={idx} className="h-8 w-8 rounded border overflow-hidden">
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
                <div className="text-center py-10 text-muted-foreground">
                  No se registran incidencias para este alumno.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
