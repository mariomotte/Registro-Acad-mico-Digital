"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { UserPlus, Save, ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const studentSchema = z.object({
  nombres: z.string().min(2, "Los nombres deben tener al menos 2 caracteres"),
  apellidos: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres"),
  dni: z.union([
    z.string().length(8, "El DNI debe tener exactamente 8 dígitos").regex(/^\d+$/, "El DNI debe contener solo números"),
    z.literal("")
  ]).optional(),
  grado: z.string().min(1, "Seleccione un grado"),
  seccion: z.string().min(1, "Seleccione una sección"),
  nivel: z.literal("Secundaria").optional(),
  estado: z.enum(["Activo", "Inactivo", "Suspendido"]),
  apoderado: z.union([
    z.string().min(2, "El nombre del apoderado debe tener al menos 2 caracteres"),
    z.literal("")
  ]).optional(),
  telefono: z.union([
    z.string().min(9, "El teléfono debe tener al menos 9 dígitos").regex(/^\+?\d+$/, "El teléfono debe ser un número válido"),
    z.literal("")
  ]).optional()
})

type StudentFormValues = z.infer<typeof studentSchema>

export default function NewStudentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useSupabaseAuth()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      estado: "Activo",
      nivel: "Secundaria",
      dni: "",
      apoderado: "",
      telefono: ""
    }
  })

  const onSubmit = async (data: StudentFormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes estar autenticado para realizar esta acción.",
      })
      return
    }

    setIsLoading(true)

    try {
      const filteredData = {
        nombres: data.nombres,
        apellidos: data.apellidos,
        grado: data.grado,
        seccion: data.seccion,
        nivel: "Secundaria",
        estado: data.estado,
        sexo: 'M',
        codigo_estudiante: null,
        dni: data.dni || null,
        apoderado: data.apoderado || null,
        telefono: data.telefono || null
      }
      const { data: inserted, error } = await supabase
        .from('alumnos')
        .insert([filteredData])
        .select('id')
      
      if (error) {
        if (error.code === '23505') {
          throw new Error("Ya existe un alumno registrado con ese DNI.")
        }
        throw error
      }

      // Registro de Auditoria
      const newStudent = inserted?.[0]
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        modulo: 'ALUMNOS',
        accion: 'CREAR_ALUMNO',
        registroId: newStudent?.id,
        descripcion: `Registró al alumno ${data.nombres} ${data.apellidos}.`,
        datosNuevos: data
      })
      
      toast({
        title: "Registro exitoso",
        description: `El alumno ${data.nombres} ${data.apellidos} ha sido registrado correctamente.`,
      })
      router.push("/students")
    } catch (error: any) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error.message || "No se pudo registrar al alumno en la base de datos.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const gradosDisponibles = ["1°", "2°", "3°", "4°", "5°"]
  const seccionesDisponibles = ["A", "B", "C", "D"]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-headline">Registrar Nuevo Alumno</h2>
          <p className="text-muted-foreground">Ingresa los datos del estudiante para incorporarlo al sistema.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-none shadow-md">
          <CardHeader className="bg-slate-50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus size={20} className="text-primary" />
              Datos del Estudiante
            </CardTitle>
            <CardDescription>Asegúrese de llenar todos los campos obligatorios.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombres">Nombres</Label>
                <Input 
                  id="nombres" 
                  {...register("nombres")}
                />
                {errors.nombres && <p className="text-xs text-red-500 font-medium">{errors.nombres.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input 
                  id="apellidos" 
                  {...register("apellidos")}
                />
                {errors.apellidos && <p className="text-xs text-red-500 font-medium">{errors.apellidos.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dni">DNI (Opcional)</Label>
                <Input 
                  id="dni" 
                  maxLength={8}
                  {...register("dni")}
                />
                {errors.dni && <p className="text-xs text-red-500 font-medium">{errors.dni.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="estado">Estado Inicial</Label>
                <Select defaultValue="Activo" onValueChange={(val) => setValue("estado", val as any, { shouldValidate: true })}>
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

            <div className="grid gap-4 md:grid-cols-2">
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

            <div className="grid gap-4 md:grid-cols-2 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="apoderado">Nombre del Apoderado (Opcional)</Label>
                <Input 
                  id="apoderado" 
                  {...register("apoderado")}
                />
                {errors.apoderado && <p className="text-xs text-red-500 font-medium">{errors.apoderado.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono de Contacto (Opcional)</Label>
                <Input 
                  id="telefono" 
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
