"use client"

import { useState, useEffect } from "react"
import { StatCards } from "@/components/dashboard/StatCards"
import { RecentIncidents } from "@/components/dashboard/RecentIncidents"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, AlertCircle, Loader2, Database, Zap, Trash2 } from "lucide-react"
import Link from "next/link"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, limit, writeBatch, doc, getDocs } from "firebase/firestore"
import { Alerta, Usuario, IncidentType, Severity } from "@/types"
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
    if (!user) return null;
    return query(collection(db, "alerts"), where("leido", "==", false), limit(5))
  }, [db, user])

  const { data: alerts, isLoading: isLoadingAlerts } = useCollection<Alerta>(alertsQuery)

  const clearTestData = async () => {
    if (!user) return
    setIsSeeding(true)
    try {
      toast({
        title: "Iniciando limpieza masiva",
        description: "Eliminando registros de alumnos, incidencias y alertas...",
      })

      const collectionsToClear = ["students", "incidences", "alerts"]
      let totalDeleted = 0

      for (const collName of collectionsToClear) {
        const q = query(collection(db, collName), limit(500))
        const snapshot = await getDocs(q)
        
        if (snapshot.empty) continue

        const batch = writeBatch(db)
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref)
          totalDeleted++
        })
        
        await batch.commit()
      }

      toast({
        title: "Limpieza completada",
        description: `Se han eliminado ${totalDeleted} registros de prueba satisfactoriamente.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error en la limpieza",
        description: "No se pudieron eliminar todos los datos. Intente de nuevo.",
      })
    } finally {
      setIsSeeding(false)
    }
  }

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
        title: "Iniciando inyección masiva v10.0",
        description: "Generando 500 alumnos con estados MIXTOS y faltas críticas...",
      })

      const GRADOS = ["1ro", "2do", "3ro", "4to", "5to"]
      const SECCIONES = ["A", "B", "C", "D"]
      const NOMBRES = ["Juan", "Maria", "Carlos", "Ana", "Luis", "Elena", "Pedro", "Sofia", "Ricardo", "Carmen"]
      const APELLIDOS = ["Perez", "Garcia", "Rodriguez", "Martinez", "Lopez", "Soto", "Mendoza"]
      
      const TIPOS: IncidentType[] = [
        "Inasistencia", 
        "Tardanza", 
        "Comportamiento agresivo", 
        "Problema de salud", 
        "Conflicto entre alumnos", 
        "Observación académica"
      ]

      const DESC_TEMPLATES: Record<IncidentType, string[]> = {
        "Inasistencia": ["Faltó sin aviso previo.", "Ausencia reiterada en la semana.", "Inasistencia injustificada detectada."],
        "Tardanza": ["Llegó tarde.", "Ingreso después del timbre.", "Tardanza recurrente."],
        "Comportamiento agresivo": ["Mostró actitud desafiante.", "Lenguaje inapropiado.", "Agresión verbal al docente."],
        "Problema de salud": ["Manifestó dolor estomacal.", "Fiebre leve.", "Mareos."],
        "Conflicto entre alumnos": ["Discusión por un asiento.", "Malentendido en el patio.", "Pelea física leve."],
        "Observación académica": ["No trajo materiales.", "Se distrajo constantemente.", "Bajo rendimiento."]
      }

      let batch = writeBatch(db)
      let operationsInBatch = 0
      let totalStudents = 0

      for (let i = 1; i <= 500; i++) {
        const studentRef = doc(collection(db, "students"))
        const nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)]
        const apellido = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)]
        const fullStudentName = `${nombre} ${apellido} #${i}`
        
        const randEstado = Math.random()
        const estado = randEstado > 0.6 ? "Inactivo" : (randEstado > 0.3 ? "Suspendido" : "Activo")
        const grado = GRADOS[Math.floor(Math.random() * GRADOS.length)]

        batch.set(studentRef, {
          nombre: nombre,
          apellido: `${apellido} #${i}`,
          grado: grado,
          seccion: SECCIONES[Math.floor(Math.random() * SECCIONES.length)],
          estado: estado,
          fechaNacimiento: "2012-01-01",
          createdAt: new Date().toISOString()
        })
        
        operationsInBatch++
        totalStudents++

        // Generar incidencias (faltas)
        const numIncidents = Math.floor(Math.random() * 3) + 1
        for (let f = 1; f <= numIncidents; f++) {
          const type: IncidentType = Math.random() > 0.5 ? "Inasistencia" : TIPOS[Math.floor(Math.random() * TIPOS.length)]
          const incRef = doc(collection(db, "incidences"))
          batch.set(incRef, {
            alumnoId: studentRef.id,
            alumnoNombre: fullStudentName,
            tipo: type,
            descripcion: DESC_TEMPLATES[type][Math.floor(Math.random() * DESC_TEMPLATES[type].length)],
            severidad: type === "Inasistencia" ? "medio" : "bajo",
            fecha: new Date().toISOString(),
            registradoPor: "Sistema Test",
            registradorUserId: user.uid
          })
          operationsInBatch++
        }

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
        title: "¡Éxito!",
        description: `Se inyectaron ${totalStudents} alumnos con sus incidencias.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un problema al inyectar los datos.",
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 font-headline">Panel Institucional</h2>
          <p className="text-muted-foreground">Gestión y seguimiento en tiempo real (Firestore).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="border-red-500 text-red-700 hover:bg-red-50"
            onClick={clearTestData}
            disabled={isSeeding}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar Datos
          </Button>
          <Button 
            variant="outline" 
            className="border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100 font-bold"
            onClick={runStressTest}
            disabled={isSeeding}
          >
            {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            Inyectar 500 Alumnos
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 shadow-md">
            <Link href="/incidents/new">
              <Plus className="mr-2 h-4 w-4" /> Registrar Incidencia
            </Link>
          </Button>
        </div>
      </div>

      <StatCards />

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50">
            <div className="space-y-1">
              <CardTitle className="text-xl">Reportes Recientes</CardTitle>
              <CardDescription>Últimas incidencias e inasistencias registradas.</CardDescription>
            </div>
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
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-bold text-slate-700 truncate">{alert.alumnoNombre}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">{alert.tipo}</span>
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
                Sin alertas críticas pendientes.
              </div>
            )}
            <Button variant="outline" className="w-full mt-2 text-xs font-bold py-5" asChild>
              <Link href="/alerts">Ver todas las alertas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
