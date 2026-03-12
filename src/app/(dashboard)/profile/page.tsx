"use client"

import { useState, useEffect } from "react"
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase"
import { doc, serverTimestamp } from "firebase/firestore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Shield, Calendar, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function ProfilePage() {
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  const { toast } = useToast()

  const userDocRef = useMemoFirebase(() => user ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: ""
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || ""
      })
    }
  }, [profile])

  const handleSave = () => {
    if (!user || !userDocRef) return

    setIsSaving(true)
    
    updateDocumentNonBlocking(userDocRef, {
      firstName: formData.firstName,
      lastName: formData.lastName,
      updatedAt: serverTimestamp()
    })

    // Simulated delay for UI feedback
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados correctamente."
      })
    }, 800)
  }

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 font-headline">Mi Perfil</h2>
        <p className="text-muted-foreground">Gestiona tu información personal y configuración de cuenta.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1 border-none shadow-sm">
          <CardContent className="pt-8 text-center space-y-4">
            <Avatar className="h-32 w-32 mx-auto border-4 border-primary/10">
              <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/400`} />
              <AvatarFallback className="text-4xl">{(profile?.firstName?.[0] || "U")}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{profile?.firstName} {profile?.lastName}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-4 py-1">
              {profile?.role}
            </Badge>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Actualiza tus datos de contacto y nombre para el sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="firstName" 
                    className="pl-10"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="lastName" 
                    className="pl-10"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Correo Electrónico (Solo lectura)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input value={user?.email || ""} readOnly className="pl-10 bg-slate-50 cursor-not-allowed" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Rol Asignado</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input value={profile?.role || ""} readOnly className="pl-10 bg-slate-50 cursor-not-allowed" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Miembro desde</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={profile?.createdAt ? format(new Date(profile.createdAt.toDate?.() || profile.createdAt), "dd 'de' MMMM, yyyy", { locale: es }) : "N/A"} 
                    readOnly 
                    className="pl-10 bg-slate-50 cursor-not-allowed" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-slate-50/50 flex justify-end py-4">
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Guardar Cambios
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
