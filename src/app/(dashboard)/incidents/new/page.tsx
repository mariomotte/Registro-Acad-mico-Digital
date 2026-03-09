"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { MOCK_STUDENTS } from "@/lib/mock-data"
import { ClipboardList, Upload, Camera, Save, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function NewIncidentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Registro exitoso",
        description: "La incidencia ha sido registrada y notificada a los directivos.",
      })
      router.push("/")
    }, 1500)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline">Nueva Incidencia</h2>
          <p className="text-muted-foreground">Registra un nuevo suceso o observación para un alumno.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList size={20} className="text-primary" />
              Detalles del Reporte
            </CardTitle>
            <CardDescription>Complete todos los campos requeridos para un seguimiento adecuado.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student">Seleccionar Alumno</Label>
                <Select required>
                  <SelectTrigger id="student">
                    <SelectValue placeholder="Buscar alumno..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MOCK_STUDENTS.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.nombre} {s.apellido} ({s.grado} {s.seccion})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Incidencia</Label>
                <Select required>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inasistencia">Inasistencia</SelectItem>
                    <SelectItem value="comportamiento">Problema de comportamiento</SelectItem>
                    <SelectItem value="salud">Problema de salud</SelectItem>
                    <SelectItem value="conflicto">Conflicto entre alumnos</SelectItem>
                    <SelectItem value="academico">Observación académica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="severity">Nivel de Gravedad</Label>
                <Select required defaultValue="bajo">
                  <SelectTrigger id="severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bajo">Bajo</SelectItem>
                    <SelectItem value="medio">Medio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha del Suceso</Label>
                <Input id="date" type="datetime-local" required defaultValue={new Date().toISOString().slice(0, 16)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción Detallada</Label>
              <Textarea 
                id="description" 
                placeholder="Describa lo ocurrido con la mayor claridad posible..." 
                className="min-h-[120px]"
                required
              />
            </div>

            <div className="space-y-4">
              <Label>Evidencias (Opcional)</Label>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="border-2 border-dashed rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors text-muted-foreground hover:text-primary hover:border-primary">
                  <Camera size={20} />
                  <span className="text-[10px] mt-1 font-semibold uppercase">Capturar</span>
                </div>
                <div className="border-2 border-dashed rounded-lg h-24 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors text-muted-foreground hover:text-primary hover:border-primary">
                  <Upload size={20} />
                  <span className="text-[10px] mt-1 font-semibold uppercase">Subir Foto</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground italic">Permitido: JPG, PNG, PDF (Máx. 5MB por archivo)</p>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t py-4 flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary" disabled={isLoading}>
              {isLoading ? "Registrando..." : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Guardar Reporte
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}