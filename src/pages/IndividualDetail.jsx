import { useParams, useNavigate, Link } from "react-router-dom";
import { useDocumentsStore } from "@/store/documentsStore";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Building, Hash, FileText, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export default function IndividualDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { documents, deleteDocument } = useDocumentsStore();

  const doc = documents.find(d => d.id === id);

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
    if (doc.estatus !== "Vigente" || !doc.fechaVencimiento) return false;
    const days = differenceInDays(new Date(doc.fechaVencimiento), new Date());
    return days >= 0 && days <= 30;
  };

  const isAlreadyExpired = () => {
    if (doc.estatus !== "Vigente" || !doc.fechaVencimiento) return false;
    return new Date(doc.fechaVencimiento) < new Date();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/documents")} className="text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al listado
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="text-orange-600 border-orange-200" asChild>
            <Link to={`/documents/edit/${doc.id}`}>
              <Edit className="w-4 h-4 mr-2" /> Editar
            </Link>
          </Button>
          <Button variant="outline" className="text-destructive border-destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Eliminar
          </Button>
        </div>
      </div>

      <Card className="border-t-4 border-t-primary shadow-md">
        <CardHeader className="pb-4 border-b">
          <div className="flex justify-between items-start">
            <div>
              <CardDescription className="text-primary font-medium mb-1">{doc.categoriaDocumento}</CardDescription>
              <CardTitle className="text-2xl font-serif">
                {doc.nombreDocumento || doc.tipoDocumento.split(" / ")[0]}
              </CardTitle>
            </div>
            <div className="flex flex-col items-end gap-2">
              {doc.estatus === "Vigente" && <Badge variant="success" className="text-sm px-3 py-1">Vigente</Badge>}
              {doc.estatus === "Expired / Expirado" && <Badge variant="destructive" className="text-sm px-3 py-1">Expirado</Badge>}
              {doc.estatus === "Lost / Perdido" && <Badge variant="muted" className="text-sm px-3 py-1">Perdido</Badge>}
              
              {isExpiringSoon() && (
                <Badge variant="warning" className="animate-pulse">Vence pronto</Badge>
              )}
              {isAlreadyExpired() && (
                <Badge variant="destructive">Fecha expirada</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <FileText className="w-4 h-4 mr-2" /> Tipo Exacto
              </h3>
              <p className="font-medium">{doc.tipoDocumento}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <Hash className="w-4 h-4 mr-2" /> Número de Documento
              </h3>
              <p className="font-medium text-lg">{doc.numero || "No especificado"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <Building className="w-4 h-4 mr-2" /> Autoridad Emisora
              </h3>
              <p className="font-medium">{doc.tipoAutoridad}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <Calendar className="w-4 h-4 mr-2" /> Fecha de Nacimiento
              </h3>
              <p className="font-medium">{doc.fechaNacimiento ? format(new Date(doc.fechaNacimiento), "dd/MM/yyyy") : "No especificada"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <MapPin className="w-4 h-4 mr-2" /> País / Departamento de Nacimiento
              </h3>
              <p className="font-medium">{doc.paisNacimiento || "No especificado"}{doc.departamentoNacimiento ? `, ${doc.departamentoNacimiento}` : ""}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <Calendar className="w-4 h-4 mr-2" /> Fecha de ingreso al país
              </h3>
              <p className="font-medium">{doc.fechaIngresoPais ? format(new Date(doc.fechaIngresoPais), "dd/MM/yyyy") : "No especificada"}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <MapPin className="w-4 h-4 mr-2" /> Lugar y País de Emisión
              </h3>
              <p className="font-medium">{doc.lugarEmision ? `${doc.lugarEmision}, ` : ""}{doc.paisEmision}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                  <Calendar className="w-4 h-4 mr-2" /> Emisión
                </h3>
                <p className="font-medium">
                  {doc.fechaEmision ? format(new Date(doc.fechaEmision), "dd/MM/yyyy") : "No especificada"}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                  <Calendar className="w-4 h-4 mr-2" /> Vencimiento
                </h3>
                <p className={`font-medium ${isAlreadyExpired() ? "text-destructive" : ""}`}>
                  {doc.fechaVencimiento ? format(new Date(doc.fechaVencimiento), "dd/MM/yyyy") : "No aplica / No especificada"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <Building className="w-4 h-4 mr-2" /> Estado Civil
              </h3>
              <p className="font-medium">{doc.estadoCivil || "No especificado"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <Building className="w-4 h-4 mr-2" /> Género
              </h3>
              <p className="font-medium">{doc.genero || "No especificado"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <Building className="w-4 h-4 mr-2" /> Grado de estudio
              </h3>
              <p className="font-medium">{doc.gradoEstudio || "No especificado"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <Building className="w-4 h-4 mr-2" /> Estado de estudios
              </h3>
              <p className="font-medium">{doc.estadoEstudios || "No especificado"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <Building className="w-4 h-4 mr-2" /> Relación con el PF
              </h3>
              <p className="font-medium">{doc.relacionConPF || "Punto Focal"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                <Hash className="w-4 h-4 mr-2" /> Grupo de Registro
              </h3>
              <p className="font-medium">{doc.grupoRegistro || "No asignado"}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Descripción / Comentarios</h3>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md border text-sm min-h-[60px]">
                {doc.descripcion ? doc.descripcion : <span className="text-muted-foreground italic">Sin comentarios</span>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-center text-xs text-muted-foreground mt-8">
        Registro creado el {format(new Date(doc.creadoEn), "dd 'de' MMMM, yyyy HH:mm", { locale: es })}
        <br />
        Última modificación: {format(new Date(doc.modificadoEn), "dd 'de' MMMM, yyyy HH:mm", { locale: es })}
      </div>
    </div>
  );
}
