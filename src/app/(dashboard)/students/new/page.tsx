
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { UserPlus, Save, ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function NewStudentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useSupabaseAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    grado: "",
    seccion: "",
    fechaNacimiento: "",
    estado: "Activo"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes estar autenticado para realizar esta acción.",
      })
      return
    }

    if (!formData.grado || !formData.seccion) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor selecciona el grado y la sección.",
      })
      return
    }

    setIsLoading(true)

    try {
      const studentData = {
        nombre: formData.nombre,
        apellido: formData.apellido,
        grado: formData.grado,
        seccion: formData.seccion,
        fecha_nacimiento: formData.fechaNacimiento,
        estado: formData.estado,
      }

      const { error } = await supabase.from('alumnos').insert([studentData])
      
      if (error) throw error;
      
      toast({
        title: "Registro exitoso",
        description: `El alumno ${formData.nombre} ha sido registrado correctamente.`,
      })
      router.push("/students")
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudo registrar al alumno en la base de datos.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline">Registrar Nuevo Alumno</h2>
          <p className="text-muted-foreground">Ingresa los datos del estudiante para incorporarlo al sistema.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-none shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus size={20} className="text-primary" />
              Datos del Estudiante
            </CardTitle>
            <CardDescription>Asegúrese de que los datos coincidan con su documento de identidad.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombres</Label>
                <Input 
                  id="nombre" 
                  placeholder="Ej. Juan Carlos" 
                  required 
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellidos</Label>
                <Input 
                  id="apellido" 
                  placeholder="Ej. Pérez García" 
                  required 
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="grado">Grado</Label>
                <Select required onValueChange={(val) => setFormData({ ...formData, grado: val })}>
                  <SelectTrigger id="grado">
                    <SelectValue placeholder="Seleccionar grado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1ro">1ro de Primaria</SelectItem>
                    <SelectItem value="2do">2do de Primaria</SelectItem>
                    <SelectItem value="3ro">3ro de Primaria</SelectItem>
                    <SelectItem value="4to">4to de Primaria</SelectItem>
                    <SelectItem value="5to">5to de Primaria</SelectItem>
                    <SelectItem value="6to">6to de Primaria</SelectItem>
                    <SelectItem value="1ro Sec">1ro de Secundaria</SelectItem>
                    <SelectItem value="2do Sec">2do de Secundaria</SelectItem>
                    <SelectItem value="3ro Sec">3ro de Secundaria</SelectItem>
                    <SelectItem value="4to Sec">4to de Secundaria</SelectItem>
                    <SelectItem value="5to Sec">5to de Secundaria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seccion">Sección</Label>
                <Select required onValueChange={(val) => setFormData({ ...formData, seccion: val })}>
                  <SelectTrigger id="seccion">
                    <SelectValue placeholder="Seleccionar sección" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Sección A</SelectItem>
                    <SelectItem value="B">Sección B</SelectItem>
                    <SelectItem value="C">Sección C</SelectItem>
                    <SelectItem value="D">Sección D</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                <Input 
                  id="fechaNacimiento" 
                  type="date" 
                  required 
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado Inicial</Label>
                <Select defaultValue="Activo" onValueChange={(val) => setFormData({ ...formData, estado: val as any })}>
                  <SelectTrigger id="estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t py-4 flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isLoading ? "Registrando..." : "Confirmar Registro"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
