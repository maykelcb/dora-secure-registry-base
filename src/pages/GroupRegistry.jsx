import { useState, useMemo, useEffect } from "react";
import { useDocumentsStore } from "@/store/documentsStore";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Hash, Users, User, Plus, ArrowRight, Shield, Globe, Calendar, Eye, Activity } from "lucide-react";
import { format } from "date-fns";

export default function GroupRegistry() {
  const navigate = useNavigate();
  const { documents, loadDocuments } = useDocumentsStore();

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Obtener todos los IDs de grupos de registro activos
  const groupIds = useMemo(
    () => [...new Set(documents.filter(doc => doc.grupoRegistro && !doc.eliminado).map(doc => doc.grupoRegistro))],
    [documents]
  );

  const [selectedGroup, setSelectedGroup] = useState("");

  // Estructurar el estado seleccionado inicial cuando groupIds cambie
  useEffect(() => {
    if (groupIds.length > 0 && !selectedGroup) {
      setSelectedGroup(groupIds[0]);
    }
  }, [groupIds, selectedGroup]);

  // Si cambia la lista de grupos y el seleccionado ya no existe, actualizar
  useEffect(() => {
    if (!groupIds.includes(selectedGroup)) {
      setSelectedGroup(groupIds[0] || "");
    }
  }, [groupIds, selectedGroup]);

  // Miembros del grupo seleccionado
  const members = useMemo(
    () => documents.filter(doc => doc.grupoRegistro === selectedGroup && !doc.eliminado),
    [documents, selectedGroup]
  );

  // Líder / Punto Focal del grupo
  const leader = useMemo(
    () => members.find(m => m.relacionConPF === "Punto Focal"),
    [members]
  );

  // Demás miembros del grupo
  const otherMembers = useMemo(
    () => members.filter(m => m.relacionConPF !== "Punto Focal"),
    [members]
  );

  // Información agregada de los grupos para el listado lateral
  const groupsMetadata = useMemo(() => {
    return groupIds.map(id => {
      const grpMembers = documents.filter(doc => doc.grupoRegistro === id && !doc.eliminado);
      const grpLeader = grpMembers.find(m => m.relacionConPF === "Punto Focal");
      return {
        id,
        membersCount: grpMembers.length,
        leaderName: grpLeader ? (grpLeader.nombreCompleto || grpLeader.nombreDocumento || (grpLeader.tipoDocumento ? grpLeader.tipoDocumento.split(" / ")[0] : "Sin nombre")) : "Sin líder",
        country: grpLeader ? (grpLeader.paisOrigen || grpLeader.paisNacimiento || "N/A") : "N/A"
      };
    });
  }, [documents, groupIds]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-3xl font-bold font-serif tracking-tight">Grupos de Registro</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Gestión de núcleos familiares y grupos liderados por un Punto Focal.
          </p>
        </div>
        
        {selectedGroup && (
          <Button 
            onClick={() => navigate(`/documents/new?grupo=${selectedGroup}`)}
            className="flex items-center gap-2 font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Agregar Miembro al Grupo
          </Button>
        )}
      </div>

      {groupIds.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-muted rounded-full">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">No hay grupos de registro</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Los grupos se generan automáticamente al registrar a un individuo con relación "Punto Focal".
              </p>
            </div>
            <Button onClick={() => navigate("/documents/new")} className="mt-2">
              Registrar Punto Focal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA: Selector de Grupo */}
          <div className="space-y-4">
            {/* Vista Mobile: Desplegable simple */}
            <div className="lg:hidden">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Seleccionar Grupo
              </label>
              <select 
                value={selectedGroup} 
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {groupsMetadata.map(grp => (
                  <option key={grp.id} value={grp.id}>
                    {grp.id} ({grp.membersCount} miemb.) - {grp.leaderName}
                  </option>
                ))}
              </select>
            </div>

            {/* Vista Desktop: Lista de Tarjetas */}
            <div className="hidden lg:flex flex-col gap-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1">
                Grupos Disponibles ({groupIds.length})
              </h3>
              {groupsMetadata.map((grp) => {
                const isSelected = grp.id === selectedGroup;
                return (
                  <button
                    key={grp.id}
                    onClick={() => setSelectedGroup(grp.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
                        : "bg-card hover:bg-muted/40 border-border"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? "bg-primary/25 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {grp.id.split("-").slice(-1)[0]}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {grp.membersCount}
                      </span>
                    </div>
                    <h4 className="font-semibold text-sm text-foreground truncate">{grp.leaderName}</h4>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                      <Globe className="w-3 h-3" />
                      {grp.country}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLUMNA DERECHA: Detalle del Grupo Seleccionado */}
          <div className="space-y-6">
            
            {/* Cabecera del Detalle */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/20 border p-4 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Hash className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    ID del Grupo de Registro
                  </div>
                  <div className="text-lg font-bold font-mono tracking-tight text-foreground">{selectedGroup}</div>
                </div>
              </div>
              <div className="flex gap-4 text-sm font-medium">
                <div className="text-center px-4 py-1.5 bg-background border rounded-lg">
                  <span className="text-muted-foreground text-xs block">Total Miembros</span>
                  <span className="text-lg font-bold">{members.length}</span>
                </div>
              </div>
            </div>

            {/* SECCIÓN LÍDER: Punto Focal Destacado */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Líder / Encargado del Grupo
              </h3>
              {leader ? (
                <Card className="border-l-4 border-l-primary relative overflow-hidden bg-gradient-to-r from-primary/5 via-transparent to-transparent">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg shadow-inner">
                          {(leader.nombreCompleto || leader.nombreDocumento || "PF").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold">
                            {leader.nombreCompleto || leader.nombreDocumento || leader.tipoDocumento || "Sin nombre"}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1.5 text-primary font-medium mt-0.5 text-xs">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Punto Focal (Encargado Principal)
                          </CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="h-8">
                        <Link to={`/documents/${leader.id}`}>
                          Ver Ficha <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-background/50 p-4 rounded-xl border border-muted-foreground/10">
                      <div>
                        <span className="text-muted-foreground text-xs block mb-0.5">Género / Sexo</span>
                        <span className="font-semibold text-foreground">{leader.sexo || leader.genero || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block mb-0.5">País de Origen / Nac.</span>
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                          {leader.paisOrigen || leader.paisNacimiento || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block mb-0.5">Estado Civil</span>
                        <span className="font-semibold text-foreground">{leader.estadoCivil || "Soltero/a"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs block mb-0.5">Fecha Ingreso País</span>
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                          {formatDate(leader.fechaIngresoPais)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed p-4 text-center">
                  <div className="text-sm text-destructive flex items-center justify-center gap-1.5">
                    ⚠️ Este grupo no tiene un "Punto Focal" (Líder) registrado en el sistema.
                  </div>
                </Card>
              )}
            </div>

            {/* SECCIÓN MIEMBROS: Tabla de Familiares */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Miembros Vinculados (Dependientes)
              </h3>
              {otherMembers.length === 0 ? (
                <Card className="border-dashed p-6 text-center text-muted-foreground">
                  <CardContent className="space-y-3 pt-4">
                    <p className="text-sm">No hay familiares vinculados a este grupo todavía.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/documents/new?grupo=${selectedGroup}`)}
                      className="gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Agregar primer familiar
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden border-muted-foreground/10">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="font-semibold text-foreground pl-4">Nombre</TableHead>
                          <TableHead className="font-semibold text-foreground">Relación con el Líder</TableHead>
                          <TableHead className="font-semibold text-foreground">Género</TableHead>
                          <TableHead className="font-semibold text-foreground">Estado Civil</TableHead>
                          <TableHead className="font-semibold text-foreground">Estudios</TableHead>
                          <TableHead className="font-semibold text-foreground text-right pr-4">Ficha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {otherMembers.map((member) => (
                          <TableRow key={member.id} className="hover:bg-muted/20">
                            <TableCell className="font-medium text-foreground pl-4">
                              {member.nombreCompleto || member.nombreDocumento || (member.tipoDocumento ? member.tipoDocumento.split(" / ")[0] : "Sin nombre")}
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                                {member.relacionConPF}
                              </span>
                            </TableCell>
                            <TableCell>{member.sexo || member.genero || "N/A"}</TableCell>
                            <TableCell>{member.estadoCivil || "N/A"}</TableCell>
                            <TableCell className="text-xs">
                              {member.gradoEstudio ? `${member.gradoEstudio} (${member.estadoEstudios})` : "N/A"}
                            </TableCell>
                            <TableCell className="text-right pr-4">
                              <Button variant="ghost" size="icon" asChild className="w-8 h-8">
                                <Link to={`/documents/${member.id}`}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
