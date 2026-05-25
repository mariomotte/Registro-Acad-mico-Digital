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
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, ShieldAlert, ShieldCheck, Mail, UserPlus, Key, Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import { useSupabaseAuth } from "@/lib/supabase-hooks"
import { supabase } from "@/lib/supabase"
import { Usuario, UserRole } from "@/types"
import { logAudit } from "@/lib/audit"
import { createClient } from "@supabase/supabase-js"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

// Mapeadores para homologar roles de Base de Datos y Frontend
function mapDbRoleToFrontend(dbRole: string): UserRole {
  switch (dbRole) {
    case 'Superusuario': return 'admin';
    case 'Director': return 'director';
    case 'Subdirector': return 'subdirector';
    case 'Docente': return 'docente';
    case 'Auxiliar': return 'auxiliar';
    case 'Psicólogo': return 'psicologo';
    case 'admin': return 'admin';
    case 'director': return 'director';
    case 'subdirector': return 'subdirector';
    case 'docente': return 'docente';
    case 'auxiliar': return 'auxiliar';
    case 'psicologo': return 'psicologo';
    default: return 'docente';
  }
}

function mapFrontendRoleToDb(feRole: UserRole): string {
  switch (feRole) {
    case 'admin': return 'Superusuario';
    case 'director': return 'Director';
    case 'subdirector': return 'Subdirector';
    case 'docente': return 'Docente';
    case 'auxiliar': return 'Auxiliar';
    case 'psicologo': return 'Psicólogo';
    default: return 'Docente';
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin': return 'Administrador';
    case 'director': return 'Director';
    case 'subdirector': return 'Subdirector';
    case 'docente': return 'Docente';
    case 'auxiliar': return 'Auxiliar';
    case 'psicologo': return 'Psicólogo';
    default: return role;
  }
}

