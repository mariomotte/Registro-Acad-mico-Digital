"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FileSpreadsheet, FileText, Search, Loader2, BarChart3, AlertOctagon, TrendingUp, UserMinus, ArrowRight, Layers, Users, CalendarDays } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts"

export default function ReportesPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [incidents, setIncidents] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [grado, setGrado] = useState("todos")
  const [seccion, setSeccion] = useState("todos")
  const [tipo, setTipo] = useState("todos")
  const [fechaInicio, setFechaInicio] = useState("")
  const [fechaFin, setFechaFin] = useState("")
  const [activeReport, setActiveReport] = useState("Informe por grado")
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const gradosDisponibles = ["1°", "2°", "3°", "4°", "5°"]
  const seccionesDisponibles = ["A", "B", "C", "D"]
  const tiposDisponibles = ["Inasistencia", "Tardanza", "Problema de comportamiento", "Problema de salud", "Conflicto entre alumnos", "Observación académica"]
  const chartColors = ["#2563eb", "#dc2626", "#f59e0b", "#16a34a", "#06b6d4", "#8b5cf6"]

  const loadReportData = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("incidencias")
        .select("id, fecha, fecha_suceso, alumno_nombre, alumno_grado, alumno_seccion, tipo, descripcion, severidad, registrado_por")

      if (grado !== "todos") query = query.eq("alumno_grado", grado)
      if (seccion !== "todos") query = query.eq("alumno_seccion", seccion)
      if (tipo !== "todos") query = query.eq("tipo", tipo)
      if (fechaInicio) query = query.gte("fecha", `${fechaInicio}T00:00:00`)
      if (fechaFin) query = query.lte("fecha", `${fechaFin}T23:59:59`)

      const { data, error } = await query.order("fecha", { ascending: false })
      if (error) throw error

      let filtered = data || []
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter((item) =>
          item.alumno_nombre?.toLowerCase().includes(term) ||
          item.descripcion?.toLowerCase().includes(term) ||
          item.tipo?.toLowerCase().includes(term)
        )
      }

      setIncidents(filtered)
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error al generar reporte",
        description: "No se pudieron obtener los datos de la base de datos.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReportData()
  }, [grado, seccion, tipo, fechaInicio, fechaFin, searchTerm])

  const totalIncidents = incidents.length
  const graveIncidents = incidents.filter((i) => i.severidad === "alto" || i.severidad === "grave").length

  const getMostCommonType = () => {
    if (incidents.length === 0) return "-"
    const counts = incidents.reduce((acc: any, item) => {
      acc[item.tipo] = (acc[item.tipo] || 0) + 1
      return acc
    }, {})
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
  }

  const getMostReportedStudent = () => {
    if (incidents.length === 0) return "-"
    const counts = incidents.reduce((acc: any, item) => {
      acc[item.alumno_nombre] = (acc[item.alumno_nombre] || 0) + 1
      return acc
    }, {})
    const name = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b)
    return `${name} (${counts[name]})`
  }

  const getRiskLabel = (count: number) => {
    if (count >= 10) return { label: "Alto", className: "bg-red-500/10 text-red-700 border-red-500/20" }
    if (count >= 5) return { label: "Medio", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" }
    return { label: "Bajo", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" }
  }

  const gradeChartData = Object.values(
    incidents.reduce((acc: any, item) => {
      const key = item.alumno_grado || "Sin grado"
      acc[key] = acc[key] || { grado: key, total: 0, graves: 0 }
      acc[key].total += 1
      if (item.severidad === "alto" || item.severidad === "grave") acc[key].graves += 1
      return acc
    }, {})
  ).sort((a: any, b: any) => {
    const order: Record<string, number> = { "1°": 1, "2°": 2, "3°": 3, "4°": 4, "5°": 5 }
    return (order[a.grado] || 99) - (order[b.grado] || 99)
  }) as any[]

  const typeChartData = Object.values(
    incidents.reduce((acc: any, item) => {
      const key = item.tipo || "Sin tipo"
      acc[key] = acc[key] || { name: key, value: 0 }
      acc[key].value += 1
      return acc
    }, {})
  ).sort((a: any, b: any) => b.value - a.value) as any[]

  const renderPieLabel = ({ name }: any) => {
    const shortName = String(name).replace("Problema de ", "").replace("Observación académica", "Observación")
    return shortName
  }

  const setQuickPeriod = (days: number | "all") => {
    if (days === "all") {
      setFechaInicio("")
      setFechaFin("")
      return
    }
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)
    setFechaInicio(start.toISOString().slice(0, 10))
    setFechaFin(end.toISOString().slice(0, 10))
  }

  const exportExcel = () => {
    if (incidents.length === 0) {
      toast({ description: "No hay datos para exportar." })
      return
    }

    const esc = (value: any) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    const gradeRows = gradeChartData.map((g) => {
      const risk = getRiskLabel(g.total)
      return `<tr><td>${esc(g.grado)}</td><td>${g.total}</td><td>${g.graves}</td><td>${risk.label}</td></tr>`
    }).join("")
    const typeRows = typeChartData.map((t) => {
      const percent = totalIncidents ? Math.round((t.value / totalIncidents) * 100) : 0
      return `<tr><td>${esc(t.name)}</td><td>${t.value}</td><td>${percent}%</td></tr>`
    }).join("")
    const detailRows = incidents.map((i, index) => `
      <tr>
        <td>${index + 1}</td><td>${esc(i.fecha_suceso || i.fecha)}</td><td>${esc(i.alumno_nombre)}</td>
        <td>${esc(i.alumno_grado)}</td><td>${esc(i.alumno_seccion)}</td><td>${esc(i.tipo)}</td>
        <td class="${i.severidad === "alto" || i.severidad === "grave" ? "sev-high" : i.severidad === "medio" ? "sev-mid" : "sev-low"}">${esc(i.severidad)}</td>
        <td>${esc(i.descripcion)}</td><td>${esc(i.registrado_por)}</td>
      </tr>
    `).join("")

    const html = `
      <html><head><meta charset="UTF-8" />
      <style>
        body { font-family: Arial, sans-serif; color: #0f172a; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 22px; }
        th { background: #1e3a8a; color: #fff; font-weight: 700; padding: 10px; border: 1px solid #93c5fd; }
        td { padding: 9px; border: 1px solid #dbeafe; vertical-align: top; }
        .title { background: #0f172a; color: #fff; font-size: 22px; font-weight: 800; padding: 18px; }
        .subtitle { background: #dbeafe; color: #1e3a8a; font-weight: 700; padding: 10px; }
        .metric { background: #eef2ff; font-size: 18px; font-weight: 800; text-align: center; }
        .sev-high { background: #fee2e2; color: #991b1b; font-weight: 800; }
        .sev-mid { background: #fef3c7; color: #92400e; font-weight: 800; }
        .sev-low { background: #dcfce7; color: #166534; font-weight: 800; }
      </style></head><body>
        <table>
          <tr><td class="title" colspan="4">Informes y Estadísticas - EduControl A.G.G</td></tr>
          <tr><td class="subtitle" colspan="4">Generado: ${new Date().toLocaleString()}</td></tr>
          <tr>
            <td class="metric">Total<br/>${totalIncidents}</td><td class="metric">Graves<br/>${graveIncidents}</td>
            <td class="metric">Tipo más común<br/>${esc(getMostCommonType())}</td><td class="metric">Alumno recurrente<br/>${esc(getMostReportedStudent())}</td>
          </tr>
        </table>
        <table><tr><th colspan="4">Referencia por grado</th></tr><tr><th>Grado</th><th>Total</th><th>Graves</th><th>Nivel</th></tr>${gradeRows}</table>
        <table><tr><th colspan="3">Tipos de casos más frecuentes</th></tr><tr><th>Tipo</th><th>Cantidad</th><th>Porcentaje</th></tr>${typeRows}</table>
        <table><tr><th>#</th><th>Fecha</th><th>Alumno</th><th>Grado</th><th>Sección</th><th>Tipo</th><th>Severidad</th><th>Descripción</th><th>Registrado por</th></tr>${detailRows}</table>
      </body></html>
    `

    const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `informe_estadistico_${new Date().toISOString().slice(0, 10)}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({ title: "Exportación exitosa", description: "Excel formateado descargado." })
  }

  const printReport = () => window.print()

  const reportCards = [
    { title: "Informe por grado", text: "Comparativo de incidencia y gravedad por año.", icon: BarChart3, tone: "from-indigo-600 to-blue-900" },
    { title: "Informe por sección", text: "Lectura rápida de salones con más recurrencia.", icon: Users, tone: "from-teal-600 to-slate-900" },
    { title: "Alumnos recurrentes", text: getMostReportedStudent(), icon: UserMinus, tone: "from-amber-500 to-red-800" },
    { title: "Casos graves", text: `${graveIncidents} registros requieren revisión directiva.`, icon: AlertOctagon, tone: "from-red-600 to-slate-950" },
    { title: "Tipos frecuentes", text: getMostCommonType(), icon: Layers, tone: "from-sky-600 to-indigo-900" },
  ]

  const sectionSummary = Object.values(
    incidents.reduce((acc: any, item) => {
      const key = `${item.alumno_grado || "Sin grado"} ${item.alumno_seccion || ""}`.trim()
      acc[key] = acc[key] || { label: key, value: 0 }
      acc[key].value += 1
      return acc
    }, {})
  ).sort((a: any, b: any) => b.value - a.value) as any[]

  const recurrentSummary = Object.values(
    incidents.reduce((acc: any, item) => {
      const key = item.alumno_nombre || "Sin alumno"
      acc[key] = acc[key] || { label: key, value: 0 }
      acc[key].value += 1
      return acc
    }, {})
  ).sort((a: any, b: any) => b.value - a.value).slice(0, 8) as any[]

  const severeSummary = incidents
    .filter((item) => item.severidad === "alto" || item.severidad === "grave")
    .slice(0, 8)
    .map((item) => ({ label: item.alumno_nombre, value: item.tipo }))

  const getReportItems = (reportTitle: string) => {
    if (reportTitle.startsWith("Informe por secci")) return sectionSummary
    if (reportTitle === "Alumnos recurrentes") return recurrentSummary
    if (reportTitle === "Casos graves") return severeSummary
    if (reportTitle === "Tipos frecuentes") return typeChartData.map((item) => ({ label: item.name, value: `${item.value} registros` }))
    return gradeChartData.map((item) => ({ label: item.grado, value: `${item.total} casos / ${item.graves} graves` }))
  }

  const getActiveReportItems = () => getReportItems(activeReport)

  const handleViewDetail = (reportTitle: string) => {
    setActiveReport(reportTitle)
    setIsDetailOpen(true)
  }

  const getReportDescription = (reportTitle: string) => {
    if (reportTitle.startsWith("Informe por secci")) return "Salones ordenados por cantidad de incidencias registradas."
    if (reportTitle === "Alumnos recurrentes") return "Estudiantes con mayor cantidad de incidencias dentro de los filtros actuales."
    if (reportTitle === "Casos graves") return "Casos de severidad alta o grave que requieren revisión directiva."
    if (reportTitle === "Tipos frecuentes") return "Distribución de incidencias según el tipo de caso."
    return "Comparativo de incidencias y casos graves por grado."
  }

  const exportSummaryReport = (reportTitle: string) => {
    const items = getReportItems(reportTitle)
    if (items.length === 0) {
      toast({ description: "No hay datos para exportar con los filtros actuales." })
      return
    }

    const cleanCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`
    const rows = [
      ["Informe", reportTitle],
      ["Generado", new Date().toLocaleString()],
      [],
      ["Detalle", "Valor"],
      ...items.map((item: any) => [item.label, item.value]),
    ]
    const csv = "\uFEFF" + rows.map((row) => row.map(cleanCell).join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${reportTitle.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast({ title: "ExportaciÃ³n exitosa", description: `Se descargÃ³ el resumen: ${reportTitle}.` })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:p-0 print:m-0">
      <div className="rounded-2xl border border-indigo-900/10 bg-gradient-to-r from-indigo-700 via-blue-800 to-slate-950 p-6 text-white shadow-lg print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-headline">Informes y Estadísticas</h2>
            <p className="text-sm font-medium text-white/75">Análisis institucional, filtros históricos y exportación de reportes.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20" onClick={exportExcel}>
              <FileSpreadsheet size={16} className="mr-2" /> Exportar Excel
            </Button>
            <Button className="bg-white text-indigo-800 hover:bg-white/90" onClick={printReport}>
              <FileText size={16} className="mr-2" /> Generar PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-indigo-900/10 bg-surface-container-lowest p-4 shadow-sm print:hidden lg:grid-cols-[1.2fr_auto_auto_auto_auto_0.8fr_0.8fr]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Buscar alumno, tipo o descripción..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button variant="outline" onClick={() => setQuickPeriod(7)}>7 días</Button>
        <Button variant="outline" onClick={() => setQuickPeriod(15)}>15 días</Button>
        <Button variant="outline" onClick={() => setQuickPeriod(30)}>30 días</Button>
        <Button variant="outline" onClick={() => setQuickPeriod("all")}>Todo</Button>
        <Select value={grado} onValueChange={setGrado}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos los grados</SelectItem>{gradosDisponibles.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={seccion} onValueChange={setSeccion}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas las secciones</SelectItem>{seccionesDisponibles.map(s => <SelectItem key={s} value={s}>Sección {s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
        {[
          ["Total Incidencias", totalIncidents, BarChart3, "text-indigo-600"],
          ["Casos Graves", graveIncidents, AlertOctagon, "text-red-500"],
          ["Tipo más común", getMostCommonType(), TrendingUp, "text-emerald-500"],
          ["Estudiante recurrente", getMostReportedStudent(), UserMinus, "text-amber-500"],
        ].map(([label, value, Icon, color]: any) => (
          <Card key={label} className="border border-slate-100 bg-card shadow-sm dark:border-white/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className="mt-2 truncate text-2xl font-extrabold text-slate-800 dark:text-slate-100">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="hidden">
        <Card className="overflow-hidden border-indigo-900/10 bg-surface-container-lowest shadow-sm dark:border-white/10">
          <CardHeader className="border-b border-indigo-900/10 bg-indigo-50/80 dark:bg-indigo-950/20">
            <CardTitle className="text-sm font-black uppercase tracking-wide text-indigo-950 dark:text-indigo-100">Incidencias por grado</CardTitle>
            <CardDescription>Barras con valores visibles y animación al cargar.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pt-6">
            {isLoading ? <Loader2 className="mx-auto mt-24 h-8 w-8 animate-spin text-primary" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeChartData} margin={{ top: 24, right: 16, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbeafe" />
                  <XAxis dataKey="grado" fontSize={11} fontWeight={700} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} fontWeight={700} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #c7d2fe" }} />
                  <Bar dataKey="total" name="Total" fill="#2563eb" radius={[8, 8, 2, 2]} animationDuration={900}>
                    <LabelList dataKey="total" position="top" className="fill-slate-700 text-xs font-bold" />
                  </Bar>
                  <Bar dataKey="graves" name="Graves" fill="#dc2626" radius={[8, 8, 2, 2]} animationDuration={1100}>
                    <LabelList dataKey="graves" position="top" className="fill-red-700 text-xs font-bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-indigo-900/10 bg-surface-container-lowest shadow-sm dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase">Referencia</CardTitle>
            <CardDescription>Nivel según cantidad.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {gradeChartData.map((item) => {
              const risk = getRiskLabel(item.total)
              return (
                <div key={item.grado} className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 p-3 text-xs dark:border-white/10 dark:bg-white/5">
                  <div>
                    <p className="font-black text-slate-800 dark:text-slate-100">{item.grado}</p>
                    <p className="font-semibold text-slate-500">{item.total} casos · {item.graves} graves</p>
                  </div>
                  <Badge variant="outline" className={risk.className}>{risk.label}</Badge>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px] print:hidden">
        <Card className="overflow-hidden border-sky-900/10 bg-surface-container-lowest shadow-sm dark:border-white/10">
          <CardHeader className="border-b border-sky-900/10 bg-sky-50/80 dark:bg-sky-950/20">
            <CardTitle className="text-sm font-black uppercase tracking-wide text-sky-950 dark:text-sky-100">Tipos de casos más frecuentes</CardTitle>
            <CardDescription>Gráfico circular con etiquetas visibles y leyenda lateral.</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pt-6">
            {isLoading ? <Loader2 className="mx-auto mt-24 h-8 w-8 animate-spin text-primary" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 18, right: 68, bottom: 18, left: 68 }}>
                  <Pie
                    data={typeChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={112}
                    paddingAngle={2}
                    labelLine={false}
                    label={renderPieLabel}
                    animationDuration={900}
                  >
                    {typeChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} stroke="#ffffff" strokeWidth={3} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-sky-900/10 bg-surface-container-lowest shadow-sm dark:border-white/10">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase">Referencias</CardTitle>
            <CardDescription>Participación por tipo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {typeChartData.map((item, index) => {
              const percent = totalIncidents ? Math.round((item.value / totalIncidents) * 100) : 0
              return (
                <div key={item.name} className="rounded-xl border border-slate-200/70 bg-white/70 p-3 text-xs dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 font-black text-slate-800 dark:text-slate-100">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                      <span className="truncate">{item.name}</span>
                    </span>
                    <span className="font-black text-slate-600 dark:text-slate-300">{percent}%</span>
                  </div>
                  <p className="mt-1 font-semibold text-slate-500">{item.value} registros</p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 print:hidden">
        {reportCards.map((card) => (
          <Card key={card.title} className="flex min-h-[248px] flex-col overflow-hidden border-0 shadow-md">
            <div className={`h-20 bg-gradient-to-br ${card.tone} p-4 text-white`}>
              <card.icon className="h-7 w-7 text-white/90" />
            </div>
            <CardContent className="flex-1 p-5">
              <h3 className="font-black text-slate-900 dark:text-slate-100">{card.title}</h3>
              <p className="mt-2 min-h-10 text-xs font-semibold text-slate-500">{card.text}</p>
            </CardContent>
            <CardFooter className="gap-3 p-5 pt-0">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewDetail(card.title)}>Ver detalle</Button>
              <Button size="sm" className="flex-1" onClick={() => exportSummaryReport(card.title)}>Exportar <ArrowRight className="ml-1 h-3 w-3" /></Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              {activeReport}
            </DialogTitle>
            <DialogDescription>{getReportDescription(activeReport)}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">Incidencias</p>
              <p className="mt-1 text-2xl font-black">{totalIncidents}</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">Casos graves</p>
              <p className="mt-1 text-2xl font-black">{graveIncidents}</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">Elementos</p>
              <p className="mt-1 text-2xl font-black">{getActiveReportItems().length}</p>
            </div>
          </div>

          <div className="max-h-[46vh] overflow-y-auto pr-1">
            {getActiveReportItems().length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {getActiveReportItems().map((item: any, index: number) => (
                  <div key={`${item.label}-${index}`} className="rounded-lg border bg-surface-container-lowest p-4 text-xs dark:border-white/10">
                    <p className="font-black text-slate-800 dark:text-slate-100">{item.label}</p>
                    <p className="mt-1 font-semibold text-slate-500 dark:text-slate-300">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-semibold text-slate-400">No hay datos para este informe con los filtros actuales.</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
            <Button onClick={() => exportSummaryReport(activeReport)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar resumen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="hidden print:block border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">REPORTE OFICIAL DE INCIDENCIAS</h1>
        <p className="text-sm text-slate-500">EduControl A.G.G - Registro Académico Digital</p>
        <div className="grid grid-cols-2 gap-4 mt-4 text-xs font-mono">
          <div>Grado: {grado} | Sección: {seccion}</div>
          <div>Registros: {totalIncidents}</div>
        </div>
      </div>

      <div className="hidden print:block">
        {incidents.map((incident) => (
          <div key={incident.id} className="mb-3 border p-3">
            <strong>{incident.alumno_nombre}</strong> · {incident.alumno_grado} {incident.alumno_seccion} · {incident.tipo} · {incident.severidad}
            <p>{incident.descripcion}</p>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          body { background-color: white !important; color: black !important; font-size: 12px; }
          header, sidebar, footer, nav, .print\\:hidden, button { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  )
}
