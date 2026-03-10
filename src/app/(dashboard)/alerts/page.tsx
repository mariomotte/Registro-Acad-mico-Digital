
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MOCK_ALERTS } from "@/lib/mock-data"
import { Bell, CheckCircle2, AlertTriangle, Clock, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS)

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, leido: true } : a))
  }

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline flex items-center gap-2">
            <Bell className="text-accent" />
            Centro de Alertas
          </h2>
          <p className="text-muted-foreground">Notificaciones automáticas sobre el estado de tus alumnos.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAlerts(alerts.map(a => ({ ...a, leido: true })))}>
          Marcar todas como leídas
        </Button>
      </div>

      <div className="space-y-4">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <Card key={alert.id} className={`border-none shadow-sm transition-all hover:shadow-md ${alert.leido ? 'opacity-70' : 'border-l-4 border-l-accent bg-accent/5'}`}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${alert.tipo === 'Gravedad' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    {alert.tipo === 'Gravedad' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900">{alert.tipo}: {alert.alumnoNombre}</h3>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} />
                        {format(new Date(alert.fecha), "p", { locale: es })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{alert.mensaje}</p>
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                      <Button variant="link" size="sm" className="h-auto p-0 text-accent font-semibold" asChild>
                        <Link href={`/students/${alert.alumnoId}`}>Ver Ficha del Alumno</Link>
                      </Button>
                      {!alert.leido && (
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-slate-500 hover:text-accent" onClick={() => markAsRead(alert.id)}>
                          Marcar como leída
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-slate-400 hover:text-destructive ml-auto" onClick={() => deleteAlert(alert.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-lg border-2 border-dashed">
            <Bell size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-lg font-semibold text-slate-400">No tienes alertas pendientes</h3>
            <p className="text-sm text-slate-400">Te avisaremos cuando ocurra algo importante.</p>
          </div>
        )}
      </div>
    </div>
  )
}
