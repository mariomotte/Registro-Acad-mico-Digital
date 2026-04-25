"use client"

import { useState, useEffect } from "react"
import { StatCards } from "@/components/dashboard/StatCards"
import { RecentIncidents } from "@/components/dashboard/RecentIncidents"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Users, AlertCircle, Loader2, Database, Zap, Sparkles } from "lucide-react"
import Link from "next/link"
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, where, limit, writeBatch, doc } from "firebase/firestore"
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
        title: "Iniciando inyección masiva v7.0",
        description: "Generando 500 alumnos con estados MIXTOS e inasistencias masivas en grados 1ro a 5to...",
      })

      const GRADOS = ["1ro", "2do", "3ro", "4to", "5to", "1ro Sec", "2do Sec", "3ro Sec", "4to Sec", "5to Sec"]
      const SECCIONES = ["A", "B", "C", "D"]
      const ESTADOS = ["Activo", "Inactivo", "Suspendido"]
      const NOMBRES = ["Juan", "Maria", "Carlos", "Ana", "Luis", "Elena", "Pedro", "Sofia", "Ricardo", "Carmen", "Diego", "Lucia", "Mateo", "Valentina", "Jose", "Francisca"]
      const APELLIDOS = ["Perez", "Garcia", "Rodriguez", "Martinez", "Lopez", "Soto", "Mendoza", "Castillo", "Ramos", "Vargas", "Torres", "Ruiz", "Guzman", "Alvarez"]
      
      const TIPOS: IncidentType[] = [
        "Inasistencia", 
        "Tardanza", 
        "Comportamiento agresivo", 
        "Problema de salud", 
        "Conflicto entre alumnos", 
        "Observación académica"
      ]

      const DESC_TEMPLATES: Record<IncidentType, string[]> = {
        "Inasistencia": ["Faltó sin aviso previo.", "No se presentó a la primera hora.", "Ausencia reiterada en la semana.", "Faltó alegando problemas personales.", "Inasistencia injustificada detectada."],
        "Tardanza": ["Llegó 15 minutos tarde.", "Ingreso después del timbre de formación.", "Tardanza recurrente.", "Llegó al finalizar la primera sesión.", "Llegó con demora injustificada."],
        "Comportamiento agresivo": ["Mostró actitud desafiante en clase.", "Gritos innecesarios durante el recreo.", "Lenguaje inapropiado con compañeros.", "Lanzó objetos en el salón de clases.", "Se negó a seguir instrucciones de forma agresiva.", "Agresión verbal al docente."],
        "Problema de salud": ["Manifestó dolor estomacal.", "Presentó fiebre leve.", "Mareos durante la educación física.", "Vómitos repentinos."],
        "Conflicto entre alumnos": ["Discusión por un asiento.", "Falta de respeto mutua en el patio.", "Malentendido durante trabajo grupal.", "Pelea física leve durante el recreo."],
        "Observación académica": ["No trajo los materiales.", "Se distrajo constantemente con el celular.", "No completó la tarea asignada.", "Se durmió durante la explicación del docente.", "Bajo rendimiento en el último examen."]
      }

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
        
        // Randomizar el estado para que NO todos estén activos
        const randEstado = Math.random()
        const estado = randEstado > 0.7 ? "Inactivo" : (randEstado > 0.5 ? "Suspendido" : "Activo")
        
        const studentData = {
          nombre: nombre,
          apellido: `${apellido} #${i}`,
          grado: GRADOS[Math.floor(Math.random() * GRADOS.length)],
          seccion: SECCIONES[Math.floor(Math.random() * SECCIONES.length)],
          estado: estado,
          fechaNacimiento: "2010-01-01",
          createdAt: new Date().toISOString()
        }
        
        batch.set(studentRef, studentData)
        operationsInBatch++
        totalStudents++

        // Generar muchas inasistencias (faltas)
        const numIncidents = Math.floor(Math.random() * 10) + 5 
        let inasistenciasCount = 0
        let agresividadCritica = false

        for (let f = 1; f <= numIncidents; f++) {
          // 70% de probabilidad de que sea Inasistencia para asegurar que haya muchas faltas
          const rand = Math.random()
          let type: IncidentType = "Inasistencia"
          
          if (rand > 0.7) {
            type = TIPOS[Math.floor(Math.random() * TIPOS.length)]
          }
          
          let severity: Severity = "bajo"
          
          if (type === "Inasistencia") inasistenciasCount++
          if (type === "Comportamiento agresivo") {
            severity = "alto"
            agresividadCritica = true
          } else if (type === "Tardanza") {
            severity = Math.random() > 0.7 ? "medio" : "bajo"
          } else {
            severity = Math.random() > 0.8 ? "alto" : (Math.random() > 0.5 ? "medio" : "bajo")
          }

          const incRef = doc(collection(db, "incidences"))
          batch.set(incRef, {
            alumnoId: studentRef.id,
            alumnoNombre: fullStudentName,
            tipo: type,
            descripcion: DESC_TEMPLATES[type][Math.floor(Math.random() * DESC_TEMPLATES[type].length)],
            severidad: severity,
            fecha: new Date(Date.now() - Math.floor(Math.random() * 2592000000)).toISOString(),
            registradoPor: "Sistema v7.0",
            registradorUserId: user.uid
          })
          operationsInBatch++
          totalIncidents++

          if (operationsInBatch >= 400) {
            await batch.commit()
            batch = writeBatch(db)
            operationsInBatch = 0
          }
        }

        // Alertas basadas en las faltas inyectadas
        if (inasistenciasCount >= 3 || agresividadCritica) {
          const alertRef = doc(collection(db, "alerts"))
          const alertType = inasistenciasCount >= 3 ? "Inasistencias" : "Gravedad"
          const nivel = (inasistenciasCount >= 5 || agresividadCritica) ? "rojo" : "amarillo"
          
          batch.set(alertRef, {
            alumnoId: studentRef.id,
            alumnoNombre: fullStudentName,
            tipo: alertType,
            nivel: nivel,
            mensaje: inasistenciasCount >= 3 
              ? `${fullStudentName} registra ${inasistenciasCount} faltas críticas acumuladas.`
              : `Alerta: Comportamiento agresivo grave detectado en ${fullStudentName}.`,
            fecha: new Date().toISOString(),
            leido: false,
            accionRequerida: nivel === "rojo" ? "Citar urgentemente al apoderado y derivar a psicología." : "Seguimiento preventivo."
          })
          operationsInBatch++
          totalAlerts++
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
        title: "¡Inyección Completada v7.0!",
        description: `Creados: ${totalStudents} alumnos con estados variados, ${totalIncidents} incidencias (faltas masivas) y ${totalAlerts} alertas.`,
      })
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Error en la inyección",
        description: "Hubo un problema al procesar los datos masivos.",
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
          <p className="text-muted-foreground">Resumen global de seguimiento estudiantil (Firestore).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="border-orange-500 bg-orange-50 text-orange-700 hover:bg-orange-100 font-bold shadow-md animate-pulse"
            onClick={runStressTest}
            disabled={isSeeding}
          >
            {isSeeding ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            {isSeeding ? "Inyectando Datos..." : "Inyectar 500 Alumnos (Test v7.0)"}
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 shadow-md">
            <Link href="/incidents/new">
              <Plus className="mr-2 h-4 w-4" /> Registrar Falta
            </Link>
          </Button>
        </div>
      </div>

      <StatCards />

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50">
            <div className="space-y-1">
              <CardTitle className="text-xl">Incidencias Recientes</CardTitle>
              <CardDescription>Reportes actuales de la base de datos.</CardDescription>
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