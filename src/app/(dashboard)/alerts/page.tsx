"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MOCK_ALERTS } from "@/lib/mock-data"
import { Bell, AlertTriangle, Clock, Trash2, Phone, UserRound } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS)

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, leido: true } : a))
  }

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id))
  }

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'rojo': return 'border-l-red-500 bg-red-50/50';
      case 'amarillo': return 'border-l-amber-500 bg-amber-50/50';
      case 'verde': return 'border-l-emerald-500 bg-emerald-50/50';
      default: return 'border-l-slate-300';
    }
  }

  const getBadgeVariant = (nivel: string) => {
    switch (nivel) {
      case 'rojo': return 'bg-red-100 text-red-700 border-red-200';
      case 'amarillo': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'verde': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100';
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline flex items-center gap-2">
            <Bell className="text-primary" />
            Centro de Alertas Automáticas
          </h2>
          <p className="text-muted-foreground">Seguimiento de tardanzas, inasistencias y casos graves.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAlerts(alerts.map(a => ({ ...a, leido: true })))}>
          Marcar todas como leídas
        </Button>
      </div>

      <div className="space-y-4">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <Card key={alert.id} className={cn(
              "border-none shadow-sm transition-all hover:shadow-md border-l-4",
              getNivelColor(alert.nivel),
              alert.leido && "opacity-60"
            )}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-2 rounded-full",
                    alert.nivel === 'rojo' ? 'bg-red-100 text-red-600' : 
                    alert.nivel === 'amarillo' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                  )}>
                    <AlertTriangle size={20} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{alert.alumnoNombre}</h3>
                        <Badge variant="outline" className={cn("text-[10px] uppercase px-2", getBadgeVariant(alert.nivel))}>
                          {alert.nivel}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock size={12} />
                        {format(new Date(alert.fecha), "p", { locale: es })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">{alert.tipo}: {alert.mensaje}</p>
                    
                    {alert.nivel === 'rojo' && (
                      <div className="mt-3 p-3 bg-red-100/50 rounded-md border border-red-200 flex items-center gap-3">
                        <Phone size={16} className="text-red-600" />
                        <span className="text-sm text-red-700 font-bold">
                          ACCIÓN REQUERIDA: {alert.accionRequerida}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                      <Button variant="link" size="sm" className="h-auto p-0 text-primary font-semibold" asChild>
                        <Link href={`/students/${alert.alumnoId}`}>Ver Ficha</Link>
                      </Button>
                      {alert.nivel === 'rojo' && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-accent font-semibold" asChild>
                          <Link href="/psychology">Derivar a Psicología</Link>
                        </Button>
                      )}
                      {!alert.leido && (
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-slate-500" onClick={() => markAsRead(alert.id)}>
                          Leída
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
            <h3 className="text-lg font-semibold text-slate-400">No hay alertas activas</h3>
          </div>
        )}
      </div>
    </div>
  )
}
