import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  UserPlus, 
  Trash2, 
  Loader2, 
  Mail, 
  Clock, 
  ShieldCheck,
  Ban
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import toast from "react-hot-toast";

export default function AdminPanel() {
  const { 
    userRegistry, 
    isLoadingRegistry, 
    loadUserRegistry, 
    updateUserStatus, 
    addUserManual, 
    removeUserRegistry,
    currentEmail 
  } = useAuthStore();

  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUserRegistry();
  }, [loadUserRegistry]);

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      toast.error("Por favor ingresa un correo electrónico.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error("Correo electrónico no válido.");
      return;
    }

    setSubmitting(true);
    await addUserManual(newEmail.trim().toLowerCase(), newRole);
    setNewEmail("");
    setNewRole("user");
    setSubmitting(false);
  };

  const handleStatusChange = async (email, newStatus) => {
    if (email.toLowerCase() === currentEmail.toLowerCase()) {
      toast.error("No puedes suspender o bloquear tu propia cuenta.");
      return;
    }
    await updateUserStatus(email, newStatus);
  };

  const handleDeleteUser = async (email) => {
    if (email.toLowerCase() === currentEmail.toLowerCase()) {
      toast.error("No puedes eliminar tu propio usuario de administrador.");
      return;
    }
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${email} del registro de usuarios?`)) {
      await removeUserRegistry(email);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString || isoString === "Nunca") return "Nunca";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary shrink-0" />
            Panel de Administración
          </h1>
          <p className="text-muted-foreground mt-1 text-md">
            Supervisión, registro y control de acceso de usuarios a la plataforma RAHU.
          </p>
        </div>
        <div className="shrink-0 bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-inner">
          <Users className="w-4 h-4" />
          <span>{userRegistry.length} Usuarios Registrados</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel Izquierdo: Registrar Usuario */}
        <div className="lg:col-span-1">
          <Card className="border-primary/10 shadow-lg sticky top-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Registrar Nuevo Usuario
              </CardTitle>
              <CardDescription>
                Agrega un correo para pre-autorizar su acceso o asignarle un rol de administrador.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user-email" className="text-sm font-medium">Correo Electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="user-email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      disabled={submitting}
                      className="pl-10 h-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user-role" className="text-sm font-medium">Rol Asignado</Label>
                  <Select
                    id="user-role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    disabled={submitting}
                    className="h-10"
                  >
                    <option value="user">Usuario Estándar</option>
                    <option value="admin">Administrador Principal</option>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 font-medium mt-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registrando…
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Registrar Usuario
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Panel Derecho: Lista de Usuarios */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Lista de Usuarios y Estados</CardTitle>
                <CardDescription>
                  Verifica el rol, el último acceso y cambia el estado de acceso de cada usuario.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingRegistry ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm">Cargando registro de usuarios...</p>
                </div>
              ) : userRegistry.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground space-y-2">
                  <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="font-medium">No hay usuarios en el registro.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="border-0 shadow-none rounded-none">
                    <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                      <TableRow>
                        <TableHead className="font-semibold">Usuario</TableHead>
                        <TableHead className="font-semibold">Rol</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Último Acceso</TableHead>
                        <TableHead className="text-right font-semibold pr-6">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userRegistry.map((user) => {
                        const isSelf = user.email.toLowerCase() === currentEmail.toLowerCase();
                        
                        return (
                          <TableRow key={user.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                            <TableCell className="font-medium max-w-[200px] truncate pl-6">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                                <span title={user.email}>{user.email}</span>
                                {isSelf && (
                                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 rounded-md font-semibold font-sans">
                                    Tú
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={user.role === "admin" ? "default" : "secondary"}
                                className={user.role === "admin" ? "bg-indigo-600 text-white dark:bg-indigo-900/50 dark:text-indigo-300" : ""}
                              >
                                {user.role === "admin" ? "Admin" : "Usuario"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  user.status === "active" 
                                    ? "success" 
                                    : user.status === "suspended" 
                                    ? "warning" 
                                    : "destructive"
                                }
                              >
                                {user.status === "active" 
                                  ? "Activo" 
                                  : user.status === "suspended" 
                                  ? "Suspendido" 
                                  : "Bloqueado"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {formatDate(user.lastActive)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <div className="flex items-center justify-end gap-1.5">
                                {user.status !== "active" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(user.email, "active")}
                                    className="h-8 text-xs border-green-200 text-green-700 bg-green-500/5 hover:bg-green-500/10 hover:text-green-800 dark:border-green-900/30 dark:text-green-400 dark:bg-green-500/10 dark:hover:bg-green-500/20"
                                    disabled={isSelf}
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                    Activar
                                  </Button>
                                )}
                                
                                {user.status === "active" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStatusChange(user.email, "suspended")}
                                      className="h-8 text-xs border-amber-200 text-amber-700 bg-amber-500/5 hover:bg-amber-500/10 hover:text-amber-800 dark:border-amber-900/30 dark:text-amber-400 dark:bg-amber-500/10 dark:hover:bg-amber-500/20"
                                      disabled={isSelf}
                                    >
                                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                      Suspender
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleStatusChange(user.email, "blocked")}
                                      className="h-8 text-xs border-red-200 text-red-700 bg-red-500/5 hover:bg-red-500/10 hover:text-red-800 dark:border-red-900/30 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                                      disabled={isSelf}
                                    >
                                      <Ban className="w-3.5 h-3.5 mr-1" />
                                      Bloquear
                                    </Button>
                                  </>
                                )}

                                {user.status === "suspended" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(user.email, "blocked")}
                                    className="h-8 text-xs border-red-200 text-red-700 bg-red-500/5 hover:bg-red-500/10 hover:text-red-800 dark:border-red-900/30 dark:text-red-400 dark:bg-red-500/10 dark:hover:bg-red-500/20"
                                    disabled={isSelf}
                                  >
                                    <Ban className="w-3.5 h-3.5 mr-1" />
                                    Bloquear
                                  </Button>
                                )}

                                {user.status === "blocked" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(user.email, "suspended")}
                                    className="h-8 text-xs border-amber-200 text-amber-700 bg-amber-500/5 hover:bg-amber-500/10 hover:text-amber-800 dark:border-amber-900/30 dark:text-amber-400 dark:bg-amber-500/10 dark:hover:bg-amber-500/20"
                                    disabled={isSelf}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                    Suspender
                                  </Button>
                                )}

                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteUser(user.email)}
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                                  disabled={isSelf}
                                  title="Eliminar usuario"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Nota Informativa */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border rounded-xl text-xs text-muted-foreground flex gap-2">
        <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">Políticas de Acceso y Control de Sesión</p>
          <p>
            Al cambiar el estado de un usuario a <strong>Suspendido</strong> o <strong>Bloqueado</strong>, se impedirá inmediatamente cualquier nueva solicitud de código OTP para ese correo.
          </p>
          <p>
            Si el usuario ya cuenta con una sesión abierta, los mecanismos de seguridad de RAHU detectarán el cambio de estado en un plazo máximo de 60 segundos durante su actividad habitual, forzando el cierre inmediato de su sesión.
          </p>
        </div>
      </div>
    </div>
  );
}
