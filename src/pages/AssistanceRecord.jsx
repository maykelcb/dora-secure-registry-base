import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useDocumentsStore } from "@/store/documentsStore";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Info, ArrowLeft, FileText, MapPin, Shield, Clipboard, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";

const SectionCard = ({ icon: Icon, title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          <span className="font-semibold text-sm tracking-wide uppercase text-foreground/80">{title}</span>
        </div>
        <span className="text-muted-foreground">{open ? "Ocultar" : "Mostrar"}</span>
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
};

const FormRow = ({ children, cols = 2 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-x-6 gap-y-4`}>{children}</div>
);

const InputArea = ({ label, ...props }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium">{label}</Label>
    <Input {...props} />
  </div>
);

export default function AssistanceRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { documents } = useDocumentsStore();
  const doc = useMemo(() => documents.find((item) => item.id === id), [documents, id]);

  const autoNumeroRegistro = useMemo(() => {
    const todayStr = format(new Date(), "yyyyMMdd");
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `AST-${todayStr}-${randomDigits}`;
  }, []);

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      detallesPlan: "",
      sector: "",
      subSector: "",
      tipoAsistencia: "",
      subTipoAsistencia: "",
      tarjetaDerechos: "",
      tipoTarjetaDerechos: "",
      subTipoTarjetaDerechos: "",
      numeroRegistro: autoNumeroRegistro,
      estatusAsistencia: "Entrega Pendiente",
      codigoBarras: "",
      derechosCantidad: "",
      fechaEstatusAsistencia: "",
      numeroOrdenCompra: "",
      medida: "",
      cantidadEntregada: "",
      idExterno: "",
      numeroPersonasCubiertas: "",
      asistenciaEntregadaPor: "",
      idIndividualRecolector: "",
      fechaRealInicio: "",
      fechaEntrega: "",
      fechaRealFinalizacion: "",
      tipoEntrega: "",
      fechaSeguimiento: "",
      tipoSeguimiento: "",
      camposMonitoreo: "",
      proyecto: "",
      subProyecto: "",
      codigoProyectoSocio: "",
      codigoSubProyectoSocio: "",
      asistenciaProporcionadaPor: "",
      asistenciaPorMedioDe: "",
      asistenciaFinanciadaPor: "",
      comentarios: "",
    },
  });

  const onSubmit = (data) => {
    toast.success("Registro de asistencia guardado");
    navigate(`/documents/${id}`);
  };

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Info className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-medium">Individuo no encontrado</h2>
        <Button className="mt-4" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
    );
  }

  const formatPropertyDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-300 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif">Registrar Asistencia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro de asistencia para <span className="font-semibold">{doc.nombreCompleto || "Sin Nombre"}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate(`/documents/${id}`)}>
            <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Volver al individuo
          </Button>
          <Button size="sm" onClick={handleSubmit(onSubmit)}>Guardar</Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <SectionCard icon={FileText} title="Plan de asistencia" defaultOpen={true}>
          <FormRow cols={2}>
            <InputArea label="Detalles del Plan Específico" {...register("detallesPlan")} />
            <InputArea label="Sector" {...register("sector")} />
            <InputArea label="SubSector" {...register("subSector")} />
            <InputArea label="Tipo de Asistencia" {...register("tipoAsistencia")} />
            <InputArea label="SubTipo de Asistencia" {...register("subTipoAsistencia")} />
            <InputArea label="Tarjeta de Derechos" {...register("tarjetaDerechos")} />
            <InputArea label="Tipo de Tarjeta de Derechos" {...register("tipoTarjetaDerechos")} />
            <InputArea label="SubTipo de Tarjeta de Derechos" {...register("subTipoTarjetaDerechos")} />
          </FormRow>
        </SectionCard>

        <SectionCard icon={MapPin} title="Sección de Entrega" defaultOpen={true}>
          <FormRow cols={2}>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Número del Registro de Asistencia</Label>
                <span className="text-[10px] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded">Auto-generado</span>
              </div>
              <Input
                {...register("numeroRegistro")}
                readOnly
                disabled
                className="bg-muted/50 cursor-not-allowed text-xs font-mono font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Estatus de la Asistencia</Label>
              <Select {...register("estatusAsistencia")}> 
                <option value="Entrega Pendiente">Entrega Pendiente</option>
                <option value="Entregado">Entregado</option>
                <option value="Cancelado">Cancelado</option>
              </Select>
            </div>
            <InputArea label="Código de Barras del Artículo" {...register("codigoBarras")} />
            <InputArea label="Derechos (Cantidad)" {...register("derechosCantidad")} />
            <InputArea label="Fecha del Estatus de la Asistencia" type="date" {...register("fechaEstatusAsistencia")} />
            <InputArea label="Número de Orden de Compra" {...register("numeroOrdenCompra")} />
            <InputArea label="Medida" {...register("medida")} />
            <InputArea label="Cantidad Entregada" {...register("cantidadEntregada")} />
            <InputArea label="ID Externo" {...register("idExterno")} />
            <InputArea label="Número de personas cubiertas" {...register("numeroPersonasCubiertas")} />
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Asistencia Entregada Por</Label>
              <Select {...register("asistenciaEntregadaPor")}>
                <option value="">Seleccionar rol / encargado...</option>
                <option value="Registrador">Registrador</option>
                <option value="Coordinador">Coordinador</option>
                <option value="Voluntario">Voluntario</option>
                <option value="Facilitador">Facilitador</option>
                <option value="Oficial de Campo">Oficial de Campo</option>
                <option value="Trabajador Social">Trabajador Social</option>
                <option value="Administrador">Administrador</option>
                <option value="Promotor Comunitario">Promotor Comunitario</option>
                <option value="Socio Implementador">Socio Implementador</option>
                <option value="Otro">Otro</option>
              </Select>
            </div>
            <InputArea label="ID Individual del Recolector" {...register("idIndividualRecolector")} />
            <InputArea label="Fecha Real de Inicio" type="date" {...register("fechaRealInicio")} />
            <InputArea label="Fecha de Entrega" type="date" {...register("fechaEntrega")} />
            <InputArea label="Fecha Real de Finalización" type="date" {...register("fechaRealFinalizacion")} />
            <InputArea label="Tipo de Entrega" {...register("tipoEntrega")} />
          </FormRow>
        </SectionCard>

        <SectionCard icon={Shield} title="Seguimiento" defaultOpen={false}>
          <FormRow cols={2}>
            <InputArea label="Fecha de Seguimiento" type="date" {...register("fechaSeguimiento")} />
            <InputArea label="Tipo de Seguimiento" {...register("tipoSeguimiento")} />
            <InputArea label="Campos de monitoreo" {...register("camposMonitoreo")} />
          </FormRow>
        </SectionCard>

        <SectionCard icon={Clipboard} title="Detalles del proyecto" defaultOpen={false}>
          <FormRow cols={2}>
            <InputArea label="Proyecto" {...register("proyecto")} />
            <InputArea label="SubProyecto" {...register("subProyecto")} />
            <InputArea label="Código de Proyecto Socio" {...register("codigoProyectoSocio")} />
            <InputArea label="Código de SubProyecto Socio" {...register("codigoSubProyectoSocio")} />
            <InputArea label="Asistencia Proporcionada Por" {...register("asistenciaProporcionadaPor")} />
            <InputArea label="Asistencia Por Medio De" {...register("asistenciaPorMedioDe")} />
            <InputArea label="Asistencia Financiada Por" {...register("asistenciaFinanciadaPor")} />
          </FormRow>
        </SectionCard>

        <SectionCard icon={Info} title="Comentarios" defaultOpen={false}>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Comentarios</Label>
            <textarea
              {...register("comentarios")}
              placeholder="Escribe cualquier comentario relevante..."
              className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </SectionCard>

        <SectionCard icon={Clock} title="Propiedades" defaultOpen={false}>
          <FormRow cols={2}>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fecha de creación</Label>
              <Input value={formatPropertyDate(doc.creadoEn)} readOnly disabled className="bg-muted/50 cursor-not-allowed text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Creado por</Label>
              <Input value={doc.creadoPor || "—"} readOnly disabled className="bg-muted/50 cursor-not-allowed text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fecha de modificación</Label>
              <Input value={formatPropertyDate(doc.modificadoEn)} readOnly disabled className="bg-muted/50 cursor-not-allowed text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Modificado por</Label>
              <Input value={doc.modificadoPor || "—"} readOnly disabled className="bg-muted/50 cursor-not-allowed text-xs" />
            </div>
          </FormRow>
        </SectionCard>
      </form>
    </div>
  );
}
