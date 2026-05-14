"use client"

import { useState, useEffect } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, ShieldAlert, ShieldCheck, Mail } from "lucide-react"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { Usuario, UserRole } from "@/types"

export default function UsersManagementPage() {
  const { user, loading: isUserLoading } = useSupabaseAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<Usuario[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(true)

  useEffect(() => {
    let mounted = true;
    async function loadUsers() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('last_name', { ascending: true });
        
        if (error) throw error;
        
        if (data && mounted) {
          setUsers(data.map((u: any) => ({
            id: u.id,
            email: u.email,
            firstName: u.first_name,
            lastName: u.last_name,
            role: u.role,
            estado: u.estado,
            createdAt: u.created_at
          })));
        }
      } catch (err) {
        console.error("Error fetching users", err);
      } finally {
        if (mounted) setIsUsersLoading(false);
      }
    }
    
    if (!isUserLoading) {
      loadUsers();
    }
    
    return () => { mounted = false; };
  }, [user, isUserLoading]);

  const filteredUsers = users.filter((u) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    return fullName.includes(searchLower) || u.email.toLowerCase().includes(searchLower);
  })

  const canManageUsers = user?.role === 'Superusuario' || user?.role === 'Director';

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as UserRole } : u));
      
      toast({
        title: "Rol actualizado",
        description: `Se ha cambiado el rol exitosamente.`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el rol.",
        variant: "destructive"
      });
    }
  }

  const handleStatusToggle = async (userId: string, currentStatus: string | undefined) => {
    const newStatus = currentStatus === 'Inactivo' ? 'Activo' : 'Inactivo';
    try {
      const { error } = await supabase
        .from('users')
        .update({ estado: newStatus })
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, estado: newStatus as any } : u));
      
      toast({
        title: "Estado actualizado",
        description: `El usuario ahora está ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario.",
        variant: "destructive"
      });
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando gestor de usuarios...</p>
        </div>
      </div>
    )
  }

  if (!canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">Acceso Denegado</h2>
        <p className="text-muted-foreground max-w-md">
          No tienes los permisos necesarios para acceder a la gestión de accesos y roles.
          Esta sección está restringida para Superusuarios y Directores.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-headline flex items-center gap-2">
          <ShieldCheck className="text-primary" />
          Accesos y Roles
        </h2>
        <p className="text-muted-foreground">
          Gestiona los niveles de acceso y los roles de los usuarios de la plataforma.
        </p>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Buscar por nombre o correo electrónico..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        {isUsersLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead>Usuario</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Rol del Sistema</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Bloquear Acceso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell>
                      <div className="font-medium text-slate-900">
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">ID: {u.id.substring(0, 8)}...</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} className="text-muted-foreground" />
                        {u.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        disabled={u.id === user?.id} // Evitar cambiarse a sí mismo
                        value={u.role} 
                        onValueChange={(val) => handleRoleChange(u.id, val)}
                      >
                        <SelectTrigger className="w-[180px] h-8">
                          <SelectValue placeholder="Seleccionar Rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Superusuario">Superusuario</SelectItem>
                          <SelectItem value="Director">Director</SelectItem>
                          <SelectItem value="Subdirector">Subdirector</SelectItem>
                          <SelectItem value="Docente">Docente</SelectItem>
                          <SelectItem value="Auxiliar">Auxiliar</SelectItem>
                          <SelectItem value="Psicólogo">Psicólogo</SelectItem>
                          <SelectItem value="Usuario">Usuario</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.estado === 'Inactivo' ? 'secondary' : 'default'} className={
                        u.estado === 'Inactivo' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }>
                        {u.estado === 'Inactivo' ? 'Inactivo' : 'Activo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch 
                          disabled={u.id === user?.id} // Evitar bloquearse a sí mismo
                          checked={u.estado !== 'Inactivo'} 
                          onCheckedChange={() => handleStatusToggle(u.id, u.estado)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <ShieldCheck className="h-8 w-8 text-slate-200 mb-2" />
                      <p>No se encontraron usuarios.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
