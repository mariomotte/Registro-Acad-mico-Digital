"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { UserNav } from "@/components/layout/UserNav"
import { NotificationsNav } from "@/components/layout/NotificationsNav"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  const { toast } = useToast();

  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.estado === 'Inactivo') {
      toast({
        title: "Acceso Bloqueado",
        description: "Tu cuenta ha sido desactivada. Contacta al administrador.",
        variant: "destructive"
      });
      supabase.auth.signOut().then(() => {
        router.push("/login");
      });
    }
  }, [user, router, toast]);

  // Protección de rutas para el rol Docente
  useEffect(() => {
    if (user?.role === 'Docente') {
      const isRestricted = 
        pathname.startsWith('/psychology') || 
        pathname.startsWith('/users') || 
        (pathname.startsWith('/students/') && pathname !== '/students');

      if (isRestricted) {
        toast({
          title: "Acceso Denegado",
          description: "No tienes permisos para acceder a este módulo.",
          variant: "destructive"
        });
        router.push("/dashboard");
      }
    }
  }, [user, pathname, router, toast]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Cargando tu sesión...</p>
        </div>
      </div>
    );
  }

  // Prevent rendering if inactive while signOut is happening
  if (user?.estado === 'Inactivo' || !user) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 bg-background">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 px-6 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-xl font-bold font-headline text-slate-800">EduControl.A.G.G</h1>
            </div>
            <div className="flex items-center gap-4">
              <NotificationsNav />
              <UserNav />
            </div>
          </header>
          <main className="p-6 lg:p-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
