"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Bell, 
  LogOut,
  ShieldCheck,
  BarChart3
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const { user } = useSupabaseAuth()
  const router = useRouter()

  const menuItems = [
    { name: "Panel de Control", icon: LayoutDashboard, path: "/dashboard", tone: "slate" },
    { name: user?.role === 'docente' ? "Mis alumnos" : "Alumnos", icon: Users, path: "/students", tone: "teal" },
    { name: "Incidencias", icon: ClipboardList, path: "/incidents", tone: "rose" },
  ]

  if (user?.role !== 'docente') {
    menuItems.push({ name: "Seguimiento Prioritario", icon: Bell, path: "/alerts", tone: "amber" });
  }

  // Agregar reportes si es admin, director o subdirector
  if (user?.role === 'admin' || user?.role === 'director' || user?.role === 'subdirector') {
    menuItems.push({ name: "Informes y Estadisticas", icon: BarChart3, path: "/dashboard/reportes", tone: "indigo" });
  }

  // Agregar roles y accesos si es admin, director o subdirector
  if (user?.role === 'admin' || user?.role === 'director' || user?.role === 'subdirector') {
    menuItems.push({ name: "Accesos y Roles", icon: ShieldCheck, path: "/users", tone: "violet" });
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const getToneClasses = (tone: string, isActive: boolean) => {
    const tones: Record<string, string> = {
      slate: isActive ? "bg-white/12 text-white shadow-sm ring-1 ring-white/10" : "text-blue-50/88 hover:bg-white/8 hover:text-white",
      teal: isActive ? "bg-cyan-400/16 text-white shadow-sm ring-1 ring-cyan-300/20" : "text-blue-50/88 hover:bg-cyan-400/10 hover:text-white",
      rose: isActive ? "bg-rose-400/16 text-white shadow-sm ring-1 ring-rose-300/20" : "text-blue-50/88 hover:bg-rose-400/10 hover:text-white",
      amber: isActive ? "bg-amber-300/18 text-white shadow-sm ring-1 ring-amber-200/25" : "text-blue-50/88 hover:bg-amber-300/10 hover:text-white",
      indigo: isActive ? "bg-sky-400/16 text-white shadow-sm ring-1 ring-sky-300/20" : "text-blue-50/88 hover:bg-sky-400/10 hover:text-white",
      violet: isActive ? "bg-violet-400/16 text-white shadow-sm ring-1 ring-violet-300/20" : "text-blue-50/88 hover:bg-violet-400/10 hover:text-white",
    }
    return tones[tone] || tones.slate
  }

  const getIconToneClasses = (tone: string, isActive: boolean) => {
    const tones: Record<string, string> = {
      slate: isActive ? "bg-white text-slate-900" : "bg-white/10 text-blue-100",
      teal: isActive ? "bg-cyan-300 text-slate-950" : "bg-cyan-300/16 text-cyan-100",
      rose: isActive ? "bg-rose-300 text-slate-950" : "bg-rose-300/16 text-rose-100",
      amber: isActive ? "bg-amber-300 text-slate-950" : "bg-amber-300/18 text-amber-100",
      indigo: isActive ? "bg-sky-300 text-slate-950" : "bg-sky-300/16 text-sky-100",
      violet: isActive ? "bg-violet-300 text-slate-950" : "bg-violet-300/16 text-violet-100",
    }
    return tones[tone] || tones.slate
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10 shadow-2xl shadow-slate-950/20">
      <SidebarHeader className="py-6">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 p-1.5 shadow-sm ring-1 ring-white/15">
            <Image 
              src="/logo.png" 
              alt="Logo A.G.G" 
              width={52} 
              height={52} 
              className="object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.25)]"
            />
          </div>
          {state === "expanded" && (
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white leading-tight">EduControl</span>
              <span className="text-xs font-semibold text-sky-200/85">.A.G.G</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-3 gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path
            return (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton 
                asChild 
                isActive={isActive}
                tooltip={item.name}
                className={cn("relative py-6 transition-colors duration-200", getToneClasses(item.tone, isActive))}
              >
                <Link href={item.path} className="flex items-center gap-3">
                  <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors", getIconToneClasses(item.tone, isActive))}>
                    <item.icon size={16} />
                  </span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )})}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-4 bg-white/12" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="py-6 bg-white/8 text-red-100 hover:bg-red-500 hover:text-white ring-1 ring-white/8"
              onClick={handleSignOut}
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
