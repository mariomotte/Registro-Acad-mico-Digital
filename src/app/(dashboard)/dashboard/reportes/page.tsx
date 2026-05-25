"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, FileText, Search, Loader2, RefreshCw, BarChart3, AlertOctagon, TrendingUp, UserMinus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"

export default function ReportesPage() {
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [incidents, setIncidents] = useState<any[]>([])
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [grado, setGrado] = useState("todos")
  const [seccion, setSeccion] = useState("todos")
  const [tipo, setTipo] = useState("todos")
  const [severidad, setSeveridad] = useState("todos")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")

  const gradosDisponibles = ["1ro", "2do", "3ro", "4to", "5to", "6to", "1ro Sec", "2do Sec", "3ro Sec", "4to Sec", "5to Sec"]
  const seccionesDisponibles = ["A", "B", "C", "D"]
  const tiposDisponibles = ["Inasistencia", "Tardanza", "Problema de comportamiento", "Problema de salud", "Conflicto entre alumnos", "Observación académica"]

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      let query = supabase.from('incidencias').select('id, fecha, alumno_nombre, alumno_grado, alumno_seccion, tipo, descripcion, severidad, registrado_por')

      if (grado !== "todos") query = query.eq('alumno_grado', grado)
      if (seccion !== "todos") query = query.eq('alumno_seccion', seccion)
      if (tipo !== "todos") query = query.eq('tipo', tipo)
      if (severidad !== "todos") query = query.eq('severidad', severidad)
      if (fechaInicio) query = query.gte('fecha', `${fechaInicio}T00:00:00`)
      if (fechaFin) query = query.lte('fecha', `${fechaFin}T23:59:59`)

      const { data, error } = await query.order('fecha', { ascending: false })

      if (error) throw error

      let filteredData = data || []
      if (searchTerm.trim()) {
        filteredData = filteredData.filter(i => 
          i.alumno_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      setIncidents(filteredData)
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error al generar reporte",
        description: "No se pudieron obtener los datos de la base de datos."
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [grado, seccion, tipo, severidad, fechaInicio, fechaFin])

  // Basic stats calculators
  const totalIncidents = incidents.length
  const graveIncidents = incidents.filter(i => i.severidad === 'alto' || i.severidad === 'grave').length
  
  const getMostCommonType = () => {
    if (incidents.length === 0) return "-"
    const counts = incidents.reduce((acc: any, i) => {
      acc[i.tipo] = (acc[i.tipo] || 0) + 1
      return acc
    }, {})
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
  }

  const getMostReportedStudent = () => {
    if (incidents.length === 0) return "-"
    const counts = incidents.reduce((acc: any, i) => {
      acc[i.alumno_nombre] = (acc[i.alumno_nombre] || 0) + 1
      return acc
    }, {})
    const name = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
    return `${name} (${counts[name]})`
  }

  const exportCSV = () => {
    if (incidents.length === 0) {
      toast({ description: "No hay datos para exportar." })
      return
    }

    const headers = ["ID", "Fecha", "Alumno", "Grado", "Seccion", "Tipo Incidencia", "Severidad", "Descripcion", "Registrado Por"]
    const rows = incidents.map(i => [
      i.id,
      i.fecha,
      i.alumno_nombre,
      i.alumno_grado,
      i.alumno_seccion,
      i.tipo,
      i.severidad,
      `"${(i.descripcion || '').replace(/"/g, '""')}"`,
      i.registrado_por
    ])

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `reporte_incidencias_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({ title: "Exportación exitosa", description: "Reporte CSV descargado." })
  }

  const printReport = () => {
    window.print()
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'alto':
      case 'grave':
        return <Badge className="bg-red-100 text-red-700 border-none hover:bg-red-200">Grave</Badge>
      case 'medio':
      case 'moderada':
        return <Badge className="bg-amber-100 text-amber-700 border-none hover:bg-amber-200">Moderado</Badge>
      default:
        return <Badge className="bg-emerald-100 text-emerald-700 border-none hover:bg-emerald-200">Leve</Badge>
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:p-0 print:m-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-headline">Generador de Reportes</h2>
          <p className="text-muted-foreground">Genera análisis disciplinarios, filtra registros y descarga estadísticas oficiales.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex gap-2" onClick={exportCSV}>
            <FileSpreadsheet size={16} /> Exportar CSV (Excel)
          </Button>
          <Button className="bg-primary flex gap-2" onClick={printReport}>
            <FileText size={16} /> Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards - Hidden in Print */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        <Card className="border border-slate-100 dark:border-white/5 shadow-sm bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Total Incidencias</span>
              <BarChart3 className="text-primary h-4 w-4" />
            </div>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">{totalIncidents}</p>
          </CardContent>
        </Card>
        
        <Card className="border border-slate-100 dark:border-white/5 shadow-sm bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Casos Graves</span>
              <AlertOctagon className="text-red-500 h-4 w-4" />
            </div>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-2">{graveIncidents}</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 dark:border-white/5 shadow-sm bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Tipo más Común</span>
              <TrendingUp className="text-emerald-500 h-4 w-4" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-2 truncate">{getMostCommonType()}</p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 dark:border-white/5 shadow-sm bg-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase">Estudiante Recurrente</span>
              <UserMinus className="text-amber-500 h-4 w-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-2 truncate">{getMostReportedStudent()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">REPORTE OFICIAL DE INCIDENCIAS</h1>
        <p className="text-sm text-slate-500">EduControl A.G.G - Registro Académico Digital</p>
        <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-mono">
          <div>Grado: {grado} | Sección: {seccion}</div>
          <div>F. Generado: {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Filters Form - Hidden in Print */}
      <Card className="border-none shadow-md print:hidden">
        <CardHeader className="bg-slate-50/50 dark:bg-white/[0.02] border-b">
          <CardTitle className="text-sm flex items-center gap-2">
            <RefreshCw size={16} className="text-primary animate-spin-slow" />
            Filtros del Reporte
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label>Buscar por Nombre de Alumno</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Escribe para buscar..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Grado Académico</Label>
            <Select value={grado} onValueChange={setGrado}>
              <SelectTrigger>
                <SelectValue />
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
            <Select value={seccion} onValueChange={setSeccion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las secciones</SelectItem>
                {seccionesDisponibles.map(s => (
                  <SelectItem key={s} value={s}>Sección {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Incidencia</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {tiposDisponibles.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Severidad</Label>
            <Select value={severidad} onValueChange={setSeveridad}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las severidades</SelectItem>
                <SelectItem value="bajo">Bajo (Leve)</SelectItem>
                <SelectItem value="medio">Medio (Moderado)</SelectItem>
                <SelectItem value="alto">Alto (Grave)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rango de Fechas (Desde / Hasta)</Label>
            <div className="flex gap-2">
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Data Table */}
      <Card className="border-none shadow-md overflow-hidden print:shadow-none print:border-none">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 print:hidden">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generando reporte...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-white/[0.02]">
                  <TableHead className="w-[120px] font-bold text-slate-700 dark:text-slate-300">Fecha</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Estudiante</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Grado/Secc</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Incidencia</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Severidad</TableHead>
                  <TableHead className="print:hidden font-bold text-slate-700 dark:text-slate-300">Registrador</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.length > 0 ? (
                  incidents.map((incident) => (
                    <TableRow key={incident.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-xs font-mono">
                        {format(parseISO(incident.fecha), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-800 dark:text-slate-100">
                        {incident.alumno_nombre}
                      </TableCell>
                      <TableCell className="text-xs">
                        {incident.alumno_grado} - {incident.alumno_seccion}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-semibold">{incident.tipo}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 italic max-w-md truncate">{incident.descripcion}</div>
                      </TableCell>
                      <TableCell>
                        {getSeverityBadge(incident.severidad)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400 print:hidden">
                        {incident.registrado_por}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No se encontraron incidencias coincidentes con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* CSS stylesheet print hack for nice paper styling */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            font-size: 12px;
          }
          header, sidebar, footer, nav, .print\\:hidden, button {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .shadow-md, .shadow-lg, .shadow-xl {
            box-shadow: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          th, td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
          }
        }
      `}</style>
    </div>
  )
}
