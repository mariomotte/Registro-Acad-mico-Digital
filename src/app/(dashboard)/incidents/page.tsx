
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
  Search, 
  Plus, 
  Filter, 
  Download,
  Calendar as CalendarIcon,
  Loader2
} from "lucide-react"
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Incidencia } from "@/types"

const severityColors = {
  bajo: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medio: "bg-amber-100 text-amber-700 border-amber-200",
  alto: "bg-red-100 text-red-700 border-red-200",
}

export default function IncidentsPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [searchTerm, setSearchTerm] = useState("")
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const incidentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "incidences"), orderBy("fecha", "desc"))
  }, [db, user])

  const { data: incidences, isLoading } = useCollection<Incidencia>(incidentsQuery)

  const filteredIncidents = (incidences || []).filter(incident => 
    incident.alumnoNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline">Registro de Incidencias</h2>
          <p className="text-muted-foreground">Historial completo de reportes y observaciones académicas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          <Button asChild className="bg-primary">
            <Link href="/incidents/new">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Reporte
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por alumno o tipo..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <CalendarIcon className="mr-2 h-4 w-4" /> Esta Semana
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" /> Filtros Avanzados
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando incidencias...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Fecha</TableHead>
                <TableHead>Alumno</TableHead>
                <TableHead>Tipo de Incidencia</TableHead>
                <TableHead>Severidad</TableHead>
                <TableHead>Registrado por</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => (
                  <TableRow key={incident.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="text-xs font-medium text-slate-500">
                      {isMounted && incident.fecha ? format(new Date(incident.fecha), "dd MMM, yyyy HH:mm", { locale: es }) : "..."}
                    </TableCell>
                    <TableCell className="font-semibold text-primary">
                      <Link href={`/students/${incident.alumnoId}`} className="hover:underline">
                        {incident.alumnoNombre}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{incident.tipo}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={severityColors[incident.severidad as keyof typeof severityColors] || ""}>
                        {incident.severidad?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {incident.registradoPor}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/students/${incident.alumnoId}`}>Ver Detalles</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No se encontraron incidencias registradas.
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
