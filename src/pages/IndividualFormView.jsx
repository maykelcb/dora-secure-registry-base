import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Save, ArrowLeft, X, Plus, RefreshCw, ChevronDown,
  AlertCircle, Info, ChevronRight, User, FileText, Link2,
  BookOpen, Clipboard, MapPin, Shield, Lock
} from "lucide-react";
import { useDocumentsStore, generateGrupoRegistro } from "@/store/documentsStore";
import { COUNTRIES } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription
} from "@/components/ui/card";

// ─── Zod Schema ───────────────────────────────────────────────────────────────
const nameRegex = /^[^0-9]*$/;
const nameMessage = "No se permiten números en este campo";

const individualSchema = z.object({
  // GRUPO DE REGISTRO
  creacionGrupo: z.string().min(1, "Campo obligatorio"),
  grupoRegistro: z.string().optional().or(z.literal("")),
  unidadOperaciones: z.string().min(1, "Campo obligatorio"),

  // INFORMACIÓN INDIVIDUAL
  grupoRegistroIndividual: z.string().optional(),
  relacionConPF: z.string().min(1, "Campo obligatorio"),
  nombreCompleto: z.string().min(1, "Campo obligatorio").regex(nameRegex, nameMessage),
  sexo: z.string().min(1, "Campo obligatorio"),
  nombrePila: z.string().regex(nameRegex, nameMessage).optional().or(z.literal("")),
  linajeFamiliar: z.string().regex(nameRegex, nameMessage).optional().or(z.literal("")),
  apellidoCompleto: z.string().min(1, "Campo obligatorio").regex(nameRegex, nameMessage),
  fechaNacimiento: z.string().optional().nullable(),
  fechaEstNacimiento: z.string().optional().nullable(),
  edad: z.string().min(1, "Campo obligatorio"),
  nombreAlfabeto: z.string().optional(),
  paisOrigen: z.string().min(1, "Campo obligatorio"),
  nombreUsadoComun: z.string().optional(),
  lugarNacimientoPais: z.string().optional(),
  tipoMatrimonio: z.string().optional(),
  estadoCivil: z.string().optional(),
  fechaEstadoCivil: z.string().optional().nullable(),
  etnia: z.string().optional(),
  nombrePadre: z.string().regex(nameRegex, nameMessage).optional().or(z.literal("")),
  lugarNacimientoCiudad: z.string().optional(),
  religion: z.string().optional(),
  nombreMadre: z.string().regex(nameRegex, nameMessage).optional().or(z.literal("")),
  nacionalidad: z.string().optional(),
  apellidoSoltera: z.string().regex(nameRegex, nameMessage).optional().or(z.literal("")),
  fallecido: z.string().min(1, "Campo obligatorio"),
  escritoBiometrico: z.boolean().optional(),
  fechaDefuncion: z.string().optional().nullable(),
  estatusBiometrico: z.string().optional(),
  fechaEstDefuncion: z.string().optional().nullable(),

  // CONTACT DETAIL
  telefonoVerificado: z.string().optional(),
  correoVerificado: z.string().optional(),
  mensajeriaVerificada: z.string().optional(),

  // LINKED IDS
  idHeredado: z.string().optional(),
  noRefSocio: z.string().optional(),
  idFueraLinea: z.string().optional(),
  noRefGobierno: z.string().optional(),

  // DATOS BIOGRÁFICOS
  nivelEducacion: z.string().optional(),
  asistenEscuela: z.string().optional(),
  ocupacion: z.string().optional(),
  subOcupacion: z.string().optional(),
  subSubOcupacion: z.string().optional(),
  categoriaSinOcupacion: z.string().optional(),
  situacionLaboral7dias: z.string().optional(),

  // DETALLES DE REGISTRO Y ESTADO LEGAL
  fechaHuida: z.string().optional().nullable(),
  estatusLegal: z.string().min(1, "Campo obligatorio"),
  fechaEstimadaHuida: z.string().optional().nullable(),
  fechaEstatusLegal: z.string().min(1, "Campo obligatorio"),
  fechaLlegada: z.string().min(1, "Campo obligatorio"),
  categoriaEstatusLegal: z.string().optional(),
  fechaEstimadaLlegada: z.string().min(1, "Campo obligatorio"),
  fechaCategoriaEstatusLegal: z.string().optional().nullable(),
  fechaRegistro: z.string().min(1, "Campo obligatorio"),
  fechaBaseLegal: z.string().optional().nullable(),
  baseLegal: z.string().optional(),
  tipoRegistro: z.string().optional(),
  razonRegistro: z.string().min(1, "Campo obligatorio"),
  registradoPrevioACNUR: z.string().optional(),

  // LUGAR DE REGISTRO
  paisAsilo: z.string().min(1, "Campo obligatorio"),
  paisRegistro: z.string().min(1, "Campo obligatorio"),
  nombreLugarRegistro: z.string().optional(),
  puntaSalidaPdO: z.string().optional(),
  puntoEntradaPdA: z.string().optional(),
  fechaUltimoReingreso: z.string().optional().nullable(),

  // CONSENTIMIENTO
  fechaAsesoriaConsentimiento: z.string().min(1, "Campo obligatorio"),
  personaNoCapazConsentir: z.boolean().optional(),
  informadaCompartirBasica: z.string().min(1, "Campo obligatorio"),
  puedeFirmar: z.string().optional(),
  consentProvider: z.string().optional(),
  aceptaCompartirPersonales: z.string().min(1, "Campo obligatorio"),
  nameConsentRegistrado: z.string().regex(nameRegex, nameMessage).optional().or(z.literal("")),
  aceptaCompartirVulnerabilidades: z.string().min(1, "Campo obligatorio"),
  nameConsentOtro: z.string().regex(nameRegex, nameMessage).optional().or(z.literal("")),
  acuerdoNNA: z.string().optional(),

  // PROPIEDADES (Read-only metadata)
  creadoEn: z.string().optional(),
  modificadoEn: z.string().optional(),
  creadoPor: z.string().optional(),
  modificadoPor: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.creacionGrupo === "Añadir a un Grupo de Registro existente") {
    if (!data.grupoRegistro || data.grupoRegistro.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Campo obligatorio cuando se añade a un grupo existente",
        path: ["grupoRegistro"],
      });
    }
  }
});

