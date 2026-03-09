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
import { Search, UserPlus, Filter } from "lucide-react"
import { MOCK_STUDENTS } from "@/lib/mock-data"
import Link from "next/link"

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline">Alumnos</h2>
          <p className="text-muted-foreground">Gestiona la base de datos de estudiantes y sus registros.</p>
        </div>
        <Button className="bg-primary">
          <UserPlus className="mr-2 h-4 w-4" /> Registrar Alumno
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="Buscar por nombre, apellido o grado..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" /> Filtros
        </Button>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Grado y Sección</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Incidencias</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_STUDENTS.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">
                  {student.nombre} {student.apellido}
                </TableCell>
                <TableCell>
                  {student.grado} - {student.seccion}
                </TableCell>
                <TableCell>
                  <Badge variant={student.estado === 'Activo' ? 'default' : 'secondary'} className={
                    student.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                  }>
                    {student.estado}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={`font-semibold ${
                    (student.incidentsCount || 0) > 5 ? 'text-destructive' : 'text-slate-600'
                  }`}>
                    {student.incidentsCount} registros
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/students/${student.id}`}>Ver Perfil</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}