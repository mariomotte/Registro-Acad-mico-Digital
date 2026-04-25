
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
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Incidencia } from "@/types"
import { Loader2 } from "lucide-react"

const severityColors = {
  bajo: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  medio: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  alto: "bg-destructive/10 text-destructive hover:bg-destructive/10",
}

export function RecentIncidents() {
  const [isMounted, setIsMounted] = useState(false)
  const db = useFirestore()
  const { user } = useUser()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const q = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(db, "incidences"), orderBy("fecha", "desc"), limit(5))
  }, [db, user])

  const { data: incidences, isLoading } = useCollection<Incidencia>(q)

  if (isLoading) {
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
                  {isMounted && incident.fecha ? format(new Date(incident.fecha), "dd MMM, yyyy", { locale: es }) : "..."}
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