// ─── Options ──────────────────────────────────────────────────────────────────
const SEXO_OPTIONS = ["Masculino", "Femenino", "No binario", "Otro", "Prefiero no decir"];
const ESTADO_CIVIL_OPTIONS = ["Soltero/a", "Casado/a", "Divorciado/a", "Viudo/a", "Unión Libre", "Separado/a"];
const CREACION_GRUPO_OPTIONS = ["Crear nuevo grupo", "Añadir a un Grupo de Registro existente"];
const RELACION_PF_OPTIONS = [
  "Punto Focal", "Esposa/o", "Hijo/a", "Madre", "Padre", "Hermano/a",
  "Sobrino/a", "Tío/a", "Primo/a", "Abuelo/a", "Nieto/a", "Otro familiar",
];
const SI_NO_OPTIONS = ["Sí", "No", "Desconocido"];
const EDUCACION_OPTIONS = [
  "Sin educación formal", "Primaria incompleta", "Primaria completa",
  "Secundaria incompleta", "Secundaria completa", "Universitaria incompleta",
  "Universitaria completa", "Postgrado", "Otro",
];
const ESTATUS_LEGAL_OPTIONS = [
  "Solicitante de Asilo", "Refugiado reconocido", "Refugiado prima facie",
  "Apátrida", "Retornado", "Desplazado Interno", "Otro estatus",
];
const TIPO_REGISTRO_OPTIONS = ["Registro", "Re-registro", "Actualización", "Otro"];
const RAZON_REGISTRO_OPTIONS = [
  "Nueva llegada", "Re-registro periódico", "Cambio de circunstancias",
  "Nacimiento", "Reunificación familiar", "Otro",
];
const TIPO_MATRIMONIO_OPTIONS = [
  "Civil", "Religioso", "Consuetudinario", "Polígamo", "No aplica",
];
const BIOMETRICO_ESTATUS_OPTIONS = [
  "Registrado", "No registrado", "Pendiente", "Exento",
];
const SI_NO_NA_OPTIONS = ["Sí", "No", "No aplica", "Desconocido"];

// ─── FormField helpers ────────────────────────────────────────────────────────
const RequiredMark = () => (
  <span className="text-red-500 ml-0.5">*</span>
);

const FieldError = ({ error }) =>
  error ? (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {error.message}
    </p>
  ) : null;

