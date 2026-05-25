"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Info, LogIn, Mail, Lock, ShieldCheck, GraduationCap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const router = useRouter()
  const { toast } = useToast()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Sign In via Supabase Auth
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('INVALID_CREDENTIALS')
        }
        throw error
      }

      // 2. Check if the user is marked as inactive in users profile table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('estado')
        .eq('email', email)
        .single()

      if (profile && profile.estado === 'Inactivo') {
        // Log out immediately if user is disabled
        await supabase.auth.signOut()
        throw new Error('Su cuenta ha sido bloqueada/desactivada por el administrador.')
      }

      toast({
        description: (
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-bold text-lg">✔</span>
            <span className="text-slate-800 font-medium">Ingresó correctamente.</span>
          </div>
        ),
        duration: 3000,
      })

      router.push("/")
    } catch (error: any) {
      let message = error.message || "Ocurrió un error inesperado."

      if (error.message === 'INVALID_CREDENTIALS') {
        message = "Credenciales incorrectas. Verifique su correo o contraseña."
      }

      toast({
        description: (
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-bold text-lg">✖</span>
            <span className="text-slate-800 font-medium">{message}</span>
          </div>
        ),
        duration: 4000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-950 font-body relative overflow-hidden">
      {/* Abstract background ambient lights (glows) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/15 rounded-full blur-[130px] pointer-events-none" />

      {/* LEFT COLUMN: Visual Panel (Branding) */}
      <div className="hidden md:flex md:w-1/2 lg:w-3/5 flex-col justify-center items-center p-12 lg:p-16 relative bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-r border-slate-800/50">
        {/* Subtle mesh pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Centered branding wrapper */}
        <div className="max-w-md relative z-10 flex flex-col items-center justify-center text-center space-y-8">
          {/* Centered, Enlarged Logo without bounding box */}
          <div className="relative">
            <Image
              src="/logo.png"
              alt="Logo Colegio"
              width={160}
              height={160}
              className="object-contain"
              priority
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-black text-slate-100 leading-tight tracking-tight">
              Control de incidencias<span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> escolares </span>
            </h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              EduControl A.G.G
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile view branding header */}
          <div className="flex flex-col items-center text-center space-y-4 md:hidden">
            <Image
              src="/logo.png"
              alt="Logo Colegio"
              width={90}
              height={90}
              className="object-contain"
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">EduControl A.G.G</h1>
              <p className="text-xs text-slate-400">Plataforma de Control e Incidencias Escolares</p>
            </div>
          </div>

          {/* Form container card */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl rounded-2xl p-8 space-y-6">

            {/* Desktop form header */}
            <div className="hidden md:block space-y-1">
              <h3 className="text-2xl font-extrabold text-slate-100 tracking-tight">Iniciar Sesión</h3>
              <p className="text-sm text-slate-400 font-medium">Ingresa tus credenciales para acceder a la plataforma</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">

              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Correo Electrónico
                </Label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ejemplo@colegio.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 py-5 bg-slate-950/80 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg transition-colors"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Contraseña
                  </Label>
                </div>
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-4 w-4 text-slate-500" aria-hidden="true" />
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 py-5 bg-slate-950/80 border-slate-800 text-slate-100 placeholder-slate-500 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg transition-colors"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-6 rounded-lg flex gap-2 items-center justify-center transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-lg shadow-primary/20"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4 text-white" />
                    <span>Entrar al Sistema</span>
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="text-center md:hidden text-xs text-slate-600 font-medium">
            © {new Date().getFullYear()} EduControl A.G.G. Todos los derechos reservados.
          </div>
        </div>
      </div>
    </div>
  )
}
