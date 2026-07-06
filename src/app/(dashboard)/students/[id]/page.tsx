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
  ShieldAlert,
  HeartPulse,
  Users,
  Fingerprint,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  Edit3,
  Printer,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  FileText
} from "lucide-react"
import Link from "next/link"
import { format, isValid, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Alumno, Incidencia } from "@/types"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { getUserAvatar } from "@/lib/avatar"
import { useToast } from "@/hooks/use-toast"

export default function StudentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const { user, loading: isUserLoading } = useSupabaseAuth()
  const userId = user?.id
  const userRole = user?.role
  const tutorGrado = user?.tutor_grado
  const tutorSeccion = user?.tutor_seccion
  const { toast } = useToast()

  const [isMounted, setIsMounted] = useState(false)
  
  const [student, setStudent] = useState<any>(null)
  const [isStudentLoading, setIsStudentLoading] = useState(true)
  const [studentError, setStudentError] = useState<Error | null>(null)
  
  const [incidents, setIncidents] = useState<any[]>([])
  const [isIncidentsLoading, setIsIncidentsLoading] = useState(true)
  const [incidentsError, setIncidentsError] = useState<Error | null>(null)

  // Estados de la Bitácora
  const [tutorNote, setTutorNote] = useState("")
  const [isSavingNote, setIsSavingNote] = useState(false)

  // Estados de Fortalezas / Aspectos por mejorar
  const [fortalezas, setFortalezas] = useState("")
  const [porMejorar, setPorMejorar] = useState("")
  const [isEditingStrengths, setIsEditingStrengths] = useState(false)
  const [isSavingStrengths, setIsSavingStrengths] = useState(false)

  // Control de pestañas
  const [activeTab, setActiveTab] = useState<"tardanzas" | "inasistencias" | "incidencias" | "bitacora">("tardanzas")

  useEffect(() => {
    let mounted = true;
    setIsMounted(true)
    
    async function loadData() {
      if (!id || !userId) return;
      let loadedStudent: any = null;
      
      // Load Student
      try {
        const { data: sData, error: sError } = await supabase
          .from('alumnos')
          .select('id, nombres, apellidos, estado, grado, seccion, nivel, sexo, dni, apoderado, telefono, fortalezas, por_mejorar')
          .eq('id', id)
          .single();
          
        if (sError) throw sError;
        loadedStudent = sData;
        if (mounted && sData) {
          setStudent(sData);
          setFortalezas(sData.fortalezas || "");
          setPorMejorar(sData.por_mejorar || "");
        }
      } catch (err) {
        if (mounted) setStudentError(err as Error);
      } finally {
        if (mounted) setIsStudentLoading(false);
      }

      // Load Incidents
      try {
        let incidentsQuery = supabase
          .from('incidencias')
          .select('id, tipo, registrado_por, fecha, fecha_suceso, severidad, descripcion, accion_tomada, evidence_urls')
          .eq('alumno_id', id)

        const isTutorStudent = userRole === 'docente'
          && loadedStudent
          && loadedStudent.grado === tutorGrado
          && loadedStudent.seccion === tutorSeccion;

        if (userRole === 'docente' && !isTutorStudent) {
          incidentsQuery = incidentsQuery.eq('registrador_user_id', userId);
        }

        const { data: iData, error: iError } = await incidentsQuery.order('created_at', { ascending: false });
          
        if (iError) throw iError;
        if (mounted) setIncidents((iData || []).map((i: any) => ({
          ...i,
          fecha: i.fecha_suceso || i.fecha
        })));
      } catch (err) {
        console.error("Error loading incidents:", err);
        if (mounted) setIncidents([]);
      } finally {
        if (mounted) setIsIncidentsLoading(false);
      }
    }
    
    if (!isUserLoading) {
      loadData();
    }
    
    return () => { mounted = false; };
  }, [id, userId, userRole, tutorGrado, tutorSeccion, isUserLoading])

  const formatSafeDate = (dateString: string | undefined, pattern: string = "PP") => {
    if (!isMounted || !dateString) return "..."
    try {
      const d = parseISO(dateString)
      if (!isValid(d)) return dateString
      return format(d, pattern, { locale: es })
    } catch {
      return dateString
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'alto':
      case 'grave': 
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900';
      case 'medio':
      case 'moderada': 
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900';
      case 'bajo':
      case 'leve': 
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  const handleSaveTutorNote = async () => {
    if (!tutorNote.trim()) return;
    setIsSavingNote(true);
    try {
      const userName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Tutor';
      const now = new Date()
      const { error } = await supabase
        .from('incidencias')
        .insert({
          alumno_id: student.id,
          alumno_nombre: `${student.nombres} ${student.apellidos}`,
          alumno_grado: student.grado,
          alumno_seccion: student.seccion,
          registrado_por: userName,
          registrador_user_id: user?.id,
          tipo: 'Observación académica',
          severidad: 'leve',
          descripcion: tutorNote.trim(),
          estado: 'pendiente',
          fecha: now.toLocaleDateString('sv-SE'),
          fecha_suceso: now.toISOString()
        });

      if (error) throw error;

      toast({
        title: "Nota guardada",
        description: "Se guardó la observación académica en la bitácora con éxito.",
      });
      setTutorNote("");
      
      // Reload incidents list
      const { data: iData, error: iError } = await supabase
        .from('incidencias')
        .select('id, tipo, registrado_por, fecha, fecha_suceso, severidad, descripcion, accion_tomada, evidence_urls')
        .eq('alumno_id', id)
        .order('created_at', { ascending: false });
      if (!iError && iData) {
        setIncidents(iData.map((i: any) => ({
          ...i,
          fecha: i.fecha_suceso || i.fecha
        })));
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error al guardar",
        description: err.message || "No se pudo guardar la nota en la bitácora.",
        variant: "destructive"
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSaveStrengths = async () => {
    setIsSavingStrengths(true);
    try {
      const { error } = await supabase
        .from('alumnos')
        .update({
          fortalezas: fortalezas.trim() || null,
          por_mejorar: porMejorar.trim() || null
        })
        .eq('id', student.id);

      if (error) throw error;

      setStudent((prev: any) => ({
        ...prev,
        fortalezas: fortalezas.trim() || null,
        por_mejorar: porMejorar.trim() || null
      }));

      toast({
        title: "Bitácora actualizada",
        description: "Se guardaron las fortalezas y aspectos por mejorar con éxito.",
      });
      setIsEditingStrengths(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error al guardar",
        description: err.message || "No se pudo actualizar las fortalezas/por mejorar.",
        variant: "destructive"
      });
    } finally {
      setIsSavingStrengths(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };


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

  if (studentError) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-red-100 dark:border-red-950">
        <div className="bg-red-100 dark:bg-red-950 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Acceso Denegado</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          No tienes permisos para ver esta ficha o el registro no existe.
        </p>
        <Button onClick={() => router.push('/dashboard')}>Volver al Panel</Button>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Estudiante no encontrado</h2>
        <Button onClick={() => router.push('/students')} className="mt-4">Ver lista de alumnos</Button>
      </div>
    )
  }

  // Filtrado de listas según tipo de reportes de incidencia
  const isAcademicObservation = (tipo: string) => tipo === 'Observación académica' || tipo === 'ObservaciÃ³n acadÃ©mica'
  const getIncidentDate = (incident: any) => {
    const date = new Date(incident.fecha_suceso || incident.fecha)
    return isNaN(date.getTime()) ? null : date
  }
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentSemester = currentDate.getMonth() < 6 ? 1 : 2
  const currentPeriodLabel = `${currentSemester === 1 ? "I" : "II"} semestre ${currentYear}`
  const isCurrentPeriodIncident = (incident: any) => {
    const date = getIncidentDate(incident)
    if (!date) return false
    const semester = date.getMonth() < 6 ? 1 : 2
    return date.getFullYear() === currentYear && semester === currentSemester
  }

  const tardanzasList = incidents.filter(i => i.tipo === 'Tardanza')
  const inasistenciasList = incidents.filter(i => i.tipo === 'Inasistencia')
  const incidenciasList = incidents.filter(i => !isAcademicObservation(i.tipo) && i.tipo !== 'Inasistencia' && i.tipo !== 'Tardanza')
  const bitacoraList = incidents.filter(i => isAcademicObservation(i.tipo))
  const currentPeriodIncidents = incidents.filter(isCurrentPeriodIncident)
  const currentConductIncidents = currentPeriodIncidents.filter(i => !isAcademicObservation(i.tipo))
  const currentModerateCount = currentConductIncidents.filter(i => ['medio', 'moderada'].includes(String(i.severidad || '').toLowerCase())).length
  const currentSevereCount = currentConductIncidents.filter(i => ['alto', 'grave'].includes(String(i.severidad || '').toLowerCase())).length
  const currentLightCount = currentConductIncidents.filter(i => ['bajo', 'leve'].includes(String(i.severidad || '').toLowerCase())).length
  const conductaPenalty = Math.min(
    3,
    Math.floor(currentLightCount / 5) +
    Math.floor(currentModerateCount / 3) +
    Math.floor(currentSevereCount / 2)
  )
  const conductaLevel: "AD" | "A" | "B" | "C" = (["AD", "A", "B", "C"] as const)[conductaPenalty]
  const conductaGeneral = {
    AD: "AD - EXCELENTE",
    A: "A - BUENA",
    B: "B - EN OBSERVACIÓN",
    C: "C - CASO CRÍTICO",
  }[conductaLevel]

  const conductaBadgeClass = {
    AD: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",
    A: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300",
    B: "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",
    C: "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
  }[conductaLevel]
  const allIncidentHistory = [...incidents].sort((a, b) => {
    const dateA = getIncidentDate(a)?.getTime() || 0
    const dateB = getIncidentDate(b)?.getTime() || 0
    return dateB - dateA
  })
  const emittedAt = formatSafeDate(new Date().toISOString(), "dd 'de' MMMM 'de' yyyy, HH:mm")
  const reportSummaryText = `Durante el ${currentPeriodLabel}, el estudiante ${student.nombres} ${student.apellidos}, del ${student.grado} ${student.seccion}, registra ${tardanzasList.length} tardanza(s), ${inasistenciasList.length} inasistencia(s) y ${incidenciasList.length} reporte(s) de conducta. Con base en estos registros, la conducta sugerida del periodo es ${conductaGeneral}. Se recomienda revisar el historial descrito, considerar las evidencias adjuntas cuando existan y mantener seguimiento coordinado con el tutor, auxiliar o apoderado segun corresponda.`

  const canEdit = user?.role === 'admin' || user?.role === 'director' || user?.role === 'subdirector'
  const canEditStrengths = user?.role === 'admin' || user?.role === 'director' || user?.role === 'subdirector' || user?.role === 'docente' || user?.role === 'auxiliar'

  return (
    <>
    <section className="student-print-report hidden bg-white text-slate-950">
      <header className="student-print-header">
        <div className="student-print-logo">
          <img src="/logo.png" alt="Logo institucional" />
        </div>
        <div>
          <p className="student-print-school">Americo Garibaldi Ghersy</p>
          <p className="student-print-subtitle">Institucion educativa</p>
          <h1>Informe de seguimiento estudiantil</h1>
          <p>Documento para apoderado - {currentPeriodLabel}</p>
        </div>
      </header>

      <div className="student-print-place-date">Moquegua, {emittedAt}</div>

      <section className="student-print-section">
        <h2>Datos del alumno</h2>
        <div className="student-print-grid">
          <div><span>Alumno</span><strong>{student.nombres} {student.apellidos}</strong></div>
          <div><span>Grado y sección</span><strong>{student.grado} {student.seccion}</strong></div>
          <div><span>DNI</span><strong>{student.dni || "No registrado"}</strong></div>
          <div><span>Estado</span><strong>{student.estado || "No registrado"}</strong></div>
          <div><span>Apoderado</span><strong>{student.apoderado || "No registrado"}</strong></div>
          <div><span>Teléfono</span><strong>{student.telefono || "No registrado"}</strong></div>
        </div>
      </section>

      <section className="student-print-section">
        <h2>Resumen del periodo</h2>
        <div className="student-print-summary">
          <p><strong>Conducta sugerida:</strong> {conductaGeneral}</p>
          <p><strong>Tardanzas reportadas:</strong> {tardanzasList.length}</p>
          <p><strong>Inasistencias reportadas:</strong> {inasistenciasList.length}</p>
          <p><strong>Reportes de conducta:</strong> {incidenciasList.length}</p>
        </div>
      </section>

      <section className="student-print-section">
        <h2>Resumen de seguimiento</h2>
        <p className="student-print-paragraph">{reportSummaryText}</p>
      </section>

      <section className="student-print-section">
        <h2>Historial de incidencias</h2>
        {allIncidentHistory.length > 0 ? (
          <div className="student-print-incident-list">
            {allIncidentHistory.map((incident, index) => (
              <article key={incident.id} className="student-print-incident-card">
                <div className="student-print-incident-title">
                  <strong>Incidencia {index + 1}</strong>
                  <span>{incident.tipo}</span>
                </div>
                <div className="student-print-incident-meta">
                  <div><span>Fecha</span><strong>{formatSafeDate(incident.fecha, "dd/MM/yyyy")}</strong></div>
                  <div><span>Tipo</span><strong>{incident.tipo}</strong></div>
                  <div><span>Severidad</span><strong>{incident.severidad || "No registrada"}</strong></div>
                  <div><span>Registrado por</span><strong>{incident.registrado_por || "No registrado"}</strong></div>
                </div>
                <div className="student-print-incident-body">
                  <span>Descripción</span>
                  <p>{incident.descripcion || "Sin descripción"}</p>
                </div>
                <div className="student-print-incident-body">
                  <span>Acción tomada</span>
                  <p>{incident.accion_tomada || "Sin registrar"}</p>
                </div>
                <div className="student-print-incident-body">
                  <span>Evidencias</span>
                  {incident.evidence_urls && incident.evidence_urls.length > 0 ? (
                    <div className="student-print-evidence">
                      {incident.evidence_urls.slice(0, 3).map((url: string, idx: number) => (
                        <img key={idx} src={url} alt={`Evidencia ${idx + 1}`} />
                      ))}
                      {incident.evidence_urls.length > 3 && (
                        <span>+{incident.evidence_urls.length - 3} mas</span>
                      )}
                    </div>
                  ) : (
                    <p>Sin evidencia</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="student-print-empty">No hay incidencias registradas para este alumno.</p>
        )}
      </section>

      <section className="student-print-section student-print-two-columns">
        <div>
          <h2>Fortalezas</h2>
          <p>{student.fortalezas || "Sin registrar"}</p>
        </div>
        <div>
          <h2>Aspectos por mejorar</h2>
          <p>{student.por_mejorar || "Sin registrar"}</p>
        </div>
      </section>

    </section>

    <div className="student-screen-content space-y-8 max-w-[1440px] mx-auto pb-20">
      {/* Breadcrumb / Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-on-surface-variant dark:text-slate-400 font-label-md text-label-md mb-2">
            <Link href="/students" className="hover:text-primary dark:hover:text-primary-fixed transition-colors">Mis Secciones</Link>
            <ChevronRight size={14} className="text-slate-400" />
            <span>{student.grado} {student.seccion}</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-primary dark:text-primary-fixed font-bold">Historial de incidencias</span>
          </nav>
          <h2 className="font-display-lg text-display-lg text-on-surface dark:text-slate-100">{student.nombres} {student.apellidos}</h2>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-surface-container dark:bg-slate-900 border border-outline-variant dark:border-slate-800 text-on-surface-variant dark:text-slate-200 font-label-md text-label-md rounded-lg hover:bg-surface-container-high dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Printer size={18} /> Generar PDF
          </button>
          
          <Link href={`/incidents/new?studentId=${student.id}`}>
            <button className="px-6 py-2 bg-primary dark:bg-primary-container text-on-primary dark:text-on-primary-container font-label-md text-label-md rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm">
              <FileText size={18} /> Registrar Incidencia
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-card-gap">
        {/* Left Column: Student Summary */}
        <div className="lg:col-span-4 space-y-6">
          {/* Summary Card */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-800/80 rounded-xl p-container-padding card-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="h-32 w-32 rounded-full border-4 border-primary-fixed-dim dark:border-primary/20 p-1">
                  <Avatar className="h-full w-full">
                    <AvatarImage src={getUserAvatar(student)} alt={`${student.nombres} ${student.apellidos}`} className="object-cover" />
                    <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">{student.nombres?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                <span className={cn(
                  "absolute bottom-1 right-1 h-6 w-6 border-2 border-white dark:border-slate-900 rounded-full",
                  student.estado === 'Activo' ? 'bg-green-500' : 
                  student.estado === 'Suspendido' ? 'bg-red-500' : 'bg-slate-400'
                )} />
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface dark:text-slate-100">{student.nombres} {student.apellidos}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400 mb-6">ID: #STU-{String(student.id || "").slice(-6).toUpperCase()}</p>
              
              <div className="w-full pt-6 border-t border-outline-variant dark:border-slate-800">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-slate-400">Incidencias recurrentes</p>
                <div className="grid grid-cols-3 w-full gap-3">
                <div className="text-center">
                  <span className="font-label-md text-[10px] leading-tight text-on-surface-variant dark:text-slate-400 block mb-1">TARDANZAS REPORTADAS</span>
                  <span className="font-display-md text-display-md text-primary dark:text-primary-fixed font-bold">{tardanzasList.length}</span>
                </div>
                <div className="text-center border-l border-outline-variant dark:border-slate-800">
                  <span className="font-label-md text-[10px] leading-tight text-on-surface-variant dark:text-slate-400 block mb-1">INASISTENCIAS REPORTADAS</span>
                  <span className="font-display-md text-display-md text-red-600 dark:text-red-400 font-bold">{inasistenciasList.length}</span>
                </div>
                <div className="text-center border-l border-outline-variant dark:border-slate-800">
                  <span className="font-label-md text-[10px] leading-tight text-on-surface-variant dark:text-slate-400 block mb-1">REPORTES DE CONDUCTA</span>
                  <span className="font-display-md text-display-md text-amber-600 dark:text-amber-400 font-bold">{incidenciasList.length}</span>
                </div>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-800/80 rounded-xl p-container-padding card-shadow">
            <h4 className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-4">Detalles de seguimiento</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400">Grado y Sección</span>
                <span className="font-label-md text-label-md text-on-surface dark:text-slate-200">{student.grado} {student.seccion}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400">Tutor Responsable</span>
                <span className="font-label-md text-label-md text-on-surface dark:text-slate-200">Prof. Ricardo García</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400">Conducta sugerida del periodo</span>
                <span className={cn("px-2 py-1 text-[10px] font-bold rounded uppercase", conductaBadgeClass)}>
                  {conductaGeneral}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-on-surface-variant dark:text-slate-400">
                {currentPeriodLabel}. Conducta sugerida del periodo.
              </p>
              <div className="flex justify-between items-center text-sm">
                <span className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400">DNI</span>
                <span className="font-label-md text-label-md text-on-surface dark:text-slate-200 font-mono">{student.dni || "No registrado"}</span>
              </div>
            </div>
            
            {canEdit && (
              <div className="mt-6 border-t pt-4 border-slate-100 dark:border-slate-800">
                <Link href={`/students/${student.id}/edit`}>
                  <Button variant="outline" className="w-full text-xs font-semibold">
                    <Edit3 className="mr-2 h-3.5 w-3.5" /> Editar Datos Ficha
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Contact / Parent Card */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-800/80 rounded-xl p-container-padding card-shadow">
            <h4 className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-4">Contacto Apoderado</h4>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-secondary-container dark:bg-slate-800 text-on-secondary-container dark:text-slate-200 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-label-md text-label-md text-on-surface dark:text-slate-200">{student.apoderado || "No registrado"}</span>
                <span className="font-caption text-caption text-on-surface-variant dark:text-slate-400">Apoderado</span>
              </div>
            </div>
            {student.telefono ? (
              <a href={`tel:${student.telefono}`} className="block w-full">
                <button className="w-full py-2 border border-primary dark:border-primary-fixed text-primary dark:text-primary-fixed font-label-md text-label-md rounded-lg hover:bg-primary-fixed-dim dark:hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
                  <Phone size={18} /> Llamar ({student.telefono})
                </button>
              </a>
            ) : (
              <button className="w-full py-2 border border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-label-md text-label-md rounded-lg flex items-center justify-center gap-2 cursor-not-allowed" disabled>
                <Phone size={18} /> Sin Teléfono
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Tabs and Details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Navigation Tabs */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-800/80 rounded-xl card-shadow overflow-hidden">
            <div className="flex border-b border-outline-variant dark:border-slate-800 px-6 overflow-x-auto scrollbar-hide">
              <button 
                onClick={() => setActiveTab("tardanzas")}
                className={cn(
                  "px-6 py-4 relative font-label-md text-label-md whitespace-nowrap transition-colors",
                  activeTab === "tardanzas" ? "text-primary dark:text-primary-fixed font-bold" : "text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed"
                )}
              >
                TARDANZAS REPORTADAS ({tardanzasList.length})
                {activeTab === "tardanzas" && <div className="active-tab-indicator bg-primary dark:bg-primary-fixed" />}
              </button>
              
              <button 
                onClick={() => setActiveTab("inasistencias")}
                className={cn(
                  "px-6 py-4 relative font-label-md text-label-md whitespace-nowrap transition-colors",
                  activeTab === "inasistencias" ? "text-primary dark:text-primary-fixed font-bold" : "text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed"
                )}
              >
                INASISTENCIAS REPORTADAS ({inasistenciasList.length})
                {activeTab === "inasistencias" && <div className="active-tab-indicator bg-primary dark:bg-primary-fixed" />}
              </button>
              
              <button 
                onClick={() => setActiveTab("incidencias")}
                className={cn(
                  "px-6 py-4 relative font-label-md text-label-md whitespace-nowrap transition-colors",
                  activeTab === "incidencias" ? "text-primary dark:text-primary-fixed font-bold" : "text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed"
                )}
              >
                REPORTES DE CONDUCTA ({incidenciasList.length})
                {activeTab === "incidencias" && <div className="active-tab-indicator bg-primary dark:bg-primary-fixed" />}
              </button>
              
              <button 
                onClick={() => setActiveTab("bitacora")}
                className={cn(
                  "px-6 py-4 relative font-label-md text-label-md whitespace-nowrap transition-colors",
                  activeTab === "bitacora" ? "text-primary dark:text-primary-fixed font-bold" : "text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed"
                )}
              >
                BITÁCORA TUTOR ({bitacoraList.length})
                {activeTab === "bitacora" && <div className="active-tab-indicator bg-primary dark:bg-primary-fixed" />}
              </button>
            </div>
            
            <div className="p-6">
              {/* Tab: Tardanzas */}
              {activeTab === "tardanzas" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-headline-sm text-headline-sm text-on-surface dark:text-slate-100">Tardanzas reportadas</h5>
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-container dark:bg-slate-800 rounded-lg">
                      <Clock size={16} className="text-on-surface-variant dark:text-slate-300" />
                      <span className="font-label-md text-label-md text-on-surface-variant dark:text-slate-300">Historial de incidencias</span>
                    </div>
                  </div>
                  
                  {tardanzasList.length > 0 ? (
                    <div className="overflow-x-auto border border-outline-variant dark:border-slate-800 rounded-lg">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-surface-container-low dark:bg-slate-950 border-b border-outline-variant dark:border-slate-800">
                            <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant dark:text-slate-400">FECHA</th>
                            <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant dark:text-slate-400">DETALLES / OBSERVACIÓN</th>
                            <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant dark:text-slate-400">ESTADO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant dark:divide-slate-800">
                          {tardanzasList.map((tard) => (
                            <tr key={tard.id} className="hover:bg-surface-container-low dark:hover:bg-slate-900/50 transition-colors">
                              <td className="px-4 py-4 font-body-md text-body-md dark:text-slate-300 font-mono">
                                {formatSafeDate(tard.fecha, "dd MMM, yyyy")}
                              </td>
                              <td className="px-4 py-4 font-body-md text-body-md dark:text-slate-300">
                                <p>{tard.descripcion || "Tardanza reportada."}</p>
                                {tard.evidence_urls && tard.evidence_urls.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {tard.evidence_urls.map((url: string, idx: number) => (
                                      <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                                      >
                                        <img
                                          src={url}
                                          className="h-full w-full object-cover transition-transform hover:scale-110"
                                          alt={`Evidencia de tardanza ${idx + 1}`}
                                        />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 text-[10px] font-bold rounded">
                                  REPORTADA
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">No tiene tardanzas reportadas</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Inasistencias */}
              {activeTab === "inasistencias" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-headline-sm text-headline-sm text-on-surface dark:text-slate-100">Inasistencias reportadas</h5>
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-container dark:bg-slate-800 rounded-lg">
                      <AlertCircle size={16} className="text-on-surface-variant dark:text-slate-300" />
                      <span className="font-label-md text-label-md text-on-surface-variant dark:text-slate-300">Historial de incidencias</span>
                    </div>
                  </div>
                  
                  {inasistenciasList.length > 0 ? (
                    <div className="overflow-x-auto border border-outline-variant dark:border-slate-800 rounded-lg">
                      <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                          <tr className="bg-surface-container-low dark:bg-slate-950 border-b border-outline-variant dark:border-slate-800">
                            <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant dark:text-slate-400">FECHA</th>
                            <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant dark:text-slate-400">DETALLES / OBSERVACIÓN</th>
                            <th className="px-4 py-3 font-label-md text-label-md text-on-surface-variant dark:text-slate-400">ESTADO</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant dark:divide-slate-800">
                          {inasistenciasList.map((fal) => (
                            <tr key={fal.id} className="hover:bg-surface-container-low dark:hover:bg-slate-900/50 transition-colors">
                              <td className="px-4 py-4 font-body-md text-body-md dark:text-slate-300 font-mono">
                                {formatSafeDate(fal.fecha, "dd MMM, yyyy")}
                              </td>
                              <td className="px-4 py-4 font-body-md text-body-md dark:text-slate-300">
                                <p>{fal.descripcion || "Inasistencia reportada."}</p>
                                {fal.evidence_urls && fal.evidence_urls.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {fal.evidence_urls.map((url: string, idx: number) => (
                                      <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block h-14 w-14 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                                      >
                                        <img
                                          src={url}
                                          className="h-full w-full object-cover transition-transform hover:scale-110"
                                          alt={`Evidencia de inasistencia ${idx + 1}`}
                                        />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-[10px] font-bold rounded">
                                  REPORTADA
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Sin inasistencias reportadas</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Incidencias */}
              {activeTab === "incidencias" && (
                <div className="space-y-6">
                  <h5 className="font-headline-sm text-headline-sm text-on-surface dark:text-slate-100">Reportes de conducta</h5>
                  
                  {isIncidentsLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : incidenciasList.length > 0 ? (
                    <div className="space-y-4">
                      {incidenciasList.map((inc) => (
                        <div key={inc.id} className="p-6 border border-outline-variant dark:border-slate-800 rounded-xl flex gap-6 hover:border-primary dark:hover:border-primary-fixed transition-colors bg-white dark:bg-slate-950">
                          <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                            inc.severidad === 'grave' || inc.severidad === 'alto' 
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' 
                              : inc.severidad === 'moderada' || inc.severidad === 'medio'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' 
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          )}>
                            <AlertCircle size={24} />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                              <div>
                                <h6 className="font-bold text-base text-on-surface dark:text-slate-200 capitalize">
                                  {inc.tipo}
                                </h6>
                                <span className="text-xs text-on-surface-variant dark:text-slate-400">
                                  Reportado por: {inc.registrado_por} | {formatSafeDate(inc.fecha, "PPP")}
                                </span>
                              </div>
                              <span className={cn("px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider", getSeverityColor(inc.severidad))}>
                                {inc.severidad}
                              </span>
                            </div>
                            <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-300 leading-relaxed">
                              {inc.descripcion}
                            </p>
                            
                            {inc.accion_tomada && (
                              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded border border-emerald-100 dark:border-emerald-900/60">
                                <span className="font-bold">Medida correctiva:</span> {inc.accion_tomada}
                              </p>
                            )}

                            {inc.evidence_urls && inc.evidence_urls.length > 0 && (
                              <div className="flex gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-900">
                                {inc.evidence_urls.map((url: string, idx: number) => (
                                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="h-14 w-14 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden block">
                                    <img src={url} className="w-full h-full object-cover hover:scale-110 transition-transform" alt="Evidencia adjunta" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Sin incidencias disciplinarias</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Bitácora Tutor */}
              {activeTab === "bitacora" && (
                <div className="space-y-6">
                  <h5 className="font-headline-sm text-headline-sm text-on-surface dark:text-slate-100">Bitácora Privada del Tutor</h5>
                  
                  <div className="bg-surface-container dark:bg-slate-950 border border-outline-variant dark:border-slate-800 rounded-xl p-6">
                    <textarea 
                      value={tutorNote}
                      onChange={(e) => setTutorNote(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-outline-variant dark:border-slate-800 rounded-lg p-4 font-body-md text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-slate-200" 
                      placeholder="Escribe una nueva nota sobre el desempeño, comportamiento o seguimiento del estudiante..." 
                      rows={4}
                      disabled={isSavingNote}
                    />
                    <div className="flex justify-end mt-4">
                      <Button 
                        onClick={handleSaveTutorNote}
                        disabled={isSavingNote || !tutorNote.trim()}
                        className="bg-primary flex gap-2"
                      >
                        {isSavingNote && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isSavingNote ? "Guardando..." : "Guardar Nota Privada"}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {bitacoraList.length > 0 ? (
                      <div className="relative pl-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-0.5 before:bg-outline-variant dark:before:bg-slate-800">
                        {bitacoraList.map((note) => (
                          <div key={note.id} className="relative mb-6 last:mb-0">
                            <div className="absolute left-[-32px] top-1 h-6 w-6 bg-primary rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                              <Calendar size={12} className="text-white" />
                            </div>
                            <div className="bg-surface-container-low dark:bg-slate-900/60 border border-outline-variant dark:border-slate-800 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-2 text-xs">
                                <span className="font-bold text-on-surface dark:text-slate-200">
                                  Registrado por: {note.registrado_por}
                                </span>
                                <span className="font-caption text-caption text-on-surface-variant dark:text-slate-400 font-mono">
                                  {formatSafeDate(note.fecha, "PPP")}
                                </span>
                              </div>
                              <p className="font-body-md text-body-md text-on-surface-variant dark:text-slate-300 italic leading-relaxed">
                                "{note.descripcion}"
                              </p>
                              {note.evidence_urls && note.evidence_urls.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2 border-t border-outline-variant pt-3 dark:border-slate-800">
                                  {note.evidence_urls.map((url: string, idx: number) => (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block h-16 w-16 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                                    >
                                      <img
                                        src={url}
                                        className="h-full w-full object-cover transition-transform hover:scale-110"
                                        alt={`Evidencia de bitacora ${idx + 1}`}
                                      />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Aún no hay notas privadas en la bitácora</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Section: Performance Overview */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-card-gap">
              <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-800/80 rounded-xl p-container-padding card-shadow">
                <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-slate-800">
                  <h4 className="font-bold text-xs text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">Fortalezas</h4>
                  <div className="flex items-center gap-2">
                    {canEditStrengths && !isEditingStrengths && (
                      <button 
                        onClick={() => setIsEditingStrengths(true)} 
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        <Edit3 size={12} /> Editar
                      </button>
                    )}
                    <TrendingUp className="text-green-600 dark:text-green-400 h-5 w-5" />
                  </div>
                </div>
                {isEditingStrengths ? (
                  <textarea 
                    className="w-full min-h-[120px] p-3 text-sm border rounded-lg dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Escriba las fortalezas del alumno..."
                    value={fortalezas}
                    onChange={e => setFortalezas(e.target.value)}
                  />
                ) : student.fortalezas ? (
                  <div className="text-sm text-on-surface dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {student.fortalezas}
                  </div>
                ) : (
                  <p className="text-sm italic text-slate-400 dark:text-slate-500">Sin registrar</p>
                )}
              </div>
              
              <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-800/80 rounded-xl p-container-padding card-shadow">
                <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-slate-800">
                  <h4 className="font-bold text-xs text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">Por Mejorar</h4>
                  <div className="flex items-center gap-2">
                    {canEditStrengths && !isEditingStrengths && (
                      <button 
                        onClick={() => setIsEditingStrengths(true)} 
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        <Edit3 size={12} /> Editar
                      </button>
                    )}
                    <AlertCircle className="text-amber-600 dark:text-amber-400 h-5 w-5" />
                  </div>
                </div>
                {isEditingStrengths ? (
                  <textarea 
                    className="w-full min-h-[120px] p-3 text-sm border rounded-lg dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Escriba los aspectos por mejorar..."
                    value={porMejorar}
                    onChange={e => setPorMejorar(e.target.value)}
                  />
                ) : student.por_mejorar ? (
                  <div className="text-sm text-on-surface dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {student.por_mejorar}
                  </div>
                ) : (
                  <p className="text-sm italic text-slate-400 dark:text-slate-500">Sin registrar</p>
                )}
              </div>
            </div>

            {isEditingStrengths && (
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setFortalezas(student.fortalezas || "");
                    setPorMejorar(student.por_mejorar || "");
                    setIsEditingStrengths(false);
                  }}
                  disabled={isSavingStrengths}
                >
                  Cancelar
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveStrengths}
                  disabled={isSavingStrengths}
                  className="bg-primary text-white"
                >
                  {isSavingStrengths && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
    </>
  )
}
