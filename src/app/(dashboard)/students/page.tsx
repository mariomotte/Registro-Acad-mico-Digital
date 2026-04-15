
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
import { Search, UserPlus, Filter, X, RotateCcw, Loader2 } from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import Link from "next/link"
import { Alumno } from "@/types"

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    grado: "todos",
    seccion: "todos",
    estado: "todos"
  })

  const db = useFirestore()
  
  const studentsQuery = useMemoFirebase(() => {
    return query(collection(db, "students"), orderBy("apellido", "asc"))
  }, [db])

  const { data: students, isLoading } = useCollection<Alumno>(studentsQuery)

  const resetFilters = () => {
    setFilters({
      grado: "todos",
      seccion: "todos",
      estado: "todos"
    })
    setSearchTerm("")
  }

  const filteredStudents = (students || []).filter((student) => {
    const matchesSearch = `${student.nombre} ${student.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGrado = filters.grado === "todos" || student.grado === filters.grado
    const matchesSeccion = filters.seccion === "todos" || student.seccion === filters.seccion
    const matchesEstado = filters.estado === "todos" || student.estado === filters.estado

    return matchesSearch && matchesGrado && matchesSeccion && matchesEstado
  })

  // Obtener valores únicos para los selectores de filtros dinámicamente
  const grados = Array.from(new Set((students || []).map(s => s.grado))).sort()
  const secciones = Array.from(new Set((students || []).map(s => s.seccion))).sort()

  const hasActiveFilters = searchTerm !== "" || filters.grado !== "todos" || filters.seccion !== "todos" || filters.estado !== "todos"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline">Alumnos</h2>
          <p className="text-muted-foreground">Gestiona la base de datos de estudiantes y sus registros.</p>
        </div>
        <Button asChild className="bg-primary">
          <Link href="/students/new">
            <UserPlus className="mr-2 h-4 w-4" /> Registrar Alumno
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por nombre o apellido..." 
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
                    onValueChange={(val) => setFilters(prev => ({ ...prev, grado: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los grados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los grados</SelectItem>
                      {grados.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Sección</Label>
                  <Select 
                    value={filters.seccion} 
                    onValueChange={(val) => setFilters(prev => ({ ...prev, seccion: val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las secciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las secciones</SelectItem>
                      {secciones.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Estado del Alumno</Label>
                  <Select 
                    value={filters.estado} 
                    onValueChange={(val) => setFilters(prev => ({ ...prev, estado: val }))}
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

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando alumnos...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Grado y Sección</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium">
                      {student.nombre} {student.apellido}
                    </TableCell>
                    <TableCell>
                      {student.grado} - {student.seccion}
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.estado === 'Activo' ? 'default' : 'secondary'} className={
                        student.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 
                        student.estado === 'Suspendido' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                        'bg-slate-100 text-slate-700'
                      }>
                        {student.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/students/${student.id}`}>Ver Perfil</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <X className="h-8 w-8 text-slate-200 mb-2" />
                      <p>No se encontraron alumnos con los criterios seleccionados.</p>
                      <Button variant="link" onClick={resetFilters} className="text-primary font-bold">Ver todos los alumnos</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
