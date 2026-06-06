"use client"

import { useState, useEffect } from "react"
import type { FormEvent } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Search, UserPlus, Filter, X, RotateCcw, Loader2, ChevronLeft, ChevronRight, Edit3, Eye } from "lucide-react"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { logAudit } from "@/lib/audit"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Alumno } from "@/types"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getUserAvatar } from "@/lib/avatar"

export default function StudentsPage() {
  const { user } = useSupabaseAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [students, setStudents] = useState<Alumno[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [sectionSummary, setSectionSummary] = useState<Array<{ grado: string; secciones: string[]; total: number }>>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newStudent, setNewStudent] = useState({
    nombres: "",
    apellidos: "",
    dni: "",
    grado: "",
    seccion: "",
    estado: "Activo" as "Activo" | "Inactivo" | "Suspendido",
    apoderado: "",
    telefono: "",
    fecha_nacimiento: ""
  })
  const limit = 50

  const [filters, setFilters] = useState({
    grado: "todos",
    seccion: "todos",
    estado: "todos"
  })
  const isDocente = user?.role === 'docente'
  const hasTutorSection = Boolean(user?.tutor_grado && user?.tutor_seccion)

  const gradosDisponibles = ["1°", "2°", "3°", "4°", "5°"]
  const seccionesDisponibles = ["A", "B", "C", "D"]
  const gradeOrder: Record<string, number> = {
    "1°": 1,
    "2°": 2,
    "3°": 3,
    "4°": 4,
    "5°": 5
  }

  const sortStudents = (items: Alumno[]) => {
    return [...items].sort((a, b) => {
      const gradeDiff = (gradeOrder[a.grado] || 99) - (gradeOrder[b.grado] || 99)
      if (gradeDiff !== 0) return gradeDiff
      const sectionDiff = String(a.seccion || "").localeCompare(String(b.seccion || ""), "es")
      if (sectionDiff !== 0) return sectionDiff
      return `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`, "es")
    })
  }

  // Debounce search term to avoid excessive database calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setPage(1) // Reset to page 1 on search change
    }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    let mounted = true
    async function loadStudents() {
      setIsLoading(true)
      try {
        if (isDocente && !hasTutorSection) {
          if (mounted) {
            setStudents([])
            setTotalCount(0)
          }
          return
        }

        let query = supabase
          .from('alumnos')
          .select('id, nombres, apellidos, dni, grado, seccion, nivel, estado, sexo', { count: 'exact' })

        if (isDocente) {
          query = query
            .eq('grado', user?.tutor_grado)
            .eq('seccion', user?.tutor_seccion)
        } else if (filters.grado !== "todos") {
          query = query.eq('grado', filters.grado)
        }
        if (!isDocente && filters.seccion !== "todos") {
          query = query.eq('seccion', filters.seccion)
        }
        if (filters.estado !== "todos") {
          query = query.eq('estado', filters.estado)
        }
        if (debouncedSearch.trim() !== "") {
          query = query.or(`nombres.ilike.%${debouncedSearch}%,apellidos.ilike.%${debouncedSearch}%,dni.ilike.%${debouncedSearch}%`)
        }

        const from = (page - 1) * limit
        const to = from + limit - 1

        query = query.order('grado', { ascending: false }).order('seccion', { ascending: true }).order('apellidos', { ascending: true }).range(from, to)

        const { data, count, error } = await query

        if (error) throw error

        if (mounted) {
          setStudents(sortStudents((data || []) as unknown as Alumno[]))
          setTotalCount(count || 0)
        }
      } catch (err) {
        console.error("Error loading students:", err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadStudents()
    return () => { mounted = false }
  }, [page, filters, debouncedSearch, refreshKey, isDocente, hasTutorSection, user?.tutor_grado, user?.tutor_seccion])

  useEffect(() => {
    let mounted = true

    async function loadSectionSummary() {
      if (isDocente && !hasTutorSection) {
        if (mounted) setSectionSummary([])
        return
      }

      let query = supabase
        .from('alumnos')
        .select('grado, seccion')
        .eq('estado', 'Activo')

      if (isDocente) {
        query = query
          .eq('grado', user?.tutor_grado)
          .eq('seccion', user?.tutor_seccion)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error loading section summary:", error)
        return
      }

      if (!mounted) return

      const grouped = new Map<string, { secciones: Set<string>; total: number }>()
      ;(data || []).forEach((row: any) => {
        const grado = row.grado || "Sin grado"
        const current = grouped.get(grado) || { secciones: new Set<string>(), total: 0 }
        if (row.seccion) current.secciones.add(row.seccion)
        current.total += 1
        grouped.set(grado, current)
      })

      setSectionSummary(
        Array.from(grouped.entries())
          .map(([grado, value]) => ({
            grado,
            secciones: Array.from(value.secciones).sort((a, b) => a.localeCompare(b, "es")),
            total: value.total
          }))
          .sort((a, b) => (gradeOrder[a.grado] || 99) - (gradeOrder[b.grado] || 99))
      )
    }

    loadSectionSummary()
    return () => { mounted = false }
  }, [refreshKey, isDocente, hasTutorSection, user?.tutor_grado, user?.tutor_seccion])

  const resetFilters = () => {
    setFilters({
      grado: "todos",
      seccion: "todos",
      estado: "todos"
    })
    setSearchTerm("")
    setPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const loadStudentsAfterCreate = () => {
    setPage(1)
    setDebouncedSearch(searchTerm)
    setRefreshKey(prev => prev + 1)
  }

  const handleCreateStudent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return

    if (newStudent.nombres.trim().length < 2 || newStudent.apellidos.trim().length < 2 || !newStudent.grado || !newStudent.seccion) {
      toast({
        variant: "destructive",
        title: "Datos incompletos",
        description: "Nombres, apellidos, grado y seccion son obligatorios."
      })
      return
    }

    if (newStudent.dni && !/^\d{8}$/.test(newStudent.dni)) {
      toast({
        variant: "destructive",
        title: "DNI invalido",
        description: "Si registras DNI, debe tener 8 digitos."
      })
      return
    }

    setIsCreating(true)
    try {
      const payload = {
        nombres: newStudent.nombres.trim(),
        apellidos: newStudent.apellidos.trim(),
        dni: newStudent.dni.trim() || null,
        codigo_estudiante: null,
        grado: newStudent.grado,
        seccion: newStudent.seccion,
        nivel: "Secundaria",
        estado: newStudent.estado,
        apoderado: newStudent.apoderado.trim() || null,
        telefono: newStudent.telefono.trim() || null,
        fecha_nacimiento: newStudent.fecha_nacimiento || null,
        sexo: "M"
      }

      const { data, error } = await supabase
        .from('alumnos')
        .insert([payload])
        .select('id')
        .single()

      if (error) {
        if (error.code === '23505') throw new Error("Ya existe un alumno con ese DNI.")
        throw error
      }

      await logAudit({
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        modulo: 'ALUMNOS',
        accion: 'CREAR_ALUMNO',
        registroId: data?.id,
        descripcion: `Registro al alumno ${payload.nombres} ${payload.apellidos}.`,
        datosNuevos: payload
      })

      toast({
        title: "Alumno registrado",
        description: `${payload.nombres} ${payload.apellidos} fue agregado correctamente.`
      })
      setNewStudent({ nombres: "", apellidos: "", dni: "", grado: "", seccion: "", estado: "Activo", apoderado: "", telefono: "", fecha_nacimiento: "" })
      setIsCreateOpen(false)
      loadStudentsAfterCreate()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo registrar",
        description: error.message || "Revisa los datos e intenta nuevamente."
      })
    } finally {
      setIsCreating(false)
    }
  }

  const totalPages = Math.ceil(totalCount / limit)
  const hasActiveFilters = searchTerm !== "" || filters.grado !== "todos" || filters.seccion !== "todos" || filters.estado !== "todos"

  const canEdit = user?.role === 'admin' || user?.role === 'director' || user?.role === 'subdirector'

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-teal-900/10 bg-gradient-to-r from-teal-700 to-slate-800 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
            <h2 className="text-2xl font-bold tracking-tight font-headline">{isDocente ? "Mis alumnos" : "Alumnos"}</h2>
            <p className="text-sm font-medium text-white/75">
              {isDocente
                ? hasTutorSection
                  ? `Sección asignada: ${user?.tutor_grado} ${user?.tutor_seccion}.`
                  : "Aún no tienes una sección de tutoría asignada."
                : "Base de estudiantes de secundaria, ordenada por grado y seccion."}
            </p>
        </div>
        {canEdit && (
            <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <SheetTrigger asChild>
                <Button className="bg-white text-teal-800 hover:bg-white/90">
              <UserPlus className="mr-2 h-4 w-4" /> Registrar Alumno
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>Registrar alumno</SheetTitle>
                </SheetHeader>
                <form onSubmit={handleCreateStudent} className="grid gap-5 py-6">
                  <div className="rounded-xl border border-teal-500/20 bg-teal-500/10 p-3 text-xs font-semibold text-teal-800 dark:text-teal-200">
                    Nivel secundario asignado automaticamente. Solo nombres, apellidos, grado y seccion son obligatorios.
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="new-nombres">Nombres</Label>
                      <Input id="new-nombres" value={newStudent.nombres} onChange={(e) => setNewStudent(prev => ({ ...prev, nombres: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-apellidos">Apellidos</Label>
                      <Input id="new-apellidos" value={newStudent.apellidos} onChange={(e) => setNewStudent(prev => ({ ...prev, apellidos: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>DNI opcional</Label>
                      <Input maxLength={8} value={newStudent.dni} onChange={(e) => setNewStudent(prev => ({ ...prev, dni: e.target.value.replace(/\D/g, "") }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Grado</Label>
                      <Select value={newStudent.grado} onValueChange={(value) => setNewStudent(prev => ({ ...prev, grado: value }))}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          {gradosDisponibles.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Seccion</Label>
                      <Select value={newStudent.seccion} onValueChange={(value) => setNewStudent(prev => ({ ...prev, seccion: value }))}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>
                          {seccionesDisponibles.map(s => <SelectItem key={s} value={s}>Seccion {s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select value={newStudent.estado} onValueChange={(value: "Activo" | "Inactivo" | "Suspendido") => setNewStudent(prev => ({ ...prev, estado: value }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Activo">Activo</SelectItem>
                          <SelectItem value="Inactivo">Inactivo</SelectItem>
                          <SelectItem value="Suspendido">Suspendido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha nacimiento opcional</Label>
                      <Input type="date" value={newStudent.fecha_nacimiento} onChange={(e) => setNewStudent(prev => ({ ...prev, fecha_nacimiento: e.target.value }))} />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Apoderado opcional</Label>
                      <Input value={newStudent.apoderado} onChange={(e) => setNewStudent(prev => ({ ...prev, apoderado: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefono opcional</Label>
                      <Input value={newStudent.telefono} onChange={(e) => setNewStudent(prev => ({ ...prev, telefono: e.target.value }))} />
                    </div>
                  </div>

                  <SheetFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Guardar alumno
                    </Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
        )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {sectionSummary.map(item => (
          <button
            key={item.grado}
            type="button"
            onClick={() => handleFilterChange("grado", item.grado)}
            className={`rounded-xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 ${
              filters.grado === item.grado
                ? "border-teal-500 bg-teal-600 text-white"
                : "border-teal-900/10 bg-teal-50 text-teal-950 hover:bg-teal-100 dark:bg-teal-950/30 dark:text-teal-100"
            }`}
          >
            <p className="text-xs font-black uppercase tracking-wide">{item.grado}</p>
            <p className="mt-1 text-lg font-black">{item.secciones.length} secciones</p>
            <p className="text-[11px] font-semibold opacity-75">{item.secciones.join(", ") || "Sin seccion"} - {item.total} alumnos</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por nombres, apellidos o DNI..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-primary">
              <RotateCcw className="mr-2 h-4 w-4" /> Limpiar
            </Button>
          )}

          {!isDocente && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className={hasActiveFilters ? "border-primary text-primary bg-primary/5" : ""}>
                <Filter className="mr-2 h-4 w-4" /> 
                Filtros {hasActiveFilters && <Badge variant="secondary" className="ml-2 px-1 h-4 min-w-4 text-[10px]">!</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros Avanzados</SheetTitle>
              </SheetHeader>
              <div className="grid gap-6 py-6">
                <div className="space-y-2">
                  <Label>Grado Académico</Label>
                  <Select 
                    value={filters.grado} 
                    onValueChange={(val) => handleFilterChange("grado", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los grados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los grados</SelectItem>
                      {gradosDisponibles.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sección</Label>
                  <Select 
                    value={filters.seccion} 
                    onValueChange={(val) => handleFilterChange("seccion", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las secciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las secciones</SelectItem>
                      {seccionesDisponibles.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estado del Alumno</Label>
                  <Select 
                    value={filters.estado} 
                    onValueChange={(val) => handleFilterChange("estado", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="Activo">Activo</SelectItem>
                      <SelectItem value="Inactivo">Inactivo</SelectItem>
                      <SelectItem value="Suspendido">Suspendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter className="flex-col gap-2 sm:flex-col">
                <SheetClose asChild>
                  <Button className="w-full">Aplicar Filtros</Button>
                </SheetClose>
                <Button variant="ghost" onClick={resetFilters} className="w-full">Limpiar Todo</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-surface-container-low p-3 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <span className="font-black uppercase text-slate-500">Estados:</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Activo</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-1 text-red-700"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Suspendido</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/10 px-2 py-1 text-slate-700 dark:text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-slate-500" /> Inactivo</span>
      </div>

      <div className="rounded-2xl border border-teal-900/10 bg-surface-container-lowest shadow-sm overflow-x-auto dark:border-white/10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando alumnos...</p>
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-container dark:bg-slate-900">
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Nombres y Apellidos</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">DNI</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Grado y Sección</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Estado</TableHead>
                  <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length > 0 ? (
                  students.map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/50 transition-colors group">
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-slate-100 dark:border-white/5 shrink-0">
                            <AvatarImage src={getUserAvatar(student)} alt={`${student.nombres} ${student.apellidos}`} />
                            <AvatarFallback className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-bold">
                              {student.nombres?.[0] || ""}{student.apellidos?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-primary transition-colors">
                              {student.apellidos}, {student.nombres}
                            </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium md:hidden mt-0.5">DNI: {student.dni || "Sin registrar"}</span>
                          </div>
                        </div>
                      </TableCell>
                       <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">{student.dni || "Sin registrar"}</TableCell>
                      <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-white/5">
                            {student.grado}
                          </span>
                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-extrabold border border-primary/15">
                            {student.seccion}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          student.estado === 'Activo' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' : 
                          student.estado === 'Suspendido' ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20' :
                          'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            student.estado === 'Activo' ? 'bg-emerald-500 animate-pulse' : 
                            student.estado === 'Suspendido' ? 'bg-red-500' :
                            'bg-slate-500'
                          }`} />
                          {student.estado}
                        </span>
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-1 pt-4">
                        <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:bg-white/5 rounded-lg">
                          <Link href={`/students/${student.id}`}>
                            <Eye size={13} />
                            <span className="hidden sm:inline">Ficha</span>
                          </Link>
                        </Button>
                        {canEdit && (
                          <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:bg-white/5 rounded-lg">
                            <Link href={`/students/${student.id}/edit`}>
                              <Edit3 size={13} />
                              <span className="hidden sm:inline">Editar</span>
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <X className="h-8 w-8 text-slate-200 mb-2" />
                        <p>No se encontraron alumnos con los criterios seleccionados.</p>
                        <Button variant="link" onClick={resetFilters} className="text-primary font-bold">Ver todos</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t bg-surface-container-low dark:bg-slate-900">
                <span className="text-xs text-muted-foreground">
                  Mostrando del {(page - 1) * limit + 1} al {Math.min(page * limit, totalCount)} de {totalCount} estudiantes
                </span>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={16} className="mr-1" /> Anterior
                  </Button>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Página {page} de {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Siguiente <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