const FormRow = ({ children, cols = 2 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-${cols} gap-x-6 gap-y-4`}>
    {children}
  </div>
);

// ─── Section Card with collapse ───────────────────────────────────────────────
const SectionCard = ({ icon: Icon, title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          <span className="font-semibold text-sm tracking-wide uppercase text-foreground/80">
            {title}
          </span>
        </div>
        <ChevronRight
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        />
      </button>
      {open && (
        <div className="p-5 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IndividualFormView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryGrupo = searchParams.get("grupo");
  const { documents, addDocument, updateDocument } = useDocumentsStore();
  const isEditing = !!id;

  const currentDoc = useMemo(() => {
    if (isEditing) {
      return documents.find(d => d.id === id);
    }
    return null;
  }, [isEditing, id, documents]);

  const existingGroups = useMemo(() => {
    return [...new Set(documents.filter(d => d.grupoRegistro).map(d => d.grupoRegistro))];
  }, [documents]);

  const {
    register, handleSubmit, control, watch, setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(individualSchema),
    defaultValues: {
      creacionGrupo: queryGrupo ? "Añadir a un Grupo de Registro existente" : "Crear nuevo grupo",
      grupoRegistro: queryGrupo || "",
      unidadOperaciones: "",
      relacionConPF: queryGrupo ? "Hijo/a" : "Punto Focal",
      sexo: "",
      fallecido: "No",
      estatusLegal: "",
      fechaEstatusLegal: "",
      fechaLlegada: "",
      fechaEstimadaLlegada: "",
      fechaRegistro: "",
      razonRegistro: "",
      paisAsilo: "",
      paisRegistro: "",
      fechaAsesoriaConsentimiento: "",
      informadaCompartirBasica: "",
      aceptaCompartirPersonales: "",
      aceptaCompartirVulnerabilidades: "",
      paisOrigen: "",
      edad: "",
      apellidoCompleto: "",
      nombreCompleto: "",
    }
  });

  const watchCreacion = watch("creacionGrupo");
  const watchRelacion = watch("relacionConPF");
  const watchFallecido = watch("fallecido");

  const formatPropertyDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  // Load data if editing
  useEffect(() => {
    if (isEditing) {
      const doc = documents.find(d => d.id === id);
      if (doc) {
        Object.keys(doc).forEach(key => setValue(key, doc[key] ?? ""));
      } else {
        navigate("/documents");
      }
    }
  }, [id, isEditing, documents, setValue, navigate]);

  const onSubmit = async (data) => {
    // Ensure grupoRegistro is set
    if (!data.grupoRegistro && data.creacionGrupo === "Crear nuevo grupo") {
      data.grupoRegistro = generateGrupoRegistro();
    }
    if (isEditing) {
      await updateDocument(id, data);
    } else {
      await addDocument(data);
    }
    navigate("/documents");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top info banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2.5 mb-4 flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        El campo de ID Individual es de solo lectura. Se generará e incluirá un nuevo ID una vez se guarde el registro.
      </div>

      {/* Page Header / Action Bar */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b flex-wrap">
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-xs gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
        <Button type="submit" form="individual-form" size="sm" className="text-xs gap-1.5 font-semibold">
          <Save className="w-3.5 h-3.5" />
          Guardar
        </Button>
        <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => { handleSubmit(onSubmit)(); navigate("/documents"); }}>
          <Save className="w-3.5 h-3.5" />
          Guardar y cerrar
        </Button>
        <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => navigate("/documents/new")}>
          <Plus className="w-3.5 h-3.5" />
          Nuevo
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          Cambiar Estatus de Pr...
          <ChevronDown className="w-3 h-3" />
        </Button>
        <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5">
          Actualizar Individuo
          <ChevronDown className="w-3 h-3" />
        </Button>
        <Button type="button" variant="outline" size="sm" className="text-xs gap-1.5">
          Añadir
          <ChevronDown className="w-3 h-3" />
        </Button>
      </div>

      {/* Title */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold font-serif">
          {isEditing ? "Editar Individuo" : "Crear Individuo"}
          <span className="text-sm font-normal text-muted-foreground ml-3">: Sin guardar</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Individuo · Information</p>

        {/* Status bar */}
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="font-semibold text-foreground">Activo</span>
            <p className="text-muted-foreground">Estatus del Proceso</p>
          </div>
          <div>
            <span className="font-semibold text-foreground">—</span>
            <p className="text-muted-foreground">Razón del Cambio del Estatus del Proceso</p>
          </div>
          <div>
            <span className="font-semibold text-foreground">{new Date().toLocaleDateString()}</span>
            <p className="text-muted-foreground">Fecha del Estatus del Proceso</p>
          </div>
          <div>
            <span className="font-semibold text-foreground">—</span>
            <p className="text-muted-foreground">Unidad de Operaciones</p>
          </div>
        </div>
      </div>

      <form id="individual-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ═══ 1. GRUPO DE REGISTRO ═══════════════════════════════════════════ */}
        <SectionCard icon={User} title="Grupo de Registro" defaultOpen={true}>
          <FormRow cols={2}>
            {/* Creación de Grupo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Creación de Grupo <RequiredMark />
              </Label>
              <Controller
                name="creacionGrupo"
                control={control}
                render={({ field }) => (
                  <Select {...field} className={errors.creacionGrupo ? "border-red-500" : ""}>
                    <option value="">Seleccionar...</option>
                    {CREACION_GRUPO_OPTIONS.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </Select>
                )}
              />
              <FieldError error={errors.creacionGrupo} />
            </div>

            {/* Grupo de Registro */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Grupo de Registro <RequiredMark />
              </Label>
              {watchCreacion === "Añadir a un Grupo de Registro existente" ? (
                <Controller
                  name="grupoRegistro"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} disabled={!!queryGrupo} className={errors.grupoRegistro ? "border-red-500" : ""}>
                      <option value="">Seleccione un grupo existente</option>
                      {existingGroups.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </Select>
                  )}
                />
              ) : (
                <div className="relative">
                  <Input
                    value={watch("grupoRegistro") || ""}
                    readOnly
                    placeholder="Se generará automáticamente al guardar"
                    className="pr-8 bg-muted/30 cursor-not-allowed text-xs"
                  />
                  <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                </div>
              )}
              <FieldError error={errors.grupoRegistro} />
            </div>

            {/* Unidad de Operaciones */}
            <div className="space-y-1.5 md:col-span-1">
              <Label className="text-xs font-medium">
                Unidad de Operaciones <RequiredMark />
              </Label>
              <div className="relative">
                <Input
                  {...register("unidadOperaciones")}
                  placeholder="Ingresar unidad..."
                  className={`pr-8 ${errors.unidadOperaciones ? "border-red-500" : ""}`}
                />
                <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              </div>
              <FieldError error={errors.unidadOperaciones} />
            </div>
          </FormRow>
        </SectionCard>

        {/* ═══ 2. INFORMACIÓN INDIVIDUAL ══════════════════════════════════════ */}
        <SectionCard icon={User} title="Información Individual" defaultOpen={true}>
          <FormRow cols={2}>
            {/* Grupo de Registro (readonly ref) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Grupo de Registro <RequiredMark />
              </Label>
              <div className="relative">
                <Input
                  value={watch("grupoRegistro") || ""}
                  readOnly
                  className="bg-muted/30 cursor-not-allowed text-xs pr-8"
                  placeholder="Asignado automáticamente"
                />
                <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              </div>
            </div>

            {/* Relación con el PF */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Relación con el PF <RequiredMark />
              </Label>
              <div className="relative">
                <Controller
                  name="relacionConPF"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} className={`${errors.relacionConPF ? "border-red-500" : ""}`}>
                      <option value="">Seleccionar...</option>
                      {RELACION_PF_OPTIONS.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </Select>
                  )}
                />
                <FieldError error={errors.relacionConPF} />
              </div>
            </div>

            {/* Nombre Completo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Nombre Completo <RequiredMark />
              </Label>
              <Input
                {...register("nombreCompleto")}
                placeholder="Ej. GARCÍA LÓPEZ, Juan"
                className={errors.nombreCompleto ? "border-red-500" : ""}
              />
              <FieldError error={errors.nombreCompleto} />
            </div>

            {/* Sexo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Sexo <RequiredMark />
              </Label>
              <Controller
                name="sexo"
                control={control}
                render={({ field }) => (
                  <Select {...field} className={errors.sexo ? "border-red-500" : ""}>
                    <option value="">Seleccionar...</option>
                    {SEXO_OPTIONS.map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </Select>
                )}
              />
              <FieldError error={errors.sexo} />
            </div>

            {/* Nombre de Pila */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nombre de Pila</Label>
              <Input {...register("nombrePila")} placeholder="Ej. Juan" />
            </div>

            {/* Linaje Familiar */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Linaje Familiar</Label>
              <Input {...register("linajeFamiliar")} placeholder="Ej. García" />
            </div>

            {/* Apellido Completo */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Apellido Completo <RequiredMark />
              </Label>
              <Input
                {...register("apellidoCompleto")}
                placeholder="Ej. GARCÍA LÓPEZ"
                className={errors.apellidoCompleto ? "border-red-500" : ""}
              />
              <FieldError error={errors.apellidoCompleto} />
            </div>

            {/* Fecha de Nacimiento */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Fecha de Nacimiento <RequiredMark />
              </Label>
              <Input
                type="date"
                {...register("fechaNacimiento")}
                className={errors.fechaNacimiento ? "border-red-500" : ""}
              />
              <FieldError error={errors.fechaNacimiento} />
            </div>

            {/* Fecha EST. de Nacimiento */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Fecha EST. de Nacimiento <RequiredMark />
              </Label>
              <Controller
                name="fechaEstNacimiento"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Seleccionar...</option>
                    {["Exacta", "Aproximada", "Estimada"].map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </Select>
                )}
              />
            </div>

            {/* Edad */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Edad <RequiredMark />
              </Label>
              <Input
                {...register("edad")}
                type="number"
                min="0"
                max="150"
                placeholder="0"
                className={errors.edad ? "border-red-500" : ""}
              />
              <FieldError error={errors.edad} />
            </div>

            {/* Nombre en alfabeto original */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nombre en Alfabeto Original</Label>
              <Input {...register("nombreAlfabeto")} placeholder="Nombre en idioma original" />
            </div>

            {/* País de Origen */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                País de Origen <RequiredMark />
              </Label>
              <Controller
                name="paisOrigen"
                control={control}
                render={({ field }) => (
                  <Select {...field} className={errors.paisOrigen ? "border-red-500" : ""}>
                    <option value="">Seleccionar...</option>
                    {COUNTRIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                )}
              />
              <FieldError error={errors.paisOrigen} />
            </div>

            {/* Nombre usado comúnmente */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nombre Usado Comúnmente</Label>
              <Input {...register("nombreUsadoComun")} placeholder="Alias o nombre cotidiano" />
            </div>

            {/* Lugar de Nacimiento - País */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Lugar de Nacimiento – País</Label>
              <Controller
                name="lugarNacimientoPais"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Seleccionar...</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                )}
              />
            </div>

            {/* Tipo de Matrimonio */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tipo de Matrimonio</Label>
              <Controller
                name="tipoMatrimonio"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Seleccionar...</option>
                    {TIPO_MATRIMONIO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                )}
              />
            </div>

            {/* Estado Civil */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Estado Civil</Label>
              <Controller
                name="estadoCivil"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Seleccionar...</option>
                    {ESTADO_CIVIL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                )}
              />
            </div>

            {/* Fecha del Estado Civil */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fecha del Estado Civil</Label>
              <Input type="date" {...register("fechaEstadoCivil")} />
            </div>

            {/* Etnia */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Etnia</Label>
              <Input {...register("etnia")} placeholder="Ej. Mestizo, Indígena..." />
            </div>

            {/* Nombre del Padre */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nombre del Padre</Label>
              <Input {...register("nombrePadre")} placeholder="Nombre completo del padre" />
            </div>

            {/* Lugar de Nacimiento - Ciudad */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Lugar de Nacimiento – Ciudad</Label>
              <Input {...register("lugarNacimientoCiudad")} placeholder="Ciudad de nacimiento" />
            </div>

            {/* Religión */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Religión</Label>
              <Input {...register("religion")} placeholder="Ej. Católica, Evangélica..." />
            </div>

            {/* Nombre de la Madre */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nombre de la Madre</Label>
              <Input {...register("nombreMadre")} placeholder="Nombre completo de la madre" />
            </div>

            {/* Nacionalidad */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nacionalidad</Label>
              <Controller
                name="nacionalidad"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Seleccionar...</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                )}
              />
            </div>

            {/* Apellido de Soltera */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Apellido de Soltera</Label>
              <Input {...register("apellidoSoltera")} placeholder="Si aplica" />
            </div>

            {/* Fallecido */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Fallecido <RequiredMark />
              </Label>
              <Controller
                name="fallecido"
                control={control}
                render={({ field }) => (
                  <Select {...field} className={errors.fallecido ? "border-red-500" : ""}>
                    <option value="">Seleccionar...</option>
                    {["Sí", "No"].map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                )}
              />
              <FieldError error={errors.fallecido} />
            </div>

            {/* Esta Escrito Biométricamente */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Esta Escrito Biométricamente</Label>
              <div className="flex items-center gap-2 h-9">
                <input
                  type="checkbox"
                  id="escritoBiometrico"
                  {...register("escritoBiometrico")}
                  className="rounded border-input w-4 h-4"
                />
                <label htmlFor="escritoBiometrico" className="text-xs text-muted-foreground cursor-pointer">
                  Sí, registrado biométricamente
                </label>
              </div>
            </div>

            {/* Fecha de Defunción */}
            {watchFallecido === "Sí" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fecha de Defunción</Label>
                <Input type="date" {...register("fechaDefuncion")} />
              </div>
            )}

            {/* Estatus Biométrico */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Estatus Biométrico</Label>
              <Controller
                name="estatusBiometrico"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Seleccionar...</option>
                    {BIOMETRICO_ESTATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                )}
              />
            </div>

            {/* Fecha EST. de Defunción */}
            {watchFallecido === "Sí" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fecha EST. de Defunción</Label>
                <Input type="date" {...register("fechaEstDefuncion")} />
              </div>
            )}
          </FormRow>
        </SectionCard>

        {/* ═══ 3. CONTACT DETAIL ══════════════════════════════════════════════ */}
        <SectionCard icon={Clipboard} title="Contact Detail" defaultOpen={false}>
          <FormRow cols={3}>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">¿Número de Teléfono Verificado?</Label>
              <Controller
                name="telefonoVerificado"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Seleccionar...</option>
                    {SI_NO_NA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">¿Correo Electrónico Verificado?</Label>
              <Controller
                name="correoVerificado"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Seleccionar...</option>
                    {SI_NO_NA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">¿Aplicación de Mensajería Verificada?</Label>
              <Controller
                name="mensajeriaVerificada"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Seleccionar...</option>
                    {SI_NO_NA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                )}
              />
            </div>
          </FormRow>
        </SectionCard>

        {/* ═══ 4. LINKED IDS ══════════════════════════════════════════════════ */}
        <SectionCard icon={Link2} title="Linked IDs" defaultOpen={false}>
          <FormRow cols={2}>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">ID Heredado</Label>
              <Input {...register("idHeredado")} placeholder="ID heredado de sistema anterior" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">No. Individual de Ref. del Socio</Label>
              <Input {...register("noRefSocio")} placeholder="Número de referencia del socio" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">ID Fuera de Línea</Label>
              <Input {...register("idFueraLinea")} placeholder="ID fuera de línea" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">No. Individual de Ref. del Gob.</Label>
              <Input {...register("noRefGobierno")} placeholder="Número de referencia gubernamental" />
            </div>
          </FormRow>
        </SectionCard>

        {/* ═══ 5. DATOS BIOGRÁFICOS ADICIONALES ═══════════════════════════════ */}
        <SectionCard icon={BookOpen} title="Datos Biográficos Adicionales" defaultOpen={false}>
          <FormRow cols={2}>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nivel de Educación</Label>
              <Controller
                name="nivelEducacion"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Seleccionar...</option>
                    {EDUCACION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Actualmente Asiste a la Escuela</Label>
              <Controller
                name="asistenEscuela"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Seleccionar...</option>
                    {SI_NO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Ocupación</Label>
              <Input {...register("ocupacion")} placeholder="Ej. Agricultor, Comerciante..." />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Sub-Ocupación</Label>
              <Input {...register("subOcupacion")} placeholder="Especificar sub-ocupación" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Sub-Sub-Ocupación</Label>
              <Input {...register("subSubOcupacion")} placeholder="Especificar detalle adicional" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Categoría sin Ocupación</Label>
              <Input {...register("categoriaSinOcupacion")} placeholder="Si no tiene ocupación activa" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium">Situación Laboral en los Últimos 7 Días</Label>
              <Controller
                name="situacionLaboral7dias"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Seleccionar...</option>
                    {["Empleado", "Desempleado", "Trabajador informal", "Estudiante", "Sin actividad laboral", "Otro"].map(o => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </Select>
                )}
              />
            </div>
          </FormRow>
        </SectionCard>

        {/* ═══ 6. DETALLES DE REGISTRO Y ESTADO LEGAL ═════════════════════════ */}
        <SectionCard icon={FileText} title="Detalles de Registro y Estado Legal" defaultOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Column Left */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fecha de Huida</Label>
                <Input type="date" {...register("fechaHuida")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fecha Estimada de Huida</Label>
                <Controller
                  name="fechaEstimadaHuida"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <option value="">Seleccionar...</option>
                      {["Exacta", "Aproximada", "Estimada", "Desconocida"].map(o => <option key={o} value={o}>{o}</option>)}
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Fecha de Llegada <RequiredMark />
                </Label>
                <Input
                  type="date"
                  {...register("fechaLlegada")}
                  className={errors.fechaLlegada ? "border-red-500" : ""}
                />
                <FieldError error={errors.fechaLlegada} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Fecha Estimada de Llegada <RequiredMark />
                </Label>
                <Controller
                  name="fechaEstimadaLlegada"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} className={errors.fechaEstimadaLlegada ? "border-red-500" : ""}>
                      <option value="">Seleccionar...</option>
                      {["Exacta", "Aproximada", "Estimada", "Desconocida"].map(o => <option key={o} value={o}>{o}</option>)}
                    </Select>
                  )}
                />
                <FieldError error={errors.fechaEstimadaLlegada} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Fecha de Registro <RequiredMark />
                </Label>
                <Input
                  type="date"
                  {...register("fechaRegistro")}
                  className={errors.fechaRegistro ? "border-red-500" : ""}
                />
                <FieldError error={errors.fechaRegistro} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Tipo de Registro</Label>
                <Controller
                  name="tipoRegistro"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <option value="">Seleccionar...</option>
                      {TIPO_REGISTRO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Razón del Registro <RequiredMark />
                </Label>
                <Controller
                  name="razonRegistro"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} className={errors.razonRegistro ? "border-red-500" : ""}>
                      <option value="">Seleccionar...</option>
                      {RAZON_REGISTRO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </Select>
                  )}
                />
                <FieldError error={errors.razonRegistro} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Registrado Previamente con ACNUR</Label>
                <Controller
                  name="registradoPrevioACNUR"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <option value="">Seleccionar...</option>
                      {SI_NO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Column Right */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Estatus Legal <RequiredMark />
                </Label>
                <Controller
                  name="estatusLegal"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} className={errors.estatusLegal ? "border-red-500" : ""}>
                      <option value="">Seleccionar...</option>
                      {ESTATUS_LEGAL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </Select>
                  )}
                />
                <FieldError error={errors.estatusLegal} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Fecha del Estatus Legal <RequiredMark />
                </Label>
                <Input
                  type="date"
                  {...register("fechaEstatusLegal")}
                  className={errors.fechaEstatusLegal ? "border-red-500" : ""}
                />
                <FieldError error={errors.fechaEstatusLegal} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Categoría del Estatus Legal</Label>
                <Controller
                  name="categoriaEstatusLegal"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <option value="">Seleccionar...</option>
                      {["Categoría A", "Categoría B", "Categoría C", "Sin categoría"].map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fecha de la Categoría del Estatus Legal</Label>
                <Input type="date" {...register("fechaCategoriaEstatusLegal")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fecha de la Base Legal</Label>
                <Input type="date" {...register("fechaBaseLegal")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Base Legal</Label>
                <Controller
                  name="baseLegal"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <option value="">Seleccionar...</option>
                      {[
                        "Convención 1951", "Protocolo 1967", "Ley Nacional de Refugiados",
                        "Mandato ACNUR", "Otro instrumento legal"
                      ].map(o => <option key={o} value={o}>{o}</option>)}
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ═══ 7. LUGAR DE REGISTRO ═══════════════════════════════════════════ */}
        <SectionCard icon={MapPin} title="Lugar de Registro" defaultOpen={true}>
          <FormRow cols={2}>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                País de Asilo <RequiredMark />
              </Label>
              <Controller
                name="paisAsilo"
                control={control}
                render={({ field }) => (
                  <Select {...field} className={errors.paisAsilo ? "border-red-500" : ""}>
                    <option value="">Seleccionar...</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                )}
              />
              <FieldError error={errors.paisAsilo} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                País de Registro <RequiredMark />
              </Label>
              <Controller
                name="paisRegistro"
                control={control}
                render={({ field }) => (
                  <Select {...field} className={errors.paisRegistro ? "border-red-500" : ""}>
                    <option value="">Seleccionar...</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                )}
              />
              <FieldError error={errors.paisRegistro} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nombre del Lugar del Registro</Label>
              <Input {...register("nombreLugarRegistro")} placeholder="Ej. Oficina Regional Lima" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Punto de Salida del PdO</Label>
              <Input {...register("puntaSalidaPdO")} placeholder="País / ciudad de salida" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Punto de Entrada de PdA</Label>
              <Input {...register("puntoEntradaPdA")} placeholder="Ciudad / puesto de entrada" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fecha de Último Reingreso</Label>
              <Input type="date" {...register("fechaUltimoReingreso")} />
            </div>
          </FormRow>
        </SectionCard>

        {/* ═══ 8. CONSENTIMIENTO PARA COMPARTIR INFORMACIÓN ═══════════════════ */}
        <SectionCard icon={Shield} title="Consentimiento para Compartir Información" defaultOpen={false}>
          <FormRow cols={2}>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Fecha de Asesoría de Consentimiento <RequiredMark />
              </Label>
              <Input
                type="date"
                {...register("fechaAsesoriaConsentimiento")}
                className={errors.fechaAsesoriaConsentimiento ? "border-red-500" : ""}
              />
              <FieldError error={errors.fechaAsesoriaConsentimiento} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Person not capable of providing consent</Label>
              <div className="flex items-center gap-2 h-9">
                <input
                  type="checkbox"
                  id="personaNoCapazConsentir"
                  {...register("personaNoCapazConsentir")}
                  className="rounded border-input w-4 h-4"
                />
                <label htmlFor="personaNoCapazConsentir" className="text-xs text-muted-foreground cursor-pointer">
                  Marcar si la persona no puede proveer consentimiento
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Se Informó a la PdI que la Información Personal Básica Puede Ser Compartida <RequiredMark />
              </Label>
              <Controller
                name="informadaCompartirBasica"
                control={control}
                render={({ field }) => (
                  <Select {...field} className={errors.informadaCompartirBasica ? "border-red-500" : ""}>
                    <option value="">Seleccionar...</option>
                    {SI_NO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                )}
              />
              <FieldError error={errors.informadaCompartirBasica} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Puede Firmar</Label>
              <Controller
                name="puedeFirmar"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Seleccionar...</option>
                    {SI_NO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Consent Provider</Label>
              <Input {...register("consentProvider")} placeholder="Nombre del proveedor de consentimiento" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Acepta Compartir Datos Personales <RequiredMark />
              </Label>
              <Controller
                name="aceptaCompartirPersonales"
                control={control}
                render={({ field }) => (
                  <Select {...field} className={errors.aceptaCompartirPersonales ? "border-red-500" : ""}>
                    <option value="">Seleccionar...</option>
                    {SI_NO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                )}
              />
              <FieldError error={errors.aceptaCompartirPersonales} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name – Consent Provider (Registered)</Label>
              <Input {...register("nameConsentRegistrado")} placeholder="Nombre del proveedor registrado" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                Acepta Compartir Vulnerabilidades Evaluadas <RequiredMark />
              </Label>
              <Controller
                name="aceptaCompartirVulnerabilidades"
                control={control}
                render={({ field }) => (
                  <Select {...field} className={errors.aceptaCompartirVulnerabilidades ? "border-red-500" : ""}>
                    <option value="">Seleccionar...</option>
                    {SI_NO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                )}
              />
              <FieldError error={errors.aceptaCompartirVulnerabilidades} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name – Consent Provider (Other)</Label>
              <Input {...register("nameConsentOtro")} placeholder="Nombre de otro proveedor de consentimiento" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Acuerdo (Asentimiento) del NNA</Label>
              <Controller
                name="acuerdoNNA"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Seleccionar...</option>
                    {SI_NO_NA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </Select>
                )}
              />
            </div>
          </FormRow>
        </SectionCard>

        {/* ═══ 9. PROPIEDADES ══════════════════════════════════════════════════ */}
        <SectionCard icon={Clipboard} title="Propiedades" defaultOpen={true}>
          <FormRow cols={2}>
            {/* Fecha de creación */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fecha de creación</Label>
              <div className="relative">
                <Input
                  value={formatPropertyDate(currentDoc?.creadoEn)}
                  readOnly
                  disabled
                  className="bg-muted/50 cursor-not-allowed text-xs pr-8 text-muted-foreground"
                />
                <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
              </div>
            </div>

            {/* Fecha de modificación */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Fecha de modificación</Label>
              <div className="relative">
                <Input
                  value={formatPropertyDate(currentDoc?.modificadoEn)}
                  readOnly
                  disabled
                  className="bg-muted/50 cursor-not-allowed text-xs pr-8 text-muted-foreground"
                />
                <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
              </div>
            </div>

            {/* Creado por */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Creado por</Label>
              <div className="relative">
                <Input
                  value={currentDoc?.creadoPor || "—"}
                  readOnly
                  disabled
                  className="bg-muted/50 cursor-not-allowed text-xs pr-8 text-muted-foreground"
                />
                <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
              </div>
            </div>

            {/* Modificado por */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Modificado por</Label>
              <div className="relative">
                <Input
                  value={currentDoc?.modificadoPor || "—"}
                  readOnly
                  disabled
                  className="bg-muted/50 cursor-not-allowed text-xs pr-8 text-muted-foreground"
                />
                <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/50" />
              </div>
            </div>
          </FormRow>
        </SectionCard>

        {/* ─── Footer Buttons ──────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 pt-2 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/documents")}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[140px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? "Guardar Cambios" : "Guardar Individuo"}
          </Button>
        </div>
      </form>
    </div>
  );
}
