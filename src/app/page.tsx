
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { Loader2 } from "lucide-react"

export default function Home() {
  const { user, loading: isUserLoading } = useSupabaseAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.replace("/dashboard")
      } else {
        router.replace("/login")
      }
    }
  }, [user, isUserLoading, router])

  // Fallback de seguridad: Si tarda más de 2 segundos en cargar, redirigir al login
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login")
    }, 2000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Iniciando sesión...</p>
      </div>
    </div>
  )
}
