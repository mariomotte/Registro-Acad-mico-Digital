"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { UserNav } from "@/components/layout/UserNav"
import { NotificationsNav } from "@/components/layout/NotificationsNav"

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
