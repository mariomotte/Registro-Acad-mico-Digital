
"use client"

import { useState, useEffect } from "react"
import { Bell, AlertTriangle, CheckCircle2, Info, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Alerta } from "@/types"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"

export function NotificationsNav() {
  const { user, loading: isUserLoading } = useSupabaseAuth()
  const [isMounted, setIsMounted] = useState(false)
  const [alerts, setAlerts] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  useEffect(() => {
    let mounted = true;
    async function loadAlerts() {
      if (!user) return;
      try {
        const [alertsRes, unreadRes] = await Promise.all([
          supabase
            .from('alertas')
            .select('id, leido, nivel, alumno_id, alumno_nombre, mensaje, fecha, titulo, destinatario')
            .order('fecha', { ascending: false })
            .limit(5),
          supabase
            .from('alertas')
            .select('id', { count: 'exact', head: true })
            .eq('leido', false)
        ]);
        
        if (alertsRes.error) throw alertsRes.error;
        if (unreadRes.error) throw unreadRes.error;
        
        if (mounted) {
          setAlerts(alertsRes.data || []);
          setUnreadCount(unreadRes.count || 0);
        }
      } catch (err) {
        console.error("Error fetching alerts", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    
    if (!isUserLoading) {
      loadAlerts();
    }
    
    return () => { mounted = false; };
  }, [user, isUserLoading]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-nav-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alertas'
        },
        (payload) => {
          const newAlert = payload.new;
          const recipient = String(newAlert?.destinatario || '').toLowerCase();
          const currentRole = user.role.toLowerCase();
          const currentEmail = user.email.toLowerCase();
          const isForCurrentUser = !recipient || recipient === currentRole || recipient === currentEmail;

          if (!newAlert || !isForCurrentUser) return;

          setAlerts((prev) => {
            if (prev.some((alert) => alert.id === newAlert.id)) return prev;
            return [newAlert, ...prev].slice(0, 5);
          });

          if (!newAlert.leido) {
            setUnreadCount((count) => count + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getAlertIcon = (nivel: string) => {
    switch (nivel) {
      case 'rojo': return <AlertTriangle className="text-red-500" size={16} />;
      case 'amarillo': return <Info className="text-amber-500" size={16} />;
      case 'verde': return <CheckCircle2 className="text-emerald-500" size={16} />;
      default: return <Bell size={16} />;
    }
  }

  // Prevent hydration mismatch by rendering a simple button shell until mounted
  if (!isMounted) {
    return (
      <Button variant="ghost" size="icon" className="relative text-slate-500">
        <Bell size={20} />
      </Button>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm dark:border-slate-900">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-xl border border-border" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50/50 dark:bg-slate-900/70 rounded-t-lg">
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
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
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground italic">Buscando alertas...</p>
            </div>
          ) : alerts && alerts.length > 0 ? (
            <div className="flex flex-col">
              {alerts.map((alert) => (
                <Link 
                  key={alert.id} 
                  href={user?.role === 'docente' ? `/alerts` : `/students/${alert.alumno_id || alert.alumnoId}`}
                  className={cn(
                    "flex gap-3 p-4 border-b hover:bg-slate-50 dark:hover:bg-white/5 transition-colors last:border-0",
                    !alert.leido && "bg-primary/5"
                  )}
                >
                  <div className="mt-1 shrink-0">
                    {getAlertIcon(alert.nivel)}
                  </div>
                  <div className="space-y-1 overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{alert.alumno_nombre || alert.alumnoNombre}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {alert.mensaje}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {format(new Date(alert.fecha), "p", { locale: es })}
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
        <div className="p-2 bg-slate-50 dark:bg-slate-900/70 rounded-b-lg border-t">
          <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 dark:text-slate-300 hover:text-primary" asChild>
            <Link href="/alerts">
              Panel de control de alertas <ArrowRight size={12} className="ml-1" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
