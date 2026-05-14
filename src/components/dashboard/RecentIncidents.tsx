
"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Incidencia } from "@/types"
import { Loader2 } from "lucide-react"

const severityColors = {
  bajo: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  medio: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  alto: "bg-destructive/10 text-destructive hover:bg-destructive/10",
}

export function RecentIncidents() {
  const { user, loading: isUserLoading } = useSupabaseAuth()
  const [incidences, setIncidences] = useState<Incidencia[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true;
    async function fetchRecentIncidents() {
      if (!user) return;
      try {
        let query = supabase
          .from('incidencias')
          .select('*')
          .order('fecha', { ascending: false })
          .limit(5);

        if (user.role === 'Docente') {
          query = query.eq('registrador_user_id', user.id);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (mounted) {
          setIncidences(data.map((i: any) => ({
            id: i.id,
            alumnoId: i.alumno_id,
            alumnoNombre: i.alumno_nombre,
            tipo: i.tipo,
            descripcion: i.descripcion,
            severidad: i.severidad,
            fecha: i.fecha,
            registradoPor: i.registrado_por
          })));
        }
      } catch (err) {
        console.error("Error fetching recent incidents", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    if (!isUserLoading) {
      fetchRecentIncidents();
    }

    return () => { mounted = false; };
  }, [user, isUserLoading]);

  const formatFecha = (fechaStr: string) => {
    try {
      if (!fechaStr) return "...";
      const d = parseISO(fechaStr);
      if (isNaN(d.getTime())) return fechaStr;
      return format(d, "dd MMM, yyyy", { locale: es });
    } catch {
      return fechaStr;
    }
  }

  if (isUserLoading || isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead className="font-semibold">Alumno</TableHead>
            <TableHead className="font-semibold">Tipo</TableHead>
            <TableHead className="font-semibold">Fecha</TableHead>
            <TableHead className="font-semibold">Severidad</TableHead>
            <TableHead className="font-semibold text-right">Registrado por</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {incidences && incidences.length > 0 ? (
            incidences.map((incident) => (
              <TableRow key={incident.id} className="cursor-pointer hover:bg-slate-50">
                <TableCell className="font-medium text-primary">{incident.alumnoNombre}</TableCell>
                <TableCell className="text-slate-600">{incident.tipo}</TableCell>
                <TableCell className="text-slate-500 text-xs">
                  {formatFecha(incident.fecha)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={severityColors[incident.severidad as keyof typeof severityColors] || ""}>
                    {incident.severidad?.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-slate-500 text-xs">{incident.registradoPor}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground italic">
                No hay incidencias registradas hoy.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
