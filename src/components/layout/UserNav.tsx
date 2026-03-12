"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser, useAuth, useDoc, useFirestore } from "@/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { doc } from "firebase/firestore"
import { useMemo } from "react"

export function UserNav() {
  const { user } = useUser()
  const auth = useAuth()
  const db = useFirestore()
  const router = useRouter()

  const userDocRef = useMemo(() => user ? doc(db, "users", user.uid) : null, [db, user])
  const { data: profile } = useDoc(userDocRef)

  const handleSignOut = async () => {
    await signOut(auth)
    router.push("/login")
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-primary/10">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://picsum.photos/seed/${user.uid}/200`} alt={user.displayName || ""} />
            <AvatarFallback>{(user.displayName || "U").charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{user.displayName || "Usuario"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer">
            Perfil de Usuario
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            Rol: <span className="ml-2 font-bold text-primary">{profile?.role || "Cargando..."}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            Configuración
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleSignOut}>
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