export default function UsersManagementPage() {
  const { user, loading: isUserLoading } = useSupabaseAuth()
  const { toast } = useToast()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<Usuario[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(true)

  // Estados para creación de usuario
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newFirstName, setNewFirstName] = useState("")
  const [newLastName, setNewLastName] = useState("")
  const [newRole, setNewRole] = useState<UserRole>("docente")
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Estados para edición de usuario
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [editRole, setEditRole] = useState<UserRole>("docente")
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)

  // Estados para eliminación de usuario
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<Usuario | null>(null)
  const [isDeletingUser, setIsDeletingUser] = useState(false)

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role, estado, created_at')
        .order('last_name', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        setUsers(data.map((u: any) => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          role: mapDbRoleToFrontend(u.role),
          estado: u.estado,
          createdAt: u.created_at
        })));
      }
    } catch (err) {
      console.error("Error fetching users", err);
    } finally {
      setIsUsersLoading(false);
    }
  }

  useEffect(() => {
    if (!isUserLoading && user) {
      loadUsers();
    }
  }, [user, isUserLoading]);

  const filteredUsers = users.filter((u) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
    return fullName.includes(searchLower) || u.email.toLowerCase().includes(searchLower);
  })

  // Los roles válidos en BD son 'admin' y 'director'
  const canManageUsers = user?.role === 'admin' || user?.role === 'director';

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const dbRole = mapFrontendRoleToDb(newRole as UserRole);
      const { error } = await supabase
        .from('users')
        .update({ role: dbRole })
        .eq('id', userId);
        
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as UserRole } : u));
      
      // Auditoria
      await logAudit({
        userId: user?.id,
        userEmail: user?.email,
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        modulo: 'ACCESOS',
        accion: 'CAMBIAR_ROL',
        registroId: userId,
        descripcion: `Actualizó el rol del usuario ID: ${userId} a '${getRoleLabel(newRole)}'.`
      })

      toast({
        title: "Rol actualizado",
        description: `Se ha cambiado el rol a ${getRoleLabel(newRole)} exitosamente.`,
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
      
      // Auditoria
      await logAudit({
        userId: user?.id,
        userEmail: user?.email,
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        modulo: 'ACCESOS',
        accion: 'TOGGLE_ESTADO',
        registroId: userId,
        descripcion: `${newStatus === 'Activo' ? 'Activó' : 'Desactivó'} el acceso del usuario ID: ${userId}.`
      })

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

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail || !newPassword || !newFirstName || !newLastName) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos.",
        variant: "destructive"
      })
      return
    }
    if (newPassword.length < 6) {
      toast({
        title: "Contraseña corta",
        description: "La contraseña debe tener al menos 6 caracteres.",
        variant: "destructive"
      })
      return
    }

    setIsCreatingUser(true)

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_new_operator', {
        p_email: newEmail,
        p_password: newPassword,
        p_first_name: newFirstName,
        p_last_name: newLastName,
        p_role: mapFrontendRoleToDb(newRole)
      })

      if (rpcError) throw rpcError

      const res = rpcData as any
      if (res && !res.success) {
        throw new Error(res.error || "Ocurrió un error al registrar en la base de datos.")
      }

      const createdUserId = res?.userId

      if (createdUserId) {
        toast({
          title: "Operador Creado",
          description: `El usuario ${newFirstName} ${newLastName} ha sido registrado correctamente.`
        })

        // Registro de Auditoría
        await logAudit({
          userId: user?.id,
          userEmail: user?.email,
          userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
          modulo: 'ACCESOS',
          accion: 'CREAR_USUARIO',
          registroId: createdUserId,
          descripcion: `Creó el usuario ${newFirstName} ${newLastName} (${newEmail}) con rol ${getRoleLabel(newRole)}.`
        })

        // Reiniciar variables
        setNewEmail("")
        setNewPassword("")
        setNewFirstName("")
        setNewLastName("")
        setNewRole("docente")
        setShowNewPassword(false)
        setIsDialogOpen(false)

        // Recargar listado
        loadUsers()
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Error al registrar",
        description: err.message || "Ocurrió un error al registrar al usuario.",
        variant: "destructive"
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  const handleOpenEditDialog = (u: Usuario) => {
    setEditingUser(u)
    setEditFirstName(u.firstName || "")
    setEditLastName(u.lastName || "")
    setEditEmail(u.email || "")
    setEditRole(u.role)
    setEditPassword("") // Dejar vacío para no cambiar
    setShowEditPassword(false)
    setIsEditOpen(true)
  }

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    if (!editEmail || !editFirstName || !editLastName) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete los campos obligatorios.",
        variant: "destructive"
      })
      return
    }

    setIsUpdatingUser(true)

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('update_operator', {
        p_user_id: editingUser.id,
        p_email: editEmail,
        p_first_name: editFirstName,
        p_last_name: editLastName,
        p_role: mapFrontendRoleToDb(editRole),
        p_password: editPassword || null
      })

      if (rpcError) throw rpcError

      const res = rpcData as any
      if (res && !res.success) {
        throw new Error(res.error || "Ocurrió un error al actualizar en la base de datos.")
      }

      toast({
        title: "Operador Actualizado",
        description: `El usuario ha sido actualizado correctamente.`
      })

      // Registro de Auditoría
      await logAudit({
        userId: user?.id,
        userEmail: user?.email,
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        modulo: 'ACCESOS',
        accion: 'EDITAR_USUARIO',
        registroId: editingUser.id,
        descripcion: `Editó los datos del usuario ${editFirstName} ${editLastName} (${editEmail}).`
      })

      setIsEditOpen(false)
      loadUsers()
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Error al actualizar",
        description: err.message || "Ocurrió un error al actualizar al usuario.",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingUser(false)
    }
  }

  const handleOpenDeleteDialog = (u: Usuario) => {
    setDeletingUser(u)
    setIsDeleteOpen(true)
  }

  const handleDeleteUserConfirm = async () => {
    if (!deletingUser) return

    setIsDeletingUser(true)

    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('delete_operator', {
        p_user_id: deletingUser.id
      })

      if (rpcError) throw rpcError

      const res = rpcData as any
      if (res && !res.success) {
        throw new Error(res.error || "Ocurrió un error al eliminar de la base de datos.")
      }

      toast({
        title: "Operador Eliminado",
        description: `El usuario ha sido eliminado correctamente.`
      })

      // Registro de Auditoría
      await logAudit({
        userId: user?.id,
        userEmail: user?.email,
        userName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        modulo: 'ACCESOS',
        accion: 'ELIMINAR_USUARIO',
        registroId: deletingUser.id,
        descripcion: `Eliminó la cuenta del usuario ${deletingUser.firstName} ${deletingUser.lastName} (${deletingUser.email}).`
      })

      setIsDeleteOpen(false)
      loadUsers()
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Error al eliminar",
        description: err.message || "Ocurrió un error al eliminar al usuario.",
        variant: "destructive"
      })
    } finally {
      setIsDeletingUser(false)
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
        <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Acceso Denegado</h2>
        <p className="text-muted-foreground max-w-md">
          No tienes los permisos necesarios para acceder a la gestión de accesos y roles.
          Esta sección está restringida para Administradores y Directores.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 font-headline flex items-center gap-2">
            <ShieldCheck className="text-primary" />
            Accesos y Roles de Operadores
          </h2>
          <p className="text-muted-foreground">
            Crea cuentas de operadores y gestiona los niveles de acceso al sistema.
          </p>
        </div>

        {/* Modal de Crear Usuario */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary flex gap-2">
              <UserPlus size={16} />
              Registrar Operador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateUserSubmit}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="text-primary" />
                  Registrar Operador
                </DialogTitle>
                <DialogDescription>
                  Complete los datos de la cuenta. El usuario podrá iniciar sesión inmediatamente.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="firstName" className="text-right">Nombres</Label>
                  <Input 
                    id="firstName" 
                    placeholder="Ej. Carlos" 
                    className="col-span-3"
                    value={newFirstName} 
                    onChange={e => setNewFirstName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="lastName" className="text-right">Apellidos</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Ej. Mendoza" 
                    className="col-span-3"
                    value={newLastName} 
                    onChange={e => setNewLastName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Correo</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="carlos@colegio.edu" 
                    className="col-span-3"
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="pass" className="text-right">Contraseña</Label>
                  <div className="relative col-span-3">
                    <Input 
                      id="pass" 
                      type={showNewPassword ? "text" : "password"} 
                      placeholder="Mín. 6 caracteres" 
                      className="w-full pr-10"
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newrole" className="text-right">Rol</Label>
                  <Select value={newRole} onValueChange={(val) => setNewRole(val as UserRole)}>
                    <SelectTrigger id="newrole" className="col-span-3">
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="subdirector">Subdirector</SelectItem>
                      <SelectItem value="docente">Docente</SelectItem>
                      <SelectItem value="auxiliar">Auxiliar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreatingUser} className="bg-primary flex gap-2">
                  {isCreatingUser && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isCreatingUser ? "Guardando..." : "Crear Operador"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de Editar Usuario */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleEditUserSubmit}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pencil className="text-primary" size={20} />
                  Editar Operador
                </DialogTitle>
                <DialogDescription>
                  Modifique los datos del operador. Deje la contraseña en blanco si no desea cambiarla.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editFirstName" className="text-right">Nombres</Label>
                  <Input 
                    id="editFirstName" 
                    placeholder="Ej. Carlos" 
                    className="col-span-3"
                    value={editFirstName} 
                    onChange={e => setEditFirstName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editLastName" className="text-right">Apellidos</Label>
                  <Input 
                    id="editLastName" 
                    placeholder="Ej. Mendoza" 
                    className="col-span-3"
                    value={editLastName} 
                    onChange={e => setEditLastName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editEmail" className="text-right">Correo</Label>
                  <Input 
                    id="editEmail" 
                    type="email" 
                    placeholder="carlos@colegio.edu" 
                    className="col-span-3"
                    value={editEmail} 
                    onChange={e => setEditEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editPass" className="text-right">Contraseña</Label>
                  <div className="relative col-span-3">
                    <Input 
                      id="editPass" 
                      type={showEditPassword ? "text" : "password"} 
                      placeholder="Dejar vacío para no cambiar" 
                      className="w-full pr-10"
                      value={editPassword} 
                      onChange={e => setEditPassword(e.target.value)} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                    >
                      {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editrole" className="text-right">Rol</Label>
                  <Select value={editRole} onValueChange={(val) => setEditRole(val as UserRole)}>
                    <SelectTrigger id="editrole" className="col-span-3">
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="subdirector">Subdirector</SelectItem>
                      <SelectItem value="docente">Docente</SelectItem>
                      <SelectItem value="auxiliar">Auxiliar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isUpdatingUser} className="bg-primary flex gap-2">
                  {isUpdatingUser && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isUpdatingUser ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmar Eliminación */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 size={20} />
                Eliminar Operador
              </DialogTitle>
              <DialogDescription>
                ¿Está seguro de que desea eliminar la cuenta de <strong>{deletingUser?.firstName} {deletingUser?.lastName}</strong> ({deletingUser?.email})?
                <span className="block mt-2 text-destructive font-medium">Esta acción no se puede deshacer y eliminará permanentemente todos los datos vinculados.</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 gap-2 sm:gap-0">
              <Button variant="outline" type="button" onClick={() => setIsDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteUserConfirm} disabled={isDeletingUser} className="flex gap-2">
                {isDeletingUser && <Loader2 className="h-4 w-4 animate-spin" />}
                {isDeletingUser ? "Eliminando..." : "Confirmar Eliminación"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-lg shadow-sm border">
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

      <div className="rounded-lg border bg-card shadow-sm overflow-x-auto">
        {isUsersLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Usuario</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Rol del Sistema</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Habilitar Acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="font-semibold text-foreground">
                        {u.firstName} {u.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">ID: {u.id.substring(0, 8)}...</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="director">Director</SelectItem>
                          <SelectItem value="subdirector">Subdirector</SelectItem>
                          <SelectItem value="docente">Docente</SelectItem>
                          <SelectItem value="auxiliar">Auxiliar</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.estado === 'Inactivo' ? 'secondary' : 'default'} className={
                        u.estado === 'Inactivo' ? 'bg-red-100 text-red-700 hover:bg-red-200 border-none' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none'
                      }>
                        {u.estado === 'Inactivo' ? 'Bloqueado' : 'Activo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        disabled={u.id === user?.id} // Evitar bloquearse a sí mismo
                        checked={u.estado !== 'Inactivo'} 
                        onCheckedChange={() => handleStatusToggle(u.id, u.estado)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenEditDialog(u)}
                          disabled={u.id === user?.id}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Editar operador"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenDeleteDialog(u)}
                          disabled={u.id === user?.id}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Eliminar operador"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
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
