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
import { IncidentAiSummary } from "@/components/incidents/IncidentAiSummary"
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
  const { toast } = useToast()

  const [isMounted, setIsMounted] = useState(false)
  
  const [student, setStudent] = useState<any>(null)
  const [isStudentLoading, setIsStudentLoading] = useState(true)
  const [studentError, setStudentError] = useState<Error | null>(null)
  
  const [incidents, setIncidents] = useState<any[]>([])
  const [isIncidentsLoading, setIsIncidentsLoading] = useState(true)
  const [incidentsError, setIncidentsError] = useState<Error | null>(null)

  const [attendance, setAttendance] = useState<any[]>([])
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true)

  // Estados de la Bitácora
  const [tutorNote, setTutorNote] = useState("")
  const [isSavingNote, setIsSavingNote] = useState(false)

  // Control de pestañas
  const [activeTab, setActiveTab] = useState<"tardanzas" | "inasistencias" | "incidencias" | "bitacora">("tardanzas")

  useEffect(() => {
    let mounted = true;
    setIsMounted(true)
    
    async function loadData() {
      if (!id || !user) return;
      
      // Load Student
      try {
        const { data: sData, error: sError } = await supabase
          .from('alumnos')
          .select('id, nombres, apellidos, estado, grado, seccion, dni, codigo_estudiante, nivel, fecha_nacimiento, apoderado, telefono, sexo, avatar_url')
          .eq('id', id)
          .single();
          
        if (sError) throw sError;
        if (mounted) setStudent(sData);
      } catch (err) {
        if (mounted) setStudentError(err as Error);
      } finally {
        if (mounted) setIsStudentLoading(false);
      }

      // Load Incidents
      try {
        const { data: iData, error: iError } = await supabase
          .from('incidencias')
          .select('id, tipo, registrado_por, fecha, severidad, descripcion, accion_tomada, evidence_urls')
          .eq('alumno_id', id)
          .order('fecha', { ascending: false });
          
        if (iError) throw iError;
        if (mounted) setIncidents(iData || []);
      } catch (err) {
        console.error("Error loading incidents:", err);
        if (mounted) setIncidents([]);
      } finally {
        if (mounted) setIsIncidentsLoading(false);
      }

      // Load Attendance History
      try {
        const { data: aData, error: aError } = await supabase
          .from('asistencias')
          .select('id, fecha, estado, observacion')
          .eq('alumno_id', id)
          .order('fecha', { ascending: false });

        if (aError) throw aError;
        if (mounted) setAttendance(aData || []);
      } catch (err) {
        console.error("Error loading attendance history:", err);
      } finally {
        if (mounted) setIsAttendanceLoading(false);
      }
    }
    
    if (!isUserLoading) {
      loadData();
    }
    
    return () => { mounted = false; };
  }, [id, user, isUserLoading])

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
          fecha: new Date().toISOString().split('T')[0]
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
        .select('id, tipo, registrado_por, fecha, severidad, descripcion, accion_tomada, evidence_urls')
        .eq('alumno_id', id)
        .order('fecha', { ascending: false });
      if (!iError && iData) {
        setIncidents(iData);
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

  // Filtrado de listas según tipo de registros
  const tardanzasList = attendance.filter(a => a.estado === 'tardanza')
  const inasistenciasList = attendance.filter(a => a.estado === 'falta')
  const incidenciasList = incidents.filter(i => i.tipo !== 'Observación académica')
  const bitacoraList = incidents.filter(i => i.tipo === 'Observación académica')

  // Cálculos dinámicos
  const totalAttendanceDays = attendance.length
  const attendanceRate = totalAttendanceDays > 0 
    ? Math.round(((totalAttendanceDays - inasistenciasList.length) / totalAttendanceDays) * 100) 
    : 100

  const conductaGeneral = incidenciasList.length === 0 
    ? "A - EXCELENTE" 
    : incidenciasList.length <= 2 
      ? "B - BUENA" 
      : "C - REGULAR"

  const conductaBadgeClass = incidenciasList.length === 0 
    ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300" 
    : incidenciasList.length <= 2 
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300" 
      : "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"

  const canEdit = user?.role === 'admin' || user?.role === 'director' || user?.role === 'subdirector'

  // Renderizador de Calendario Dinámico del Mes Actual
  const renderCalendar = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleString('es-ES', { month: 'long' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDay = (y: number, m: number) => {
      const day = new Date(y, m, 1).getDay();
      return day === 0 ? 6 : day - 1; // Lunes = 0, Domingo = 6
    };

    const days = getDaysInMonth(year, month);
    const startOffset = getFirstDay(year, month);
    const cells: React.ReactNode[] = [];

    // Celdas vacías previas
    for (let i = 0; i < startOffset; i++) {
      cells.push(
        <div key={`empty-${i}`} className="h-8 flex items-center justify-center text-body-md text-outline dark:text-slate-600">
          -
        </div>
      );
    }

    // Celdas del mes
    for (let day = 1; day <= days; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayRecord = attendance.find(a => a.fecha.startsWith(dateStr));
      
      let bgClass = "bg-white dark:bg-slate-900 text-on-surface dark:text-slate-200 hover:bg-surface-container";
      let weightClass = "";

      if (dayRecord) {
        if (dayRecord.estado === 'falta') {
          bgClass = "bg-red-500 text-white font-bold rounded-lg";
        } else if (dayRecord.estado === 'tardanza') {
          bgClass = "bg-amber-500 text-white font-bold rounded-lg";
        } else if (dayRecord.estado === 'presente') {
          bgClass = "bg-emerald-500 text-white font-bold rounded-lg";
        } else if (dayRecord.estado === 'justificado') {
          bgClass = "bg-blue-500 text-white font-bold rounded-lg";
        }
      }

      cells.push(
        <div 
          key={`day-${day}`} 
          className={cn("h-8 flex items-center justify-center text-body-md transition-colors", bgClass)}
          title={dayRecord ? `Estado: ${dayRecord.estado} ${dayRecord.observacion ? `(${dayRecord.observacion})` : ''}` : `Día ${day}`}
        >
          {day}
        </div>
      );
    }

    return (
      <div className="p-4 border border-outline-variant dark:border-slate-800 rounded-lg bg-surface-container-low dark:bg-slate-950">
        <p className="text-center font-bold text-sm mb-3 text-primary dark:text-primary-fixed uppercase tracking-wider">{capitalizedMonth} {year}</p>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, idx) => (
            <div key={idx} className="text-[10px] font-bold text-on-surface-variant dark:text-slate-400">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 justify-center text-[10px] font-bold border-t pt-3 dark:border-slate-800">
          <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Presente</div>
          <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Falta</div>
          <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Tardanza</div>
          <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" /> Justificado</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-[1440px] mx-auto pb-20">
      {/* Breadcrumb / Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <nav className="flex items-center gap-2 text-on-surface-variant dark:text-slate-400 font-label-md text-label-md mb-2">
            <Link href="/students" className="hover:text-primary dark:hover:text-primary-fixed transition-colors">Mis Secciones</Link>
            <ChevronRight size={14} className="text-slate-400" />
            <span>{student.grado} {student.seccion}</span>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-primary dark:text-primary-fixed font-bold">Historial del Estudiante</span>
          </nav>
          <h2 className="font-display-lg text-display-lg text-on-surface dark:text-slate-100">{student.nombres} {student.apellidos}</h2>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-surface-container dark:bg-slate-900 border border-outline-variant dark:border-slate-800 text-on-surface-variant dark:text-slate-200 font-label-md text-label-md rounded-lg hover:bg-surface-container-high dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
          >
            <Printer size={18} /> Imprimir Reporte
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
              
              <div className="grid grid-cols-2 w-full gap-4 pt-6 border-t border-outline-variant dark:border-slate-800">
                <div className="text-center">
                  <span className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400 block mb-1">ASISTENCIA</span>
                  <span className="font-display-md text-display-md text-primary dark:text-primary-fixed font-bold">{attendanceRate}%</span>
                </div>
                <div className="text-center border-l border-outline-variant dark:border-slate-800">
                  <span className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400 block mb-1">PROMEDIO</span>
                  <span className="font-display-md text-display-md text-green-700 dark:text-green-400 font-bold">16.5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-800/80 rounded-xl p-container-padding card-shadow">
            <h4 className="font-label-md text-label-md text-on-surface-variant dark:text-slate-400 uppercase tracking-wider mb-4">Detalles Académicos</h4>
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
                <span className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400">Conducta General</span>
                <span className={cn("px-2 py-1 text-[10px] font-bold rounded uppercase", conductaBadgeClass)}>
                  {conductaGeneral}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400">DNI</span>
                <span className="font-label-md text-label-md text-on-surface dark:text-slate-200 font-mono">{student.dni || "73849501"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400">Código y Nivel</span>
                <span className="font-label-md text-label-md text-on-surface dark:text-slate-200">{student.codigo_estudiante || "STU-202409"} ({student.nivel || "Secundaria"})</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400">Nacimiento</span>
                <span className="font-label-md text-label-md text-on-surface dark:text-slate-200">{student.fecha_nacimiento ? formatSafeDate(student.fecha_nacimiento) : "12 de abr. de 2011"}</span>
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
                <span className="font-label-md text-label-md text-on-surface dark:text-slate-200">{student.apoderado || "María Sosa"}</span>
                <span className="font-caption text-caption text-on-surface-variant dark:text-slate-400">Madre / Apoderado</span>
              </div>
            </div>
            <a href={`tel:${student.telefono || "987654321"}`} className="block w-full">
              <button className="w-full py-2 border border-primary dark:border-primary-fixed text-primary dark:text-primary-fixed font-label-md text-label-md rounded-lg hover:bg-primary-fixed-dim dark:hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
                <Phone size={18} /> Llamar Ahora
              </button>
            </a>
          </div>
        </div>

        {/* Right Column: Tabs and Details */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* AI Incident Analysis Summary */}
          <IncidentAiSummary student={student} incidents={incidents || []} />

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
                TARDANZAS ({tardanzasList.length})
                {activeTab === "tardanzas" && <div className="active-tab-indicator bg-primary dark:bg-primary-fixed" />}
              </button>
              
              <button 
                onClick={() => setActiveTab("inasistencias")}
                className={cn(
                  "px-6 py-4 relative font-label-md text-label-md whitespace-nowrap transition-colors",
                  activeTab === "inasistencias" ? "text-primary dark:text-primary-fixed font-bold" : "text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed"
                )}
              >
                INASISTENCIAS ({inasistenciasList.length})
                {activeTab === "inasistencias" && <div className="active-tab-indicator bg-primary dark:bg-primary-fixed" />}
              </button>
              
              <button 
                onClick={() => setActiveTab("incidencias")}
                className={cn(
                  "px-6 py-4 relative font-label-md text-label-md whitespace-nowrap transition-colors",
                  activeTab === "incidencias" ? "text-primary dark:text-primary-fixed font-bold" : "text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-primary-fixed"
                )}
              >
                INCIDENCIAS REC. ({incidenciasList.length})
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
                    <h5 className="font-headline-sm text-headline-sm text-on-surface dark:text-slate-100">Registro de Tardanzas</h5>
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-container dark:bg-slate-800 rounded-lg">
                      <Clock size={16} className="text-on-surface-variant dark:text-slate-300" />
                      <span className="font-label-md text-label-md text-on-surface-variant dark:text-slate-300">Historial Completo</span>
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
                                {tard.observacion || "Marcado como Tardanza en asistencia diaria."}
                              </td>
                              <td className="px-4 py-4">
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300 text-[10px] font-bold rounded">
                                  REGISTRADA
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">No tiene tardanzas registradas</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Inasistencias */}
              {activeTab === "inasistencias" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h5 className="font-headline-sm text-headline-sm text-on-surface dark:text-slate-100 mb-4">Calendario de Asistencia</h5>
                    {renderCalendar()}
                  </div>
                  <div>
                    <h5 className="font-headline-sm text-headline-sm text-on-surface dark:text-slate-100 mb-4">Detalle de Faltas</h5>
                    {inasistenciasList.length > 0 ? (
                      <ul className="space-y-3">
                        {inasistenciasList.map((fal) => (
                          <li key={fal.id} className="p-3 border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 rounded-r-lg">
                            <span className="font-label-md text-label-md block dark:text-slate-300 font-mono">
                              {formatSafeDate(fal.fecha, "dd MMMM, yyyy")}
                            </span>
                            <span className="font-body-md text-body-md text-on-surface-variant dark:text-slate-400">
                              {fal.observacion || "Inasistencia marcada en el parte diario."}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-center py-10 bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Sin inasistencias registradas</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Incidencias */}
              {activeTab === "incidencias" && (
                <div className="space-y-6">
                  <h5 className="font-headline-sm text-headline-sm text-on-surface dark:text-slate-100">Incidencias Recientes</h5>
                  
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-card-gap">
            <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-800/80 rounded-xl p-container-padding card-shadow">
              <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-slate-800">
                <h4 className="font-bold text-xs text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">Fortalezas</h4>
                <TrendingUp className="text-green-600 dark:text-green-400 h-5 w-5" />
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-on-surface dark:text-slate-300">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full" /> Participación activa en clase.
                </li>
                <li className="flex items-center gap-2 text-sm text-on-surface dark:text-slate-300">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full" /> Excelente nivel de redacción.
                </li>
                <li className="flex items-center gap-2 text-sm text-on-surface dark:text-slate-300">
                  <span className="h-1.5 w-1.5 bg-green-500 rounded-full" /> Liderazgo positivo en grupos.
                </li>
              </ul>
            </div>
            
            <div className="bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant dark:border-slate-800/80 rounded-xl p-container-padding card-shadow">
              <div className="flex justify-between items-center mb-4 border-b pb-2 dark:border-slate-800">
                <h4 className="font-bold text-xs text-on-surface-variant dark:text-slate-400 uppercase tracking-wider">Por Mejorar</h4>
                <AlertCircle className="text-amber-600 dark:text-amber-400 h-5 w-5" />
              </div>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-on-surface dark:text-slate-300">
                  <span className="h-1.5 w-1.5 bg-amber-500 rounded-full" /> Organización de materiales.
                </li>
                <li className="flex items-center gap-2 text-sm text-on-surface dark:text-slate-300">
                  <span className="h-1.5 w-1.5 bg-amber-500 rounded-full" /> Puntualidad en el ingreso matutino.
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}