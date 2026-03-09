"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { UserNav } from "@/components/layout/UserNav"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1 bg-background">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 px-6 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <h1 className="text-xl font-bold font-headline text-slate-800">Sistema Escolar</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative text-slate-500">
                <Bell size={20} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent animate-pulse" />
              </Button>
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