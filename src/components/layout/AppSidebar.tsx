
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Bell, 
  LogOut,
  GraduationCap,
  Brain
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
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { signOut } from "firebase/auth"
import { doc } from "firebase/firestore"

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()
  const auth = useAuth()
  const { user } = useUser()
  const db = useFirestore()
  const router = useRouter()

  const userDocRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile } = useDoc(userDocRef)

  const menuItems = [
    { name: "Panel de Control", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Alumnos", icon: Users, path: "/students" },
    { name: "Incidencias", icon: ClipboardList, path: "/incidents" },
    { name: "Alertas", icon: Bell, path: "/alerts" },
  ]

  // Add psychology module if role is Psicólogo, Director or Admin
  const canSeePsychology = profile?.role === 'Psicólogo' || profile?.role === 'Director' || profile?.role === 'Administrador';
  if (canSeePsychology) {
    menuItems.push({ name: "Psicopedagógico", icon: Brain, path: "/psychology" });
  }

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-6">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <GraduationCap size={24} />
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
