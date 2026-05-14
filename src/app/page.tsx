
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
        // Redirigir al nuevo módulo de Dashboard, no a incidencias
        router.push("/dashboard")
      } else {
        router.push("/login")
      }
    }
  }, [user, isUserLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
