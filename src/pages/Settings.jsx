import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useDocumentsStore } from "@/store/documentsStore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Lock, Clock, Download, Upload, Trash2, RefreshCcw, ShieldAlert, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Requerido"),
  newPassword: z.string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[0-9]/, "Debe contener al menos 1 número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos 1 carácter especial"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export default function Settings() {
  const { timeoutMinutes, setTimeoutMinutes } = useSettingsStore();
  const { updatePasswordData, login, encryptionKey, logout } = useAuthStore();
  const { documents, reEncryptAllData, importBackup, resetSystem, restoreDocument, deleteDocument } = useDocumentsStore();

  const [resetConfirm, setResetConfirm] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const { register, handleSubmit, reset: resetPasswordForm, formState: { errors } } = useForm({
    resolver: zodResolver(passwordSchema)
  });

  const onChangePassword = (data) => {
    // Verificamos contraseña actual
    const check = login(data.currentPassword);
    if (!check.success) {
      toast.error("Contraseña actual incorrecta");
      return;
    }

    // Actualizamos
    const newKey = updatePasswordData(data.newPassword);
    const success = reEncryptAllData(newKey);
    
    if (success) {
      toast.success("Contraseña cambiada exitosamente. Datos re-encriptados.");
      resetPasswordForm();
    } else {
      toast.error("Error al re-encriptar los datos.");
    }
  };

  const handleExportBackup = () => {
    // Exportamos encriptado directamente del localStorage
    const encryptedData = localStorage.getItem("dora-encrypted-docs");
    if (!encryptedData) {
      toast.error("No hay datos para exportar.");
      return;
    }
    
    const blob = new Blob([encryptedData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dora_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Copia de seguridad exportada");
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const success = importBackup(content, encryptionKey);
      if (success) {
        toast.success("Datos importados y restaurados correctamente");
      } else {
        toast.error("Fallo al importar. Asegúrate de que la copia pertenezca a esta misma contraseña maestra.");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input
  };

  const handleResetSystem = () => {
    if (resetConfirm === "RESTABLECER") {
      resetSystem();
      setIsResetDialogOpen(false);
      toast.success("Sistema restablecido");
      logout(); // Force login screen
    }
  };

  const deletedDocs = documents.filter(d => d.eliminado);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-serif tracking-tight">Configuración del Sistema</h2>
        <p className="text-muted-foreground mt-1">Gestiona la seguridad, respaldos y preferencias locales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Lock className="w-5 h-5 mr-2 text-primary" /> Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
              <div className="space-y-2">
                <Label>Contraseña Actual</Label>
                <Input type="password" {...register("currentPassword")} />
                {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Nueva Contraseña</Label>
                <Input type="password" {...register("newPassword")} />
                {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Confirmar Nueva Contraseña</Label>
                <Input type="password" {...register("confirmPassword")} />
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full">Actualizar Contraseña y Re-encriptar</Button>
            </form>

            <div className="mt-8 pt-6 border-t space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <Label>Tiempo de inactividad (cierre automático)</Label>
                </div>
                <Select 
                  value={timeoutMinutes} 
                  onChange={(e) => setTimeoutMinutes(Number(e.target.value))}
                  className="w-32"
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>60 minutos</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos y Respaldos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Download className="w-5 h-5 mr-2 text-primary" /> Respaldos y Datos
            </CardTitle>
            <CardDescription>
              Las copias de seguridad se exportan totalmente encriptadas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={handleExportBackup}>
                <Download className="w-4 h-4 mr-2" />
                Exportar Copia de Seguridad (.json encriptado)
              </Button>
              
              <div className="relative">
                <Input 
                  type="file" 
                  accept=".json" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  onChange={handleImportBackup}
                />
                <Button variant="outline" className="w-full justify-start pointer-events-none">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Copia de Seguridad
                </Button>
              </div>
            </div>

            <div className="pt-6 border-t">
              <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Restablecer Sistema (Borrar Todo)
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Peligro: Borrado Irreversible
                    </DialogTitle>
                    <DialogDescription>
                      Esta acción eliminará todos los documentos, la clave maestra y la configuración. No podrás recuperar los datos a menos que tengas un respaldo.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm font-medium">Escribe "RESTABLECER" para confirmar:</p>
                    <Input 
                      value={resetConfirm} 
                      onChange={(e) => setResetConfirm(e.target.value)}
                      placeholder="RESTABLECER"
                      className="border-destructive focus-visible:ring-destructive"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>Cancelar</Button>
                    <Button variant="destructive" disabled={resetConfirm !== "RESTABLECER"} onClick={handleResetSystem}>
                      Eliminar Todo
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Papelera de Reciclaje */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Trash2 className="w-5 h-5 mr-2 text-primary" /> Papelera de Reciclaje
          </CardTitle>
          <CardDescription>Documentos eliminados suavemente. Se pueden restaurar o eliminar definitivamente.</CardDescription>
        </CardHeader>
        <CardContent>
          {deletedDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">La papelera está vacía.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Fecha Eliminación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedDocs.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.nombreDocumento || doc.tipoDocumento.split(" / ")[0]}</TableCell>
                      <TableCell>{doc.categoriaDocumento.split(" / ")[0]}</TableCell>
                      <TableCell>{doc.eliminadoEn ? new Date(doc.eliminadoEn).toLocaleDateString() : "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => restoreDocument(doc.id)} title="Restaurar" className="text-green-600 hover:text-green-700">
                            <RotateCcw className="w-4 h-4 mr-1" /> Restaurar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => {
                            if (window.confirm("¿Eliminar permanentemente este documento?")) {
                              deleteDocument(doc.id, false);
                            }
                          }} title="Eliminar definitivamente">
                            <Trash2 className="w-4 h-4 mr-1" /> Borrar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
