"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { logAudit } from "@/lib/audit"
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
import { Edit, Save, ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const studentSchema = z.object({
  nombres: z.string().min(2, "Los nombres deben tener al menos 2 caracteres"),
  apellidos: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres"),
  dni: z.string().length(8, "El DNI debe tener exactamente 8 dígitos").regex(/^\d+$/, "El DNI debe contener solo números"),
  codigo_estudiante: z.string().min(3, "El código de estudiante es requerido"),
  grado: z.string().min(1, "Seleccione un grado"),
  seccion: z.string().min(1, "Seleccione una sección"),
  nivel: z.enum(["Primaria", "Secundaria"], { required_error: "Seleccione el nivel educativo" }),
  estado: z.enum(["Activo", "Inactivo", "Suspendido"]),
  apoderado: z.string().min(5, "El nombre del apoderado debe tener al menos 5 caracteres"),
  telefono: z.string().min(9, "El teléfono debe tener al menos 9 dígitos").regex(/^\+?\d+$/, "El teléfono debe ser un número válido"),
  fecha_nacimiento: z.string().min(1, "La fecha de nacimiento es requerida")
})

type StudentFormValues = z.infer<typeof studentSchema>

export default function EditStudentPage() {
  const router = useRouter()
  const params = useParams()
  const { studentId, id } = params
  const actualId = id || studentId
  
  const { toast } = useToast()
  const { user } = useSupabaseAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema)
  })

  useEffect(() => {
    let mounted = true
    async function loadStudent() {
      if (!actualId) return
      try {
        const { data, error } = await supabase
          .from('alumnos')
          .select('nombres, apellidos, dni, codigo_estudiante, grado, seccion, nivel, estado, apoderado, telefono, fecha_nacimiento')
          .eq('id', actualId)
          .single()
        
        if (error) throw error
        
        if (data && mounted) {
          reset({
            nombres: data.nombres,
            apellidos: data.apellidos,
            dni: data.dni,
            codigo_estudiante: data.codigo_estudiante,
            grado: data.grado,
            seccion: data.seccion,
            nivel: data.nivel,
            estado: data.estado,
            apoderado: data.apoderado,
            telefono: data.telefono,
            fecha_nacimiento: data.fecha_nacimiento || ""
          })
        }
      } catch (err) {
        console.error("Error loading student:", err)
        toast({
          variant: "destructive",
          title: "Error al cargar",
          description: "No se pudo cargar la ficha del alumno."
        })
        router.push("/students")
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    loadStudent()
    return () => { mounted = false }
  }, [actualId, reset, router, toast])

  const onSubmit = async (data: StudentFormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes estar autenticado para realizar esta acción.",
      })
      return
    }

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('alumnos')
        .update(data)
        .eq('id', actualId)
      
      if (error) {
        if (error.code === '23505') {
          throw new Error("Ya existe un alumno registrado con ese DNI o Código de Estudiante.")
        }
        throw error
      }

      // Registro de Auditoria
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        modulo: 'ALUMNOS',
        accion: 'EDITAR_ALUMNO',
        registroId: actualId as string,
        descripcion: `Actualizó datos del alumno ${data.nombres} ${data.apellidos}.`,
        datosNuevos: data
      })
      
      toast({
        title: "Actualización exitosa",
        description: `El alumno ${data.nombres} ${data.apellidos} ha sido actualizado correctamente.`,
      })
      router.push(`/students/${actualId}`)
    } catch (error: any) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error.message || "No se pudieron guardar los cambios del alumno.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const gradosDisponibles = ["1ro", "2do", "3ro", "4to", "5to", "6to", "1ro Sec", "2do Sec", "3ro Sec", "4to Sec", "5to Sec"]
  const seccionesDisponibles = ["A", "B", "C", "D"]

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline">Editar Ficha del Alumno</h2>
          <p className="text-muted-foreground">Modifica la información general o cambia el estado del alumno.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-none shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit size={20} className="text-primary" />
              Modificar Datos
            </CardTitle>
            <CardDescription>Asegúrese de que la información sea verídica.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombres">Nombres</Label>
                <Input 
                  id="nombres" 
                  placeholder="Ej. Juan Carlos" 
                  {...register("nombres")}
                />
                {errors.nombres && <p className="text-xs text-red-500 font-medium">{errors.nombres.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input 
                  id="apellidos" 
                  placeholder="Ej. Pérez García" 
                  {...register("apellidos")}
                />
                {errors.apellidos && <p className="text-xs text-red-500 font-medium">{errors.apellidos.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <Input 
                  id="dni" 
                  placeholder="8 dígitos" 
                  maxLength={8}
                  {...register("dni")}
                />
                {errors.dni && <p className="text-xs text-red-500 font-medium">{errors.dni.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo_estudiante">Código del Estudiante</Label>
                <Input 
                  id="codigo_estudiante" 
                  placeholder="Ej. EST-2026-0099" 
                  {...register("codigo_estudiante")}
                />
                {errors.codigo_estudiante && <p className="text-xs text-red-500 font-medium">{errors.codigo_estudiante.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="nivel">Nivel</Label>
                <Select onValueChange={(val) => setValue("nivel", val as any, { shouldValidate: true })}>
                  <SelectTrigger id="nivel">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primaria">Primaria</SelectItem>
                    <SelectItem value="Secundaria">Secundaria</SelectItem>
                  </SelectContent>
                </Select>
                {errors.nivel && <p className="text-xs text-red-500 font-medium">{errors.nivel.message}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="grado">Grado</Label>
                <Select onValueChange={(val) => setValue("grado", val, { shouldValidate: true })}>
                  <SelectTrigger id="grado">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradosDisponibles.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.grado && <p className="text-xs text-red-500 font-medium">{errors.grado.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="seccion">Sección</Label>
                <Select onValueChange={(val) => setValue("seccion", val, { shouldValidate: true })}>
                  <SelectTrigger id="seccion">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {seccionesDisponibles.map(s => (
                      <SelectItem key={s} value={s}>Sección {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.seccion && <p className="text-xs text-red-500 font-medium">{errors.seccion.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input 
                  id="fecha_nacimiento" 
                  type="date" 
                  {...register("fecha_nacimiento")}
                />
                {errors.fecha_nacimiento && <p className="text-xs text-red-500 font-medium">{errors.fecha_nacimiento.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado del Alumno</Label>
                <Select onValueChange={(val) => setValue("estado", val as any, { shouldValidate: true })}>
                  <SelectTrigger id="estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                    <SelectItem value="Suspendido">Suspendido</SelectItem>
                  </SelectContent>
                </Select>
                {errors.estado && <p className="text-xs text-red-500 font-medium">{errors.estado.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="apoderado">Nombre del Apoderado</Label>
                <Input 
                  id="apoderado" 
                  placeholder="Ej. Manuel Pérez Silva" 
                  {...register("apoderado")}
                />
                {errors.apoderado && <p className="text-xs text-red-500 font-medium">{errors.apoderado.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono de Contacto</Label>
                <Input 
                  id="telefono" 
                  placeholder="9 dígitos" 
                  maxLength={12}
                  {...register("telefono")}
                />
                {errors.telefono && <p className="text-xs text-red-500 font-medium">{errors.telefono.message}</p>}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t py-4 flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
