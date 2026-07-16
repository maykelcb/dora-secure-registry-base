import { useParams, useNavigate, Link } from "react-router-dom";
import { useDocumentsStore } from "@/store/documentsStore";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Building,
  Hash,
  FileText,
  AlertTriangle,
  Users,
  Plus,
  Eye,
  Phone,
  Mail,
  ShieldCheck,
  Clock,
  User
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { useAuthStore, ADMIN_EMAILS } from "@/store/authStore";

export default function IndividualDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { documents, deleteDocument } = useDocumentsStore();
  const currentEmail = useAuthStore((state) => state.currentEmail);
  const isAdmin = Boolean(currentEmail && ADMIN_EMAILS.includes(currentEmail.toLowerCase()));

  const doc = documents.find(d => d.id === id);
  
  // Obtener otros miembros del mismo grupo
  const groupMembers = doc?.grupoRegistro
    ? documents.filter(d => d.grupoRegistro === doc.grupoRegistro && d.id !== doc.id && !d.eliminado)
    : [];

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-medium">Registro no encontrado</h2>
        <Button className="mt-4" onClick={() => navigate("/documents")}>Volver al listado</Button>
      </div>
    );
  }

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de que deseas enviar este registro a la papelera?")) {
      deleteDocument(id);
      navigate("/documents");
    }
  };

  const isExpiringSoon = () => {
    if (!doc.fechaVencimiento || doc.estatus !== "Vigente") return false;
    try {
      const days = differenceInDays(new Date(doc.fechaVencimiento), new Date());
      return days >= 0 && days <= 30;
    } catch {
      return false;
    }
  };

  const isAlreadyExpired = () => {
    if (!doc.fechaVencimiento || doc.estatus !== "Vigente") return false;
    try {
      return new Date(doc.fechaVencimiento) < new Date();
    } catch {
      return false;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "No especificada";
    try {
      return format(new Date(dateStr), "dd 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm");
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Botón de retroceso y acciones */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/documents")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al listado
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950/20" onClick={() => navigate(`/documents/${doc.id}/assistance`)}>
            <FileText className="w-4 h-4 mr-2" /> Registrar asistencia
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20" asChild>
                <Link to={`/documents/edit/${doc.id}`}>
                  <Edit className="w-4 h-4 mr-2" /> Editar
                </Link>
              </Button>
              <Button variant="outline" className="text-destructive border-destructive hover:bg-red-50 dark:hover:bg-red-950/20" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" /> Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tarjeta de Encabezado Principal */}
      <Card className="border-t-4 border-t-primary shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 via-transparent to-transparent p-6 border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-2xl shadow-inner shrink-0">
                {(doc.nombreCompleto || doc.nombreDocumento || "IN").charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-2xl font-bold font-serif tracking-tight text-foreground">
                  {doc.nombreCompleto || doc.nombreDocumento || (doc.tipoDocumento ? doc.tipoDocumento.split(" / ")[0] : "Sin nombre")}
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-xs font-semibold px-2.5 py-0.5">
                    {doc.relacionConPF || "Punto Focal (Líder)"}
                  </Badge>
                  {doc.estatusLegal && (
                    <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 text-xs font-semibold px-2.5 py-0.5">
                      {doc.estatusLegal}
                    </Badge>
                  )}
                  {doc.grupoRegistro && (
                    <Badge variant="secondary" className="font-mono text-xs px-2.5 py-0.5">
                      Grupo: {doc.grupoRegistro}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Badges de Estado (para compatibilidad con modelo anterior) */}
            {(doc.estatus || doc.fechaVencimiento) && (
              <div className="flex flex-col items-end gap-2 shrink-0">
                {doc.estatus === "Vigente" && <Badge variant="success" className="px-3 py-1">Vigente</Badge>}
                {doc.estatus === "Expired / Expirado" && <Badge variant="destructive" className="px-3 py-1">Expirado</Badge>}
                {doc.estatus === "Lost / Perdido" && <Badge variant="muted" className="px-3 py-1">Perdido</Badge>}
                {isExpiringSoon() && <Badge variant="warning" className="animate-pulse">Vence pronto</Badge>}
                {isAlreadyExpired() && <Badge variant="destructive">Fecha expirada</Badge>}
              </div>
            )}
          </div>
        </div>

        {/* Contenido Detallado Organizado */}
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Sección 1: Información Personal */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center border-b pb-1">
                <User className="w-4 h-4 mr-2 text-primary" /> Información Personal
              </h3>
              
              <div>
                <span className="text-xs text-muted-foreground block">Nombre Completo</span>
                <span className="font-medium">{doc.nombreCompleto || doc.nombreDocumento || "—"}</span>
              </div>
              
              {doc.nombrePila && (
                <div>
                  <span className="text-xs text-muted-foreground block">Nombre de Pila</span>
                  <span className="font-medium">{doc.nombrePila}</span>
                </div>
              )}

              {doc.linajeFamiliar && (
                <div>
                  <span className="text-xs text-muted-foreground block">Linaje Familiar</span>
                  <span className="font-medium">{doc.linajeFamiliar}</span>
                </div>
              )}

              {doc.apellidoConyuge && (
                <div>
                  <span className="text-xs text-muted-foreground block">Apellido del Cónyuge</span>
                  <span className="font-medium">{doc.apellidoConyuge}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block">Sexo / Género</span>
                  <span className="font-medium capitalize">{doc.sexo || doc.genero || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Edad</span>
                  <span className="font-medium">{doc.edad || "—"}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Fecha de Nacimiento</span>
                <span className="font-medium">{doc.fechaNacimiento ? formatDate(doc.fechaNacimiento) : "—"}</span>
              </div>

              {doc.estadoCivil && (
                <div>
                  <span className="text-xs text-muted-foreground block">Estado Civil</span>
                  <span className="font-medium">{doc.estadoCivil}</span>
                </div>
              )}
            </div>

            {/* Sección 2: Registro y Estado Legal */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center border-b pb-1">
                <ShieldCheck className="w-4 h-4 mr-2 text-primary" /> Registro y Estado Legal
              </h3>

              <div>
                <span className="text-xs text-muted-foreground block">Grupo de Registro</span>
                <span className="font-mono font-medium">{doc.grupoRegistro || "No asignado"}</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Relación con el Punto Focal</span>
                <span className="font-medium">{doc.relacionConPF || "Punto Focal"}</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Estatus Legal</span>
                <span className="font-medium">{doc.estatusLegal || "—"}</span>
              </div>

              {doc.unidadOperaciones && (
                <div>
                  <span className="text-xs text-muted-foreground block">Unidad de Operaciones</span>
                  <span className="font-medium">{doc.unidadOperaciones}</span>
                </div>
              )}

              {(doc.oficinaRegistro || doc.departamentoRegistro) && (
                <div>
                  <span className="text-xs text-muted-foreground block">Lugar de Registro</span>
                  <span className="font-medium">
                    {doc.oficinaRegistro || "—"}
                    {doc.departamentoRegistro ? `, ${doc.departamentoRegistro}` : ""}
                  </span>
                </div>
              )}

              <div>
                <span className="text-xs text-muted-foreground block">Fecha de Ingreso al País</span>
                <span className="font-medium">{doc.fechaIngresoPais ? formatDate(doc.fechaIngresoPais) : doc.fechaIngreso ? formatDate(doc.fechaIngreso) : "—"}</span>
              </div>

              {doc.puntosTransito && (
                <div>
                  <span className="text-xs text-muted-foreground block">Puntos de Tránsito</span>
                  <span className="font-medium">{doc.puntosTransito}</span>
                </div>
              )}
            </div>

            {/* Sección 3: Contacto e Identificación */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center border-b pb-1">
                <Phone className="w-4 h-4 mr-2 text-primary" /> Contacto e Identificación
              </h3>

              {(doc.telefono || doc.telefonoAlternativo) && (
                <div>
                  <span className="text-xs text-muted-foreground block">Teléfonos</span>
                  <span className="font-medium">
                    {doc.telefono || "—"}
                    {doc.telefonoAlternativo ? ` / ${doc.telefonoAlternativo}` : ""}
                  </span>
                </div>
              )}

              {doc.email && (
                <div>
                  <span className="text-xs text-muted-foreground block">Correo Electrónico</span>
                  <span className="font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    {doc.email}
                  </span>
                </div>
              )}

              {doc.direccionActual && (
                <div>
                  <span className="text-xs text-muted-foreground block">Dirección Actual</span>
                  <span className="font-medium text-sm block leading-relaxed">{doc.direccionActual}</span>
                </div>
              )}

              <div>
                <span className="text-xs text-muted-foreground block">Documento de Identidad</span>
                <span className="font-medium">{doc.documentoIdentidad || doc.tipoDocumento || "—"}</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Número de Documento</span>
                <span className="font-mono font-medium text-lg text-primary">{doc.numeroDocumento || doc.numero || "—"}</span>
              </div>

              {doc.consentimientoFirmado && (
                <div>
                  <span className="text-xs text-muted-foreground block">Consentimiento Firmado</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
                    doc.consentimientoFirmado === "Sí" || doc.consentimientoFirmado === true
                      ? "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-300"
                      : "bg-orange-100 text-orange-800 dark:bg-orange-950/20 dark:text-orange-300"
                  }`}>
                    {doc.consentimientoFirmado === "Sí" || doc.consentimientoFirmado === true ? "Sí, Otorgado" : "No Otorgado"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Compatibilidad con campos antiguos si existen */}
          {(doc.tipoAutoridad || doc.paisEmision || doc.fechaVencimiento || doc.gradoEstudio) && (
            <div className="mt-8 pt-6 border-t border-dashed">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Información de Registro Adicional
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                {doc.tipoAutoridad && (
                  <div>
                    <span className="text-muted-foreground text-xs block mb-0.5">Autoridad Emisora</span>
                    <span className="font-medium text-foreground">{doc.tipoAutoridad}</span>
                  </div>
                )}
                {doc.paisEmision && (
                  <div>
                    <span className="text-muted-foreground text-xs block mb-0.5">País / Lugar Emisión</span>
                    <span className="font-medium text-foreground">{doc.lugarEmision ? `${doc.lugarEmision}, ` : ""}{doc.paisEmision}</span>
                  </div>
                )}
                {doc.fechaVencimiento && (
                  <div>
                    <span className="text-muted-foreground text-xs block mb-0.5">Fecha Vencimiento</span>
                    <span className={`font-medium ${isAlreadyExpired() ? "text-destructive" : "text-foreground"}`}>
                      {formatDate(doc.fechaVencimiento)}
                    </span>
                  </div>
                )}
                {doc.gradoEstudio && (
                  <div>
                    <span className="text-muted-foreground text-xs block mb-0.5">Nivel de Estudio</span>
                    <span className="font-medium text-foreground">{doc.gradoEstudio}{doc.estadoEstudios ? ` (${doc.estadoEstudios})` : ""}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {doc.descripcion && (
            <div className="mt-6 pt-6 border-t">
              <span className="text-xs text-muted-foreground block mb-1">Descripción / Observaciones</span>
              <div className="bg-muted/30 p-3.5 rounded-lg border text-sm text-foreground leading-relaxed">
                {doc.descripcion}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Miembros del Grupo de Registro */}
      {doc.grupoRegistro && (
        <Card className="shadow-md overflow-hidden">
          <CardHeader className="pb-4 border-b flex flex-row items-center justify-between flex-wrap gap-4 bg-muted/10">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Miembros del Grupo de Registro
              </CardTitle>
              <CardDescription>
                Familiares asociados al grupo: <span className="font-mono font-semibold text-foreground">{doc.grupoRegistro}</span>
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="text-xs font-semibold gap-1.5 shadow-sm"
              onClick={() => navigate(`/documents/new?grupo=${doc.grupoRegistro}`)}
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Miembro al Grupo
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {groupMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-8">
                No hay otros miembros registrados en este grupo.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="py-3 px-4">Nombre</th>
                      <th className="py-3 px-4">Relación con PF</th>
                      <th className="py-3 px-4">Sexo</th>
                      <th className="py-3 px-4">Edad</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupMembers.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-muted/10 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {member.nombreCompleto || member.nombreDocumento || "Sin nombre"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                            {member.relacionConPF || "Otro"}
                          </span>
                        </td>
                        <td className="py-3 px-4 capitalize">{member.sexo || member.genero || "—"}</td>
                        <td className="py-3 px-4">{member.edad || "—"}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button variant="ghost" size="icon" className="w-8 h-8" asChild title="Ver">
                              <Link to={`/documents/${member.id}`}>
                                <Eye className="w-4 h-4 text-blue-600" />
                              </Link>
                            </Button>
                            {isAdmin && (
                              <Button variant="ghost" size="icon" className="w-8 h-8" asChild title="Editar">
                                <Link to={`/documents/edit/${member.id}`}>
                                  <Edit className="w-4 h-4 text-orange-500" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Sección de Auditoría / Propiedades */}
      <div className="text-center text-xs text-muted-foreground mt-8 space-y-1">
        <p className="flex items-center justify-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Registro creado el <span className="font-medium text-foreground">{formatDateTime(doc.creadoEn)}</span>
          {doc.creadoPor && <span> por <span className="font-medium text-foreground">{doc.creadoPor}</span></span>}
        </p>
        {doc.modificadoEn && (
          <p className="flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Última modificación: <span className="font-medium text-foreground">{formatDateTime(doc.modificadoEn)}</span>
            {doc.modificadoPor && <span> por <span className="font-medium text-foreground">{doc.modificadoPor}</span></span>}
          </p>
        )}
      </div>
    </div>
  );
}
