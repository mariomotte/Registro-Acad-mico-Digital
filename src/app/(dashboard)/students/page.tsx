"use client"

import { useState, useEffect } from "react"
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
import Link from "next/link"
import { Alumno } from "@/types"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getUserAvatar } from "@/lib/avatar"

export default function StudentsPage() {
  const { user } = useSupabaseAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [students, setStudents] = useState<Alumno[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const limit = 50

  const [filters, setFilters] = useState({
    grado: "todos",
    seccion: "todos",
    estado: "todos"
  })

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
        let query = supabase
          .from('alumnos')
          .select('id, nombres, apellidos, dni, grado, seccion, nivel, estado, avatar_url, sexo', { count: 'exact' })

        if (filters.grado !== "todos") {
          query = query.eq('grado', filters.grado)
        }
        if (filters.seccion !== "todos") {
          query = query.eq('seccion', filters.seccion)
        }
        if (filters.estado !== "todos") {
          query = query.eq('estado', filters.estado)
        }
        if (debouncedSearch.trim() !== "") {
          query = query.or(`nombres.ilike.%${debouncedSearch}%,apellidos.ilike.%${debouncedSearch}%`)
        }

        const from = (page - 1) * limit
        const to = from + limit - 1

        query = query.order('apellidos', { ascending: true }).range(from, to)

        const { data, count, error } = await query

        if (error) throw error

        if (mounted) {
          setStudents((data || []) as unknown as Alumno[])
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
  }, [page, filters, debouncedSearch])

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

  const totalPages = Math.ceil(totalCount / limit)
  const hasActiveFilters = searchTerm !== "" || filters.grado !== "todos" || filters.seccion !== "todos" || filters.estado !== "todos"

  const gradosDisponibles = ["1ro", "2do", "3ro", "4to", "5to", "6to", "1ro Sec", "2do Sec", "3ro Sec", "4to Sec", "5to Sec"]
  const seccionesDisponibles = ["A", "B", "C", "D"]

  const canEdit = user?.role === 'admin' || user?.role === 'director' || user?.role === 'subdirector'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline">Alumnos</h2>
          <p className="text-muted-foreground">Gestiona la base de datos de estudiantes y sus registros.</p>
        </div>
        {canEdit && (
          <Button asChild className="bg-primary">
            <Link href="/students/new">
              <UserPlus className="mr-2 h-4 w-4" /> Registrar Alumno
            </Link>
          </Button>
        )}
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
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando alumnos...</p>
          </div>
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
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
                            <AvatarFallback className="bg-slate-100 dark:bg-white/5 text-slate-650 dark:text-slate-300 text-xs font-bold">
                              {student.nombres?.[0] || ""}{student.apellidos?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-slate-100 leading-tight group-hover:text-primary transition-colors">
                              {student.apellidos}, {student.nombres}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium md:hidden mt-0.5">DNI: {student.dni}</span>
                          </div>
                        </div>
                      </TableCell>
                       <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">{student.dni}</TableCell>
                      <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-white/5">
                            {student.grado}
                          </span>
                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-md text-xs font-extrabold border border-primary/15">
                            {student.seccion}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden lg:inline font-semibold">({student.nivel})</span>
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
                        <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-slate-600 dark:text-slate-350 hover:text-primary dark:hover:bg-white/5 rounded-lg">
                          <Link href={`/students/${student.id}`}>
                            <Eye size={13} />
                            <span className="hidden sm:inline">Ficha</span>
                          </Link>
                        </Button>
                        {canEdit && (
                          <Button variant="ghost" size="sm" asChild className="h-8 gap-1 text-slate-600 dark:text-slate-350 hover:text-primary dark:hover:bg-white/5 rounded-lg">
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
              <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/50">
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
                  <span className="text-xs font-semibold text-slate-700">
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