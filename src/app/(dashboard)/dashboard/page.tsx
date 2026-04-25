
"use client"

import { useState, useEffect } from "react"
import { StatCards } from "@/components/dashboard/StatCards"
import { RecentIncidents } from "@/components/dashboard/RecentIncidents"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, AlertCircle, Loader2, Database, Zap } from "lucide-react"
import Link from "next/link"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, limit, writeBatch, doc } from "firebase/firestore"
import { Alerta, Usuario } from "@/types"
import { useToast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const userDocRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile } = useDoc<Usuario>(userDocRef)

  const alertsQuery = useMemoFirebase(() => {
    if (!user || isUserLoading) return null;
    return query(collection(db, "alerts"), where("leido", "==", false), limit(5))
  }, [db, user, isUserLoading])

  const { data: alerts, isLoading: isLoadingAlerts } = useCollection<Alerta>(alertsQuery)

  const runStressTest = async () => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Debes estar autenticado para realizar la inyección."
        })
        return
    }
    
    setIsSeeding(true)
    
    try {
      toast({
        title: "Iniciando inyección",
        description: "Generando 500 alumnos y sus incidencias (procesando por lotes)...",
      })

      const GRADOS = ["1ro Sec", "2do Sec", "3ro Sec", "4to Sec", "5to Sec"]
      const SECCIONES = ["A", "B", "C", "D"]
      const NOMBRES = ["Juan", "Maria", "Carlos", "Ana", "Luis", "Elena", "Pedro", "Sofia", "Ricardo", "Carmen", "Diego", "Lucia", "Mateo", "Valentina"]
      const APELLIDOS = ["Perez", "Garcia", "Rodriguez", "Martinez", "Lopez", "Soto", "Mendoza", "Castillo", "Ramos", "Vargas", "Torres", "Ruiz", "Guzman"]

      let batch = writeBatch(db)
      let operationsInBatch = 0
      let totalStudents = 0
      let totalIncidents = 0
      let totalAlerts = 0

      for (let i = 1; i <= 500; i++) {
        const studentRef = doc(collection(db, "students"))
        const nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)]
        const apellido = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)]
        const fullStudentName = `${nombre} ${apellido} #${i}`
        
        const studentData = {
          nombre: nombre,
          apellido: `${apellido} #${i}`,
          grado: GRADOS[Math.floor(Math.random() * GRADOS.length)],
          seccion: SECCIONES[Math.floor(Math.random() * SECCIONES.length)],
          estado: "Activo",
          fechaNacimiento: "2010-01-01",
          createdAt: new Date().toISOString()
        }
        
        batch.set(studentRef, studentData)
        operationsInBatch++
        totalStudents++

        const inasistencias = Math.floor(Math.random() * 6)
        for (let f = 1; f <= inasistencias; f++) {
          const incRef = doc(collection(db, "incidences"))
          batch.set(incRef, {
            alumnoId: studentRef.id,
            alumnoNombre: fullStudentName,
            tipo: "Inasistencia",
            descripcion: `Inasistencia automática generada por prueba de estrés #${f}`,
            severidad: f > 3 ? "alto" : "bajo",
            fecha: new Date().toISOString(),
            registradoPor: "Sistema de Estrés",
            registradorUserId: user.uid
          })
          operationsInBatch++
          totalIncidents++
        }

        if (inasistencias >= 4) {
          const alertRef = doc(collection(db, "alerts"))
          batch.set(alertRef, {
            alumnoId: studentRef.id,
            alumnoNombre: fullStudentName,
            tipo: "Inasistencias",
            nivel: "rojo",
            mensaje: `${fullStudentName} ha superado el límite de 3 inasistencias.`,
            fecha: new Date().toISOString(),
            leido: false,
            accionRequerida: "Citar al apoderado de forma urgente."
          })
          operationsInBatch++
          totalAlerts++
        }

        // Firestore batch limit is 500 operations. We commit at 400 to be safe.
        if (operationsInBatch >= 400) {
          await batch.commit()
          batch = writeBatch(db)
          operationsInBatch = 0
        }
      }

      if (operationsInBatch > 0) {
        await batch.commit()
      }

      toast({
        title: "¡Inyección Completada!",
        description: `Se crearon ${totalStudents} alumnos, ${totalIncidents} incidencias y ${totalAlerts} alertas rojas.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error en la inyección",
        description: "No se pudieron generar todos los datos. Revisa la consola.",
      })
    } finally {
      setIsSeeding(false)
    }
  }

  if (isUserLoading || !isMounted) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 font-headline">Resumen Institucional</h2>
          <p className="text-muted-foreground">Bienvenido, {user?.displayName || "Usuario"}. Gestiona el estado de tu institución.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 font-bold"
            onClick={runStressTest}
            disabled={isSeeding}
          >
            {isSeeding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            {isSeeding ? "Inyectando..." : "Inyectar 500 Alumnos (Test)"}
          </Button>
          <Button asChild variant="outline" className="hidden md:flex">
            <Link href="/students">
              <Users className="mr-2 h-4 w-4" /> Ver Alumnos
            </Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/incidents/new">
              <Plus className="mr-2 h-4 w-4" /> Nueva Incidencia
            </Link>
          </Button>
        </div>
      </div>

      <StatCards />

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50">
            <div className="space-y-1">
              <CardTitle className="text-xl">Últimos Reportes</CardTitle>
              <CardDescription>Eventos registrados recientemente en la plataforma.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-primary font-bold">
              <Link href="/incidents">Ver historial completo</Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <RecentIncidents />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              Alertas Prioritarias
            </CardTitle>
            <CardDescription>Casos que requieren atención inmediata.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingAlerts ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">
                      {alert.nivel === 'rojo' ? '🔴' : alert.nivel === 'amarillo' ? '🟡' : '🟢'}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 group-hover:text-primary transition-colors">{alert.alumnoNombre}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{alert.tipo}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href={`/students/${alert.alumnoId}`}>
                      <Zap size={14} className="text-orange-500" />
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm italic">
                No hay alertas críticas pendientes.
              </div>
            )}
            <Button variant="outline" className="w-full mt-2 text-xs font-bold py-5" asChild>
              <Link href="/alerts">Gestionar todas las alertas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
