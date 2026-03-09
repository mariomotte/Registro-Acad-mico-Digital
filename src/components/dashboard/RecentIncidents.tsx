import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MOCK_INCIDENTS } from "@/lib/mock-data"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const severityColors = {
  bajo: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  medio: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  alto: "bg-destructive/10 text-destructive hover:bg-destructive/10",
}

export function RecentIncidents() {
  return (
    <div className="rounded-md border bg-white">
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
          {MOCK_INCIDENTS.map((incident) => (
            <TableRow key={incident.id} className="cursor-pointer hover:bg-slate-50">
              <TableCell className="font-medium text-primary">{incident.alumnoNombre}</TableCell>
              <TableCell className="text-slate-600">{incident.tipo}</TableCell>
              <TableCell className="text-slate-500 text-xs">
                {format(new Date(incident.fecha), "PPP", { locale: es })}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={severityColors[incident.severidad]}>
                  {incident.severidad.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-right text-slate-500 text-xs">{incident.registradoPor}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}