
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { 
  Search, 
  Plus, 
  Filter, 
  Download,
  Calendar as CalendarIcon,
  Loader2,
  RotateCcw
} from "lucide-react"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Incidencia } from "@/types"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const severityColors = {
  bajo: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15",
  medio: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15",
  alto: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/15",
}

export default function IncidentsPage() {
  const { user, loading: isUserLoading } = useSupabaseAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [incidences, setIncidences] = useState<Incidencia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isThisWeekActive, setIsThisWeekActive] = useState(false)
  const [filters, setFilters] = useState({
    grado: "todos",
    seccion: "todos",
    tipo: "todos",
    severidad: "todos",
    fechaInicio: "",
    fechaFin: "",
  })

  const gradosDisponibles = ["1°", "2°", "3°", "4°", "5°"]
  const seccionesDisponibles = ["A", "B", "C", "D"]
  const tiposDisponibles = [
    "Inasistencia",
    "Tardanza",
    "Problema de comportamiento",
    "Problema de salud",
    "Conflicto entre alumnos",
    "Observación académica",
  ]

  const applyDocenteIncidentScope = (query: any) => query;

  const exportCSV = async (period: 'semana' | 'quincena' | 'mes' | 'todo') => {
    try {
      let query = supabase
        .from('incidencias')
        .select('id, fecha, fecha_suceso, alumno_nombre, alumno_grado, alumno_seccion, tipo, descripcion, severidad, registrado_por, registrador_user_id, accion_tomada, estado');

      query = applyDocenteIncidentScope(query);

      if (period !== 'todo') {
        const thresholdDate = new Date();
        if (period === 'semana') {
          thresholdDate.setDate(thresholdDate.getDate() - 7);
        } else if (period === 'quincena') {
          thresholdDate.setDate(thresholdDate.getDate() - 15);
        } else if (period === 'mes') {
          thresholdDate.setMonth(thresholdDate.getMonth() - 1);
        }
        const dateStr = thresholdDate.toISOString().slice(0, 10);
        query = query.gte('fecha', dateStr);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "Sin registros",
          description: "No hay incidencias para exportar en este período.",
          variant: "destructive"
        });
        return;
      }

      const headers = [
        "Alumno",
        "Grado",
        "Sección",
        "Tipo de incidencia",
        "Severidad",
        "Fecha y hora",
        "Registrado por",
        "Descripción",
        "Acción tomada",
        "Estado"
      ];

      const csvRows = [
        headers.join(";"),
        ...data.map((row: any) => {
          const dateFormatted = row.fecha_suceso 
            ? format(parseISO(row.fecha_suceso), "dd/MM/yyyy HH:mm")
            : row.fecha;
          
          const cleanText = (text: string) => {
            if (!text) return "";
            return `"${text.replace(/"/g, '""')}"`;
          };

          return [
            cleanText(row.alumno_nombre),
            cleanText(row.alumno_grado),
            cleanText(row.alumno_seccion),
            cleanText(row.tipo),
            cleanText(row.severidad),
            cleanText(dateFormatted),
            cleanText(row.registrado_por),
            cleanText(row.descripcion),
            cleanText(row.accion_tomada),
            cleanText(row.estado)
          ].join(";");
        })
      ];

      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `reporte_incidencias_${period}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportación exitosa",
        description: `Se descargó el reporte (${period}) en formato CSV.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error al exportar",
        description: err.message || "Ocurrió un error al exportar los datos.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    let mounted = true;
    async function loadIncidents() {
      if (!user) return;
      try {
        let query = supabase
          .from('incidencias')
          .select('id, alumno_id, alumno_nombre, alumno_grado, alumno_seccion, tipo, descripcion, severidad, fecha, fecha_suceso, registrado_por, registrador_user_id, evidence_urls');
        
        query = applyDocenteIncidentScope(query);

        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (data && mounted) {
          setIncidences(data.map((i: any) => ({
            id: i.id,
            alumnoId: i.alumno_id,
            alumnoNombre: i.alumno_nombre,
            alumnoGrado: i.alumno_grado,
            alumnoSeccion: i.alumno_seccion,
            tipo: i.tipo,
            descripcion: i.descripcion,
            severidad: i.severidad,
            fecha: i.fecha_suceso || i.fecha,
            registradoPor: i.registrado_por,
            registradorUserId: i.registrador_user_id,
            evidenceUrls: i.evidence_urls
          })));
        }
      } catch (err) {
        console.error("Error fetching incidents", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    
    if (!isUserLoading) {
      loadIncidents();
    }
    
    return () => { mounted = false; };
  }, [user, isUserLoading]);

  const getIncidentDate = (fecha: string) => {
    const parsed = parseISO(fecha)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  const filteredIncidents = incidences.filter((incident) => {
    const normalizedSearch = searchTerm.toLowerCase()
    const matchesSearch =
      incident.alumnoNombre?.toLowerCase().includes(normalizedSearch) ||
      incident.tipo?.toLowerCase().includes(normalizedSearch)
    const matchesGrade = filters.grado === "todos" || incident.alumnoGrado === filters.grado
    const matchesSection = filters.seccion === "todos" || incident.alumnoSeccion === filters.seccion
    const matchesType = filters.tipo === "todos" || incident.tipo === filters.tipo
    const matchesSeverity = filters.severidad === "todos" || incident.severidad === filters.severidad
    const incidentDate = getIncidentDate(incident.fecha)

    let matchesDate = true
    if (incidentDate && filters.fechaInicio) {
      matchesDate = incidentDate >= new Date(`${filters.fechaInicio}T00:00:00`)
    }
    if (matchesDate && incidentDate && filters.fechaFin) {
      matchesDate = incidentDate <= new Date(`${filters.fechaFin}T23:59:59`)
    }
    if (matchesDate && incidentDate && isThisWeekActive) {
      const start = new Date()
      start.setDate(start.getDate() - 7)
      start.setHours(0, 0, 0, 0)
      matchesDate = incidentDate >= start
    }

    return matchesSearch && matchesGrade && matchesSection && matchesType && matchesSeverity && matchesDate
  })

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      grado: "todos",
      seccion: "todos",
      tipo: "todos",
      severidad: "todos",
      fechaInicio: "",
      fechaFin: "",
    })
    setIsThisWeekActive(false)
  }

  const advancedFilterCount = Object.values(filters).filter((value) => value !== "" && value !== "todos").length
  const hasActiveFilters = advancedFilterCount > 0 || isThisWeekActive

  const formatFecha = (fechaStr: string) => {
    try {
      if (!fechaStr) return "...";
      const d = parseISO(fechaStr);
      if (isNaN(d.getTime())) return fechaStr; // If it's a date string but not ISO
      return format(d, "dd MMM, yyyy HH:mm", { locale: es });
    } catch {
      return fechaStr;
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-rose-900/10 bg-gradient-to-r from-rose-700 via-red-700 to-slate-900 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight font-headline">Incidencias</h2>
          <p className="text-sm font-medium text-white/75">Registro operativo de casos, evidencias y acciones tomadas.</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                <Download className="mr-2 h-4 w-4" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportCSV('semana')}>
                Esta semana
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportCSV('quincena')}>
                Últimos 15 días
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportCSV('mes')}>
                Último mes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportCSV('todo')}>
                Todo el historial
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild className="bg-white text-rose-800 hover:bg-white/90">
            <Link href="/incidents/new">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Reporte
            </Link>
          </Button>
        </div>
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsThisWeekActive((active) => !active)}
            className={isThisWeekActive ? "border-primary bg-primary/10 text-primary" : ""}
          >
            <CalendarIcon className="mr-2 h-4 w-4" /> Esta Semana
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className={advancedFilterCount > 0 ? "border-primary bg-primary/10 text-primary" : ""}>
                <Filter className="mr-2 h-4 w-4" /> Filtros Avanzados
                {advancedFilterCount > 0 && <Badge className="ml-2 h-5 min-w-5 px-1 text-[10px]">{advancedFilterCount}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtros avanzados</SheetTitle>
              </SheetHeader>
              <div className="grid gap-5 py-6">
                <div className="space-y-2">
                  <Label>Grado</Label>
                  <Select value={filters.grado} onValueChange={(value) => handleFilterChange("grado", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los grados</SelectItem>
                      {gradosDisponibles.map((grado) => <SelectItem key={grado} value={grado}>{grado}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sección</Label>
                  <Select value={filters.seccion} onValueChange={(value) => handleFilterChange("seccion", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las secciones</SelectItem>
                      {seccionesDisponibles.map((seccion) => <SelectItem key={seccion} value={seccion}>Sección {seccion}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de incidencia</Label>
                  <Select value={filters.tipo} onValueChange={(value) => handleFilterChange("tipo", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      {tiposDisponibles.map((tipo) => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Severidad</Label>
                  <Select value={filters.severidad} onValueChange={(value) => handleFilterChange("severidad", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las severidades</SelectItem>
                      <SelectItem value="bajo">Bajo</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fecha-inicio">Desde</Label>
                    <Input id="fecha-inicio" type="date" value={filters.fechaInicio} onChange={(event) => handleFilterChange("fechaInicio", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha-fin">Hasta</Label>
                    <Input id="fecha-fin" type="date" value={filters.fechaFin} onChange={(event) => handleFilterChange("fechaFin", event.target.value)} />
                  </div>
                </div>
              </div>
              <SheetFooter className="flex-col gap-2 sm:flex-col">
                <SheetClose asChild>
                  <Button className="w-full">Aplicar filtros</Button>
                </SheetClose>
                <Button variant="ghost" className="w-full" onClick={clearFilters}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Limpiar filtros
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-primary">
              <RotateCcw className="mr-2 h-4 w-4" /> Limpiar
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando incidencias...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Fecha</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Alumno</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Tipo de Incidencia</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Severidad</TableHead>
                <TableHead className="font-bold text-slate-700 dark:text-slate-300">Registrado por</TableHead>
                <TableHead className="text-right font-bold text-slate-700 dark:text-slate-300">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIncidents.length > 0 ? (
                filteredIncidents.map((incident) => (
                  <TableRow key={incident.id} className="hover:bg-muted/50 transition-colors group">
                    <TableCell className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {formatFecha(incident.fecha)}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-100">
                      <Link href={`/students/${incident.alumnoId}`} className="hover:text-primary transition-colors block">
                        {incident.alumnoNombre}
                      </Link>
                      {incident.alumnoGrado && incident.alumnoSeccion && (
                        <div className="text-[10px] font-bold mt-1 flex items-center gap-1.5">
                          <span className="bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-white/5">{incident.alumnoGrado}</span>
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-md border border-primary/10">{incident.alumnoSeccion}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{incident.tipo}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${
                        incident.severidad === 'bajo' ? severityColors.bajo :
                        incident.severidad === 'medio' ? severityColors.medio :
                        severityColors.alto
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          incident.severidad === 'bajo' ? 'bg-emerald-500' :
                          incident.severidad === 'medio' ? 'bg-amber-500' :
                          'bg-red-500'
                        }`} />
                        {incident.severidad}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {incident.registradoPor}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="h-8 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary rounded-lg text-slate-600 dark:text-slate-300">
                        <Link href={`/students/${incident.alumnoId}`}>Ver Detalles</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground font-medium italic">
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
