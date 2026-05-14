"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Info } from "lucide-react"
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
      
      toast({
        description: (
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-bold text-lg">✔</span>
            <span className="text-slate-800 font-medium">Ingreso correctamente.</span>
          </div>
        ),
        duration: 3000,
      })
      
      router.push("/")
    } catch (error: any) {
      let message = "Ocurrió un error inesperado."
      
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-24 w-24 items-center justify-center">
              <Image 
                src="/logo.png" 
                alt="Logo Institucional" 
                width={96} 
                height={96} 
                className="object-contain drop-shadow-md"
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-800">
            Iniciar Sesión
          </CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuth}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="nombre@colegio.edu" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-primary" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
            
            <Alert className="bg-slate-50 border-slate-200 py-3 mt-4">
              <Info className="h-4 w-4 text-slate-500" />
              <AlertDescription className="text-xs text-slate-600 ml-2">
                El acceso a la plataforma es gestionado internamente. Si no tiene una cuenta o ha olvidado sus credenciales, comuníquese con el panel administrativo.
              </AlertDescription>
            </Alert>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
