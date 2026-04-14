
"use client"

import { useState, useEffect } from "react"
import { Bell, AlertTriangle, CheckCircle2, Info, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCollection, useMemoFirebase, useFirestore } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Alerta } from "@/types"

export function NotificationsNav() {
  const db = useFirestore()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const alertsQuery = useMemoFirebase(() => {
    return query(
      collection(db, "alerts"),
      orderBy("fecha", "desc"),
      limit(5)
    )
  }, [db])

  const { data: alerts, isLoading } = useCollection<Alerta>(alertsQuery)
  const unreadCount = alerts?.filter(a => !a.leido).length || 0

  const getAlertIcon = (nivel: string) => {
    switch (nivel) {
      case 'rojo': return <AlertTriangle className="text-red-500" size={16} />;
      case 'amarillo': return <Info className="text-amber-500" size={16} />;
      case 'verde': return <CheckCircle2 className="text-emerald-500" size={16} />;
      default: return <Bell size={16} />;
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 shadow-xl border-none" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50/50 rounded-t-lg">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            Notificaciones
            {unreadCount > 0 && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount} nuevas</span>}
          </h3>
          <Link href="/alerts" className="text-xs text-primary hover:underline font-medium">
            Ver todas
          </Link>
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full p-8 space-y-2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground italic">Buscando alertas...</p>
            </div>
          ) : alerts && alerts.length > 0 ? (
            <div className="flex flex-col">
              {alerts.map((alert) => (
                <Link 
                  key={alert.id} 
                  href={`/students/${alert.alumnoId}`}
                  className={cn(
                    "flex gap-3 p-4 border-b hover:bg-slate-50 transition-colors last:border-0",
                    !alert.leido && "bg-primary/5"
                  )}
                >
                  <div className="mt-1 shrink-0">
                    {getAlertIcon(alert.nivel)}
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 truncate">{alert.alumnoNombre}</p>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {alert.mensaje}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {isMounted ? format(new Date(alert.fecha), "p", { locale: es }) : "..."}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <Bell size={32} className="text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">No hay notificaciones recientes</p>
            </div>
          )}
        </ScrollArea>
        <div className="p-2 bg-slate-50 rounded-b-lg border-t">
          <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 hover:text-primary" asChild>
            <Link href="/alerts">
              Panel de control de alertas <ArrowRight size={12} className="ml-1" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
