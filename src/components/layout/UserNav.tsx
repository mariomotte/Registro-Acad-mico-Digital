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
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getUserAvatar } from "@/lib/avatar"
import { LogOut } from "lucide-react"

function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin': return 'Superusuario';
    case 'director': return 'Director';
    case 'subdirector': return 'Subdirector';
    case 'docente': return 'Docente';
    case 'auxiliar': return 'Auxiliar';
    default: return role;
  }
}

export function UserNav() {
  const { user } = useSupabaseAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-primary/10">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getUserAvatar(user)} alt={`${user.firstName} ${user.lastName}`} />
            <AvatarFallback>{(user.firstName || "U").charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{`${user.firstName} ${user.lastName}`.trim() || "Usuario"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile" className="cursor-pointer w-full">
              Perfil de Usuario
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-default">
            Rol: <span className="ml-2 font-bold text-primary">{getRoleLabel(user.role) || "Cargando..."}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-200 focus:bg-red-600 focus:text-white" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
