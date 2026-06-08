"use client"

import { useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertCircle,
  Database,
  Download,
  FileSpreadsheet,
  Settings,
  Upload,
} from "lucide-react"

const expectedColumns = [
  { source: "N°", target: "orden", required: false },
  { source: "APELLIDOS Y NOMBRES", target: "apellidos_nombres", required: true },
  { source: "SEXO", target: "sexo", required: true },
  { source: "DNI", target: "dni", required: true },
  { source: "F.NAC.", target: "fecha_nacimiento", required: false },
  { source: "SEGURO", target: "seguro", required: false },
  { source: "DOC.MAT.", target: "documento_matricula", required: false },
  { source: "CELULAR", target: "telefono", required: false },
  { source: "C.CARGO", target: "cargo", required: false },
  { source: "OBS.", target: "observaciones", required: false },
]

const importSteps = [
  "Detectar encabezados institucionales: I.E., grado/seccion, anio, auxiliar y tutor.",
  "Ubicar la fila amarilla de columnas y normalizar nombres como DNI, sexo y fecha de nacimiento.",
  "Separar apellidos y nombres para guardarlos en la tabla de alumnos.",
  "Validar duplicados por DNI antes de importar.",
  "Generar un resumen previo: nuevos, actualizables y filas con observaciones.",
]

export default function ConfiguracionesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    setSelectedFile(file)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="rounded-2xl border border-emerald-900/10 bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-950 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight font-headline">Configuraciones</h2>
            <p className="text-sm font-medium text-white/75">Importacion y exportacion administrativa de datos institucionales.</p>
          </div>
          <Badge className="w-fit border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
            Solo administrador
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-emerald-900/10 bg-surface-container-lowest shadow-sm dark:border-white/10">
          <CardHeader className="border-b border-emerald-900/10 bg-emerald-50/80 dark:border-white/10 dark:bg-emerald-950/20">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-emerald-950 dark:text-emerald-100">
              <Upload size={18} />
              Importar datos
            </CardTitle>
            <CardDescription>
              Preparado para padrones Excel como relacion de alumnos por grado, seccion, tutor y auxiliar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            <div
              className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6 text-center transition-colors hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="mb-3 h-10 w-10 text-emerald-600 dark:text-emerald-300" />
              <p className="font-black text-slate-800 dark:text-slate-100">
                {selectedFile ? selectedFile.name : "Seleccione o arrastre un archivo Excel"}
              </p>
              <p className="mt-1 max-w-lg text-xs font-semibold text-slate-500">
                Formatos esperados: .xlsx, .xls o .csv con columnas similares a APELLIDOS Y NOMBRES, SEXO, DNI, F.NAC. y OBS.
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-black uppercase text-slate-500">Tipo de importacion</p>
                <p className="mt-1 font-bold text-slate-800 dark:text-slate-100">Alumnos</p>
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-black uppercase text-slate-500">Modo previsto</p>
                <p className="mt-1 font-bold text-slate-800 dark:text-slate-100">Vista previa antes de subir</p>
              </div>
              <div className="rounded-lg border border-slate-200/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-black uppercase text-slate-500">Clave de control</p>
                <p className="mt-1 font-bold text-slate-800 dark:text-slate-100">DNI del alumno</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-semibold text-amber-900 dark:text-amber-100">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                <span>La importacion real queda pendiente hasta recibir la data final.</span>
              </div>
              <p className="text-xs font-medium text-amber-800/80 dark:text-amber-100/80">
                Esta pantalla ya define el formato de trabajo para que luego podamos leer, validar y subir los registros sin improvisar la estructura.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Elegir archivo
              </Button>
              <Button disabled={!selectedFile} className="bg-emerald-600 hover:bg-emerald-700">
                <Database className="mr-2 h-4 w-4" />
                Validar estructura
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-sky-900/10 bg-surface-container-lowest shadow-sm dark:border-white/10">
          <CardHeader className="border-b border-sky-900/10 bg-sky-50/80 dark:border-white/10 dark:bg-sky-950/20">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-sky-950 dark:text-sky-100">
              <Download size={18} />
              Exportar datos
            </CardTitle>
            <CardDescription>Accesos preparados para respaldos administrativos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {[
              ["Padron de alumnos", "Alumnos activos con grado, seccion, DNI, sexo y contacto."],
              ["Incidencias", "Reportes con fecha, alumno, gravedad, descripcion y registrador."],
              ["Usuarios y roles", "Operadores del sistema, estado y rol asignado."],
            ].map(([title, description]) => (
              <div key={title} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="min-w-0">
                  <p className="font-black text-slate-800 dark:text-slate-100">{title}</p>
                  <p className="text-xs font-semibold text-slate-500">{description}</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  XLSX
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-indigo-900/10 bg-surface-container-lowest shadow-sm dark:border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-wide">
            <Settings size={18} />
            Guia de columnas para importar alumnos
          </CardTitle>
          <CardDescription>
            Basado en el formato de padron por grado: encabezado institucional, tutor, auxiliar y tabla amarilla de alumnos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Columna del Excel</TableHead>
                <TableHead>Campo destino</TableHead>
                <TableHead>Uso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expectedColumns.map((column) => (
                <TableRow key={column.source}>
                  <TableCell className="font-bold">{column.source}</TableCell>
                  <TableCell className="font-mono text-xs">{column.target}</TableCell>
                  <TableCell>
                    <Badge variant={column.required ? "default" : "secondary"}>
                      {column.required ? "Requerido" : "Opcional"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="grid gap-3 md:grid-cols-5">
            {importSteps.map((step, index) => (
              <div key={step} className="rounded-lg border border-slate-200/70 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-black text-emerald-600">Paso {index + 1}</p>
                <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
