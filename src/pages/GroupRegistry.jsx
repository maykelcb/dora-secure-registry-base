import { useState, useMemo, useEffect } from "react";
import { useDocumentsStore } from "@/store/documentsStore";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Hash, Users } from "lucide-react";
import { format } from "date-fns";

export default function GroupRegistry() {
  const { documents } = useDocumentsStore();
  const groupIds = useMemo(
    () => [...new Set(documents.filter(doc => doc.grupoRegistro && !doc.eliminado).map(doc => doc.grupoRegistro))],
    [documents]
  );
  const [selectedGroup, setSelectedGroup] = useState(groupIds[0] || "");

  useEffect(() => {
    if (!groupIds.includes(selectedGroup)) {
      setSelectedGroup(groupIds[0] || "");
    }
  }, [groupIds, selectedGroup]);

  const members = useMemo(
    () => documents.filter(doc => doc.grupoRegistro === selectedGroup && !doc.eliminado),
    [documents, selectedGroup]
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold font-serif tracking-tight">Grupo de Registro</h2>
          </div>
          <p className="text-muted-foreground mt-1">
            Visualiza los grupos de registro generados por individuos Punto Focal.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar grupo</CardTitle>
          <CardDescription>
            Elige un grupo para ver su ID y los miembros asociados.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          {groupIds.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No hay grupos de registro definidos. Crea un individuo con relación "Punto Focal" para generar el primer ID único.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-[1fr_2fr] items-center">
              <div className="space-y-2">
                <Label>Grupo de Registro</Label>
                <Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
                  {groupIds.map(groupId => (
                    <option key={groupId} value={groupId}>{groupId}</option>
                  ))}
                </Select>
              </div>

              <div className="bg-muted/10 p-4 rounded-lg border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Hash className="w-4 h-4" /> ID único
                </div>
                <div className="text-lg font-semibold break-all">{selectedGroup}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {members.length} miembro{members.length === 1 ? "" : "s"} en este grupo.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedGroup && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Miembros del grupo</CardTitle>
            <CardDescription>
              Personas registradas que comparten este ID de grupo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay personas vinculadas a este grupo todavía.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Nombre</TableHead>
                      <TableHead>Relación</TableHead>
                      <TableHead>Estado Civil</TableHead>
                      <TableHead>Género</TableHead>
                      <TableHead>Fecha Ingreso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(member => (
                      <TableRow key={member.id} className="hover:bg-muted/30">
                        <TableCell>{member.nombreDocumento || member.tipoDocumento.split(" / ")[0]}</TableCell>
                        <TableCell>{member.relacionConPF}</TableCell>
                        <TableCell>{member.estadoCivil || "N/A"}</TableCell>
                        <TableCell>{member.genero || "N/A"}</TableCell>
                        <TableCell>{member.fechaIngresoPais ? format(new Date(member.fechaIngresoPais), "dd/MM/yyyy") : "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
