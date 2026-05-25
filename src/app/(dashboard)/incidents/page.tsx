
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
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Incidencia } from "@/types"

const severityColors = {
  bajo: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15",
  medio: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15",
  alto: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 hover:bg-red-500/15",
}

export default function IncidentsPage() {
  const { user, loading: isUserLoading } = useSupabaseAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [incidences, setIncidences] = useState<Incidencia[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true;
    async function loadIncidents() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('incidencias')
          .select('id, alumno_id, alumno_nombre, alumno_grado, alumno_seccion, tipo, descripcion, severidad, fecha, registrado_por, registrador_user_id, evidence_urls')
          .order('fecha', { ascending: false });
        
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
            fecha: i.fecha,
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

  const filteredIncidents = incidences.filter(incident => 
    incident.alumnoNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
                      <Button variant="ghost" size="sm" asChild className="h-8 hover:bg-slate-150 dark:hover:bg-white/5 hover:text-primary rounded-lg text-slate-600 dark:text-slate-300">
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
