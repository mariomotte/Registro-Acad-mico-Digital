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
  CalendarCheck,
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

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const { user } = useSupabaseAuth()
  const router = useRouter()

  const menuItems = [
    { name: "Panel de Control", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Alumnos", icon: Users, path: "/students" },
    { name: "Incidencias", icon: ClipboardList, path: "/incidents" },
  ]



  menuItems.push({ name: "Alertas", icon: Bell, path: "/alerts" });

  // Agregar reportes si es admin o director
  if (user?.role === 'admin' || user?.role === 'director') {
    menuItems.push({ name: "Reportes", icon: BarChart3, path: "/dashboard/reportes" });
  }

  // Agregar roles y accesos si es admin o director
  if (user?.role === 'admin' || user?.role === 'director') {
    menuItems.push({ name: "Accesos y Roles", icon: ShieldCheck, path: "/users" });
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-6">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-transparent">
            <Image 
              src="/logo.png" 
              alt="Logo A.G.G" 
              width={48} 
              height={48} 
              className="object-contain"
            />
          </div>
          {state === "expanded" && (
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-sidebar-foreground leading-tight">EduControl</span>
              <span className="text-xs font-medium text-sidebar-foreground/60">.A.G.G</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-3 gap-2">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton 
                asChild 
                isActive={pathname === item.path}
                tooltip={item.name}
                className="hover:bg-sidebar-accent transition-colors duration-200 py-6"
              >
                <Link href={item.path} className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-4" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              className="py-6 hover:bg-destructive/10 hover:text-destructive"
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
