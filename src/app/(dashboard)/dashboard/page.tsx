"use client"

import { useState, useEffect } from "react"
import { StatCards } from "@/components/dashboard/StatCards"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Zap } from "lucide-react"
import Link from "next/link"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { Alerta } from "@/types"

export default function DashboardPage() {
  const { user, loading: isUserLoading } = useSupabaseAuth()
  const [alerts, setAlerts] = useState<Alerta[]>([])
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true)

  useEffect(() => {
    let mounted = true;
    async function loadAlerts() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('alertas')
          .select('*')
          .eq('leido', false)
          .order('fecha', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        
        if (data && mounted) {
          setAlerts(data.map((a: any) => ({
            id: a.id,
            alumnoId: a.alumno_id,
            alumnoNombre: a.alumno_nombre,
            tipo: a.tipo,
            nivel: a.nivel,
            mensaje: a.mensaje,
            fecha: a.fecha,
            leido: a.leido,
            accionRequerida: a.accion_requerida
          })));
        }
      } catch (err) {
        console.error("Error fetching alerts", err);
      } finally {
        if (mounted) setIsLoadingAlerts(false);
      }
    }
    
    if (!isUserLoading) {
      loadAlerts();
    }
    
    return () => { mounted = false; };
  }, [user, isUserLoading]);

  if (isUserLoading) {
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
          <p className="text-muted-foreground">Monitoreo global de la población estudiantil, asistencias, tardanzas, incidencias, alertas y reportes.</p>
        </div>
      </div>

      <StatCards />

      <div className="grid gap-6 grid-cols-1">
        <Card className="border-none shadow-sm w-full">
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