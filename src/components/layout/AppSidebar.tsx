"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Bell, 
  LogOut,
  GraduationCap
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

const menuItems = [
  { name: "Panel de Control", icon: LayoutDashboard, path: "/" },
  { name: "Alumnos", icon: Users, path: "/students" },
  { name: "Incidencias", icon: ClipboardList, path: "/incidents" },
  { name: "Alertas", icon: Bell, path: "/alerts" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-6">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white">
            <GraduationCap size={24} />
          </div>
          {state === "expanded" && (
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white leading-tight">EduControl</span>
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
                isActive={pathname === item.path || (item.path === "/" && pathname === "/incidents")}
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
            <SidebarMenuButton className="py-6 hover:bg-destructive/10 hover:text-destructive">
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
