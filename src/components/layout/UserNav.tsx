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
import { MOCK_USER } from "@/lib/mock-data"

export function UserNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-primary/10">
          <Avatar className="h-10 w-10">
            <AvatarImage src={`https://picsum.photos/seed/user1/200`} alt={MOCK_USER.nombre} />
            <AvatarFallback>{MOCK_USER.nombre.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{MOCK_USER.nombre}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {MOCK_USER.correo}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer">
            Perfil de Usuario
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            Rol: <span className="ml-2 font-bold text-primary">{MOCK_USER.rol}</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer">
            Configuración
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}