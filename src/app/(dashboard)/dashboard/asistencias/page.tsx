"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck, Save, Loader2, Search, Check, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { logAudit } from "@/lib/audit"

interface StudentAttendanceState {
  alumno_id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  estado: 'Presente' | 'Falta' | 'Tardanza' | 'Justificado';
  observacion: string;
  existingId?: string;
}

export default function AsistenciasPage() {
  const { user } = useSupabaseAuth()
  const { toast } = useToast()

  const [grado, setGrado] = useState("")
  const [seccion, setSeccion] = useState("")
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  
  const [students, setStudents] = useState<StudentAttendanceState[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const gradosDisponibles = ["1ro", "2do", "3ro", "4to", "5to", "6to", "1ro Sec", "2do Sec", "3ro Sec", "4to Sec", "5to Sec"]
  const seccionesDisponibles = ["A", "B", "C", "D"]

  const loadAttendanceList = async () => {
    if (!grado || !seccion) {
      toast({
        variant: "destructive",
        title: "Campos vacíos",
        description: "Por favor seleccione Grado y Sección."
      })
      return
    }

    setIsLoading(true)
    setHasLoaded(false)

    try {
      // 1. Get students of selected grade and section
      const { data: alumnosData, error: alumnosError } = await supabase
        .from('alumnos')
        .select('id, nombres, apellidos, dni')
        .eq('grado', grado)
        .eq('seccion', seccion)
        .eq('estado', 'Activo')
        .order('apellidos', { ascending: true })

      if (alumnosError) throw alumnosError

      if (!alumnosData || alumnosData.length === 0) {
        setStudents([])
        setHasLoaded(true)
        return
      }

      const studentIds = alumnosData.map(a => a.id)

      // 2. Get existing attendance for this date and students
      const { data: asistenciasData, error: asistenciasError } = await supabase
        .from('asistencias')
        .select('id, alumno_id, estado, observacion')
        .in('alumno_id', studentIds)
        .eq('fecha', fecha)

      if (asistenciasError) throw asistenciasError

      // 3. Map students to attendance state, matching existing records if present
      const mappedStudents: StudentAttendanceState[] = alumnosData.map(student => {
        const existing = asistenciasData?.find(a => a.alumno_id === student.id)
        return {
          alumno_id: student.id,
          nombres: student.nombres,
          apellidos: student.apellidos,
          dni: student.dni,
          estado: existing ? (existing.estado as any) : 'Presente',
          observacion: existing ? (existing.observacion || '') : '',
          existingId: existing ? existing.id : undefined
        }
      })

      setStudents(mappedStudents)
      setHasLoaded(true)

      if (asistenciasData && asistenciasData.length > 0) {
        toast({
          title: "Registros encontrados",
          description: `Se cargaron ${asistenciasData.length} registros existentes para esta fecha.`,
        })
      }
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error al cargar",
        description: "No se pudo obtener la lista de asistencia."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = (studentId: string, status: 'Presente' | 'Falta' | 'Tardanza' | 'Justificado') => {
    setStudents(prev => prev.map(s => s.alumno_id === studentId ? { ...s, estado: status } : s))
  }

  const handleObservacionChange = (studentId: string, text: string) => {
    setStudents(prev => prev.map(s => s.alumno_id === studentId ? { ...s, observacion: text } : s))
  }

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)

    try {
      const uploaderName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Docente'
      
      const payload = students.map(s => ({
        alumno_id: s.alumno_id,
        fecha: fecha,
        estado: s.estado,
        observacion: s.observacion || null,
        registrado_por: uploaderName,
        registrador_user_id: user.id
      }))

      // Use conflict handling on alumno_id and fecha
      const { error } = await supabase
        .from('asistencias')
        .upsert(payload, { onConflict: 'alumno_id,fecha' })

      if (error) throw error

      // Audit Log register
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        modulo: 'ASISTENCIAS',
        accion: 'GUARDAR_ASISTENCIA',
        descripcion: `Registró la asistencia del ${grado} "${seccion}" para la fecha ${fecha}.`,
        datosNuevos: payload
      })

      toast({
        title: "Asistencia guardada",
        description: "La asistencia del día ha sido registrada con éxito."
      })
      
      // Reload to update UI and IDs
      await loadAttendanceList()
    } catch (err: any) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: err.message || "Ocurrió un error al guardar la asistencia."
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline">Registro de Asistencia</h2>
        <p className="text-muted-foreground">Toma control diario de la asistencia y puntualidad de los alumnos.</p>
      </div>

      <Card className="border-none shadow-md">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4 items-end">
            <div className="space-y-2">
              <Label>Grado Académico</Label>
              <Select value={grado} onValueChange={setGrado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione grado" />
                </SelectTrigger>
                <SelectContent>
                  {gradosDisponibles.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Sección</Label>
              <Select value={seccion} onValueChange={setSeccion}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione sección" />
                </SelectTrigger>
                <SelectContent>
                  {seccionesDisponibles.map(s => (
                    <SelectItem key={s} value={s}>Sección {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input 
                type="date" 
                value={fecha} 
                max={new Date().toISOString().slice(0, 10)} 
                onChange={(e) => setFecha(e.target.value)} 
              />
            </div>

            <Button 
              className="bg-primary flex gap-2 h-10 w-full md:w-auto" 
              onClick={loadAttendanceList} 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search size={16} />}
              Cargar Alumnos
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasLoaded && (
        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarCheck className="text-primary" size={20} />
                Ficha de Control - {grado} "{seccion}"
              </CardTitle>
              <CardDescription>Estudiantes registrados y listos para marcar asistencia.</CardDescription>
            </div>
            <Badge variant="outline" className="bg-white border-primary/20 text-primary">
              Fecha: {fecha}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {students.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="w-1/3">Estudiante</TableHead>
                    <TableHead className="w-1/3 text-center">Estado</TableHead>
                    <TableHead className="w-1/3">Observación / Justificación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.alumno_id} className="hover:bg-slate-50/40">
                      <TableCell className="font-semibold text-slate-800">
                        {student.apellidos}, {student.nombres}
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{student.dni}</div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <div className="flex justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.alumno_id, 'Presente')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              student.estado === 'Presente' 
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                            }`}
                          >
                            Presente
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.alumno_id, 'Falta')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              student.estado === 'Falta' 
                                ? 'bg-red-500 text-white border-red-600 shadow-sm' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                            }`}
                          >
                            Falta
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.alumno_id, 'Tardanza')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              student.estado === 'Tardanza' 
                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                            }`}
                          >
                            Tardanza
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.alumno_id, 'Justificado')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                              student.estado === 'Justificado' 
                                ? 'bg-blue-500 text-white border-blue-600 shadow-sm' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                            }`}
                          >
                            Justificado
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Nota (ej. cita médica, tardanza bus...)" 
                          value={student.observacion}
                          onChange={(e) => handleObservacionChange(student.alumno_id, e.target.value)}
                          className="h-8 text-xs"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-2">
                <AlertCircle className="h-10 w-10 text-amber-500" />
                <h3 className="font-bold text-slate-700">Sin Alumnos</h3>
                <p className="text-sm text-slate-400">No se encontraron estudiantes registrados y activos para esta sección.</p>
              </div>
            )}
          </CardContent>
          {students.length > 0 && (
            <CardFooter className="bg-slate-50 border-t py-4 flex justify-between">
              <span className="text-xs text-muted-foreground">
                Se guardarán los registros para {students.length} estudiantes.
              </span>
              <Button onClick={handleSave} disabled={isSaving} className="bg-primary flex gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={16} />}
                {isSaving ? "Guardando..." : "Guardar Asistencias"}
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  )
}
