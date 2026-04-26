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
import { Alerta, Usuario, IncidentType } from "@/types"
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
        description: "Eliminando todos los registros de alumnos e incidencias...",
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
        description: "No se pudieron eliminar todos los datos.",
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
        title: "Inyectando 500 Alumnos (v16.0)",
        description: "Generando alumnos con estados MIXTOS y muchas FALTAS en 1ro-5to...",
      })

      const GRADOS = ["1ro", "2do", "3ro", "4to", "5to"]
      const SECCIONES = ["A", "B", "C"]
      const NOMBRES = ["Juan", "Maria", "Carlos", "Ana", "Luis", "Elena", "Pedro", "Sofia", "Ricardo", "Carmen"]
      const APELLIDOS = ["Perez", "Garcia", "Rodriguez", "Martinez", "Lopez", "Soto", "Mendoza", "Vargas", "Quispe", "Rojas"]
      
      const TIPOS: IncidentType[] = [
        "Inasistencia", 
        "Tardanza", 
        "Comportamiento agresivo", 
        "Problema de salud", 
        "Conflicto entre alumnos", 
        "Observación académica"
      ]

      const DESC_TEMPLATES: Record<IncidentType, string[]> = {
        "Inasistencia": ["Faltó a clase sin justificación.", "Ausencia detectada en el primer periodo.", "No se presentó a la institución hoy.", "El apoderado no reportó la falta."],
        "Tardanza": ["Ingreso 15 minutos tarde.", "Llegó después del timbre de entrada.", "Tardanza reiterativa por problemas de transporte."],
        "Comportamiento agresivo": ["Mostró falta de respeto al docente.", "Uso de lenguaje soez.", "Actitud desafiante en el aula.", "Agresión física leve a un compañero."],
        "Problema de salud": ["Se retiró a enfermería por mareos.", "Dolor de cabeza intenso.", "Indisposición estomacal."],
        "Conflicto entre alumnos": ["Discusión verbal en el patio.", "Pelea por materiales escolares.", "Empujones durante el recreo."],
        "Observación académica": ["No cumplió con la tarea.", "Se distrae con facilidad.", "Bajo rendimiento en el examen."]
      }

      let batch = writeBatch(db)
      let operationsInBatch = 0
      let totalStudentsCreated = 0

      for (let i = 1; i <= 500; i++) {
        const studentRef = doc(collection(db, "students"))
        const nombre = NOMBRES[Math.floor(Math.random() * NOMBRES.length)]
        const apellido = APELLIDOS[Math.floor(Math.random() * APELLIDOS.length)]
        const fullStudentName = `${nombre} ${apellido} (Test #${i})`
        
        // Generar estados mixtos (33% de cada uno aproximadamente)
        const randStatus = Math.random()
        const estado = randStatus > 0.66 ? "Activo" : (randStatus > 0.33 ? "Inactivo" : "Suspendido")
        
        // Asignar grados de 1ro a 5to como prioridad
        const grado = GRADOS[Math.floor(Math.random() * GRADOS.length)]

        batch.set(studentRef, {
          nombre: nombre,
          apellido: `${apellido} (Test #${i})`,
          grado: grado,
          seccion: SECCIONES[Math.floor(Math.random() * SECCIONES.length)],
          estado: estado,
          fechaNacimiento: "2012-01-01",
          createdAt: new Date().toISOString()
        })
        
        operationsInBatch++
        totalStudentsCreated++

        // Generar incidencias: Mucha más probabilidad de faltas (80% probabilidad)
        const numIncidents = Math.floor(Math.random() * 8) + 1 
        for (let f = 1; f <= numIncidents; f++) {
          const isFalta = Math.random() > 0.2
          const type: IncidentType = isFalta ? "Inasistencia" : TIPOS[Math.floor(Math.random() * TIPOS.length)]
          
          const incRef = doc(collection(db, "incidences"))
          batch.set(incRef, {
            alumnoId: studentRef.id,
            alumnoNombre: fullStudentName,
            tipo: type,
            descripcion: DESC_TEMPLATES[type][Math.floor(Math.random() * DESC_TEMPLATES[type].length)],
            severidad: type === "Inasistencia" && f >= 3 ? "alto" : (type === "Comportamiento agresivo" ? "medio" : "bajo"),
            fecha: new Date(Date.now() - (f * 86400000)).toISOString(),
            registradoPor: "Sistema de Pruebas",
            registradorUserId: user.uid
          })
          operationsInBatch++

          if (type === "Inasistencia" && f >= 4) {
            const alertRef = doc(collection(db, "alerts"))
            batch.set(alertRef, {
              alumnoId: studentRef.id,
              alumnoNombre: fullStudentName,
              tipo: "Inasistencias",
              nivel: "rojo",
              mensaje: `${fullStudentName} ha acumulado ${f} faltas. Requiere intervención inmediata.`,
              fecha: new Date().toISOString(),
              leido: false,
              accionRequerida: "Citar al apoderado urgentemente."
            })
            operationsInBatch++
          }
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
        description: `Se inyectaron 500 alumnos con estados mixtos y abundantes faltas en grados 1ro-5to.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron inyectar los datos.",
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
          <p className="text-muted-foreground">Monitoreo global de la población estudiantil.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="border-red-500 text-red-700 hover:bg-red-50"
            onClick={clearTestData}
            disabled={isSeeding}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Limpiar Datos de Prueba
          </Button>
          <Button 
            variant="outline" 
            className="border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100 font-bold"
            onClick={runStressTest}
            disabled={isSeeding}
          >
            {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            Inyectar 500 Alumnos (Test)
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
              <CardDescription>Seguimiento en tiempo real de los sucesos escolares.</CardDescription>
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