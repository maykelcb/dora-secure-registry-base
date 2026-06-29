import { useMemo, useState } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";
import { useDocumentsStore } from "@/store/documentsStore";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldCheck, Clock, Trash2, ShieldAlert, RotateCcw, Mail, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function Settings() {
  const { timeoutMinutes, setTimeoutMinutes } = useSettingsStore();
  const { logout, currentEmail } = useAuthStore();
  const { documents, resetSystem, restoreDocument, deleteDocument } = useDocumentsStore();

  const [resetConfirm, setResetConfirm] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const handleResetSystem = () => {
    if (resetConfirm === "RESTABLECER") {
      resetSystem();
      setIsResetDialogOpen(false);
      toast.success("Sistema restablecido");
      logout(); // Force login screen
    }
  };

  const deletedDocs = documents.filter(d => d.eliminado);
  const userActions = useMemo(() => {
    return [...documents]
      .map((doc) => {
        const actionType =
          doc.ultimaAccionTipo ||
          (doc.eliminado && doc.eliminadoEn ? "Eliminó" : null) ||
          (doc.modificadoEn && doc.creadoEn && doc.modificadoEn !== doc.creadoEn ? "Modificó" : null) ||
          (doc.creadoEn ? "Creó" : "Sin acción");

        const actionUser =
          doc.ultimaAccionPor ||
          doc.modificadoPor ||
          doc.creadoPor ||
          currentEmail ||
          "Sistema";

        const actionDate =
          doc.ultimaAccionEn ||
          doc.modificadoEn ||
          doc.creadoEn ||
          null;

        return {
          id: doc.id,
          nombre: doc.nombreCompleto || doc.nombreDocumento || "Sin nombre",
          accion: actionType,
          usuario: actionUser,
          fecha: actionDate,
        };
      })
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  }, [documents, currentEmail]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="mb-8">
        <h2 className="text-3xl font-bold font-serif tracking-tight">Configuración del Sistema</h2>
        <p className="text-muted-foreground mt-1">Gestiona la seguridad, respaldos y preferencias locales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seguridad y Sesión */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <ShieldCheck className="w-5 h-5 mr-2 text-primary" /> Sesión Activa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Usuario actual */}
            {currentEmail && (
              <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ background: "hsl(var(--primary) / 0.05)", borderColor: "hsl(var(--primary) / 0.2)" }}>
                <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0" style={{ background: "hsl(var(--primary) / 0.15)" }}>
                  <Mail className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sesión iniciada como</p>
                  <p className="text-sm font-semibold">{currentEmail}</p>
                </div>
              </div>
            )}

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
                <option value={60}>1 hora</option>
                <option value={240}>4 horas</option>
                <option value={480}>8 horas</option>
                <option value={720}>12 horas</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Acciones del usuario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" /> Acciones del Usuario
            </CardTitle>
            <CardDescription>
              Historial de los individuos que fueron creados, modificados, eliminados o restaurados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userActions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No hay acciones registradas aún.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Individuo</TableHead>
                      <TableHead>Acción</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userActions.map((action) => (
                      <TableRow key={action.id}>
                        <TableCell className="font-medium">{action.nombre}</TableCell>
                        <TableCell>{action.accion}</TableCell>
                        <TableCell>{action.usuario}</TableCell>
                        <TableCell>{action.fecha ? new Date(action.fecha).toLocaleString() : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
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
                      <TableCell className="font-medium">
                        {doc.nombreCompleto || doc.nombreDocumento || (doc.tipoDocumento ? doc.tipoDocumento.split(" / ")[0] : "Sin nombre")}
                      </TableCell>
                      <TableCell>
                        {doc.categoriaDocumento ? doc.categoriaDocumento.split(" / ")[0] : (doc.relacionConPF || "Individual")}
                      </TableCell>
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
