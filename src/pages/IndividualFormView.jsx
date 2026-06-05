import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, ArrowLeft, AlertCircle, Info } from "lucide-react";
import { useDocumentsStore, generateGrupoRegistro } from "@/store/documentsStore";
import { DOCUMENT_MAP, COUNTRIES, DOCUMENT_STATUSES, AUTHORITY_TYPES } from "@/utils/constants";
import { documentSchema } from "@/utils/validators";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { isBefore, startOfDay } from "date-fns";

const MARITAL_STATUS_OPTIONS = [
  "Soltero/a",
  "Casado/a",
  "Divorciado/a",
  "Viudo/a",
  "Unión Libre",
];

const GENDER_OPTIONS = [
  "Masculino",
  "Femenino",
  "No binario",
  "Otro",
  "Prefiero no decir",
];

const STUDY_STATUS_OPTIONS = [
  "Graduado",
  "No Graduado",
];

const RELATION_WITH_PF_OPTIONS = [
  "Punto Focal",
  "Esposa",
  "Esposo",
  "Hijo/a",
  "Madre",
  "Padre",
  "Hermano/a",
  "Sobrino/a",
  "Tío/a",
  "Primo/a",
  "Abuelo/a",
  "Nieto/a",
  "Otro familiar",
];

export default function IndividualFormView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { documents, addDocument, updateDocument } = useDocumentsStore();
  const isEditing = !!id;

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      paisEmision: "Perú",
      estatus: "Vigente",
      tipoAutoridad: "Government / Gobierno",
      fechaNacimiento: null,
      paisNacimiento: "Perú",
      departamentoNacimiento: "",
      fechaIngresoPais: null,
      estadoCivil: "Soltero/a",
      genero: "Masculino",
      gradoEstudio: "",
      estadoEstudios: "Graduado",
      relacionConPF: "Punto Focal",
      grupoRegistro: "",
    }
  });

  const watchCategoria = watch("categoriaDocumento");
  const watchTipo = watch("tipoDocumento");
  const watchEstatus = watch("estatus");
  const watchRelation = watch("relacionConPF");
  const watchFechaVencimiento = watch("fechaVencimiento");

  const existingGroupIds = useMemo(() => {
    return [...new Set(documents.filter(doc => doc.grupoRegistro).map(doc => doc.grupoRegistro))];
  }, [documents]);

  // Filter types based on category
  const availableTypes = useMemo(() => {
    if (!watchCategoria) return [];
    return [...new Set(DOCUMENT_MAP.filter(d => d.categoria === watchCategoria).map(d => d.tipo))];
  }, [watchCategoria]);

  // Find mapping info
  const mappingInfo = useMemo(() => {
    if (!watchCategoria || !watchTipo) return null;
    return DOCUMENT_MAP.find(d => d.categoria === watchCategoria && d.tipo === watchTipo);
  }, [watchCategoria, watchTipo]);

  // Load data if editing
  useEffect(() => {
    if (isEditing) {
      const doc = documents.find(d => d.id === id);
      if (doc) {
        Object.keys(doc).forEach(key => {
          if (key === 'fechaVencimiento' || key === 'fechaEmision') {
            setValue(key, doc[key] ? doc[key].split('T')[0] : '');
          } else {
            setValue(key, doc[key]);
          }
        });
      } else {
        navigate("/documents");
      }
    }
  }, [id, isEditing, documents, setValue, navigate]);

  // Reset type when category changes
  useEffect(() => {
    if (!isEditing && watchCategoria) {
      setValue("tipoDocumento", "");
    }
  }, [watchCategoria, setValue, isEditing]);

  // Autocomplete names for travel authorizations
  useEffect(() => {
    if (mappingInfo?.nombreSugerido) {
      setValue("nombreDocumento", mappingInfo.nombreSugerido);
    }
  }, [mappingInfo, setValue]);

  // Date warnings
  const showDateWarning = useMemo(() => {
    if (!watchFechaVencimiento || watchEstatus !== "Vigente") return false;
    const today = startOfDay(new Date());
    const expiry = startOfDay(new Date(watchFechaVencimiento));
    return isBefore(expiry, today);
  }, [watchFechaVencimiento, watchEstatus]);

  const onSubmit = (data) => {
    // Clean up empty strings to null for optional dates
    if (!data.fechaEmision) data.fechaEmision = null;
    if (!data.fechaVencimiento) data.fechaVencimiento = null;
    if (!data.fechaNacimiento) data.fechaNacimiento = null;
    if (!data.fechaIngresoPais) data.fechaIngresoPais = null;

    if (!data.relacionConPF) data.relacionConPF = "Punto Focal";
    if (!data.grupoRegistro) data.grupoRegistro = null;
    if (data.relacionConPF === "Punto Focal" && !data.grupoRegistro) {
      data.grupoRegistro = generateGrupoRegistro();
    }

    // If lost, clear expiry
    if (data.estatus === "Lost / Perdido") {
      data.fechaVencimiento = null;
    }

    if (isEditing) {
      updateDocument(id, data);
    } else {
      addDocument(data);
    }
    navigate("/documents");
  };

  const categories = [...new Set(DOCUMENT_MAP.map(d => d.categoria))];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <h2 className="text-2xl font-bold font-serif">
          {isEditing ? "Editar Registro de Individuos" : "Registrar Individuos"}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* SECCIÓN A */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sección A: Clasificación del Individuo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Categoría del Registro *</Label>
              <Controller
                name="categoriaDocumento"
                control={control}
                render={({ field }) => (
                  <Select {...field} className={errors.categoriaDocumento ? "border-destructive" : ""}>
                    <option value="">Seleccione una categoría</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                )}
              />
              {errors.categoriaDocumento && <p className="text-xs text-destructive">{errors.categoriaDocumento.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Registro *</Label>
              <Controller
                name="tipoDocumento"
                control={control}
                render={({ field }) => (
                  <Select {...field} disabled={!watchCategoria} className={errors.tipoDocumento ? "border-destructive" : ""}>
                    <option value="">Seleccione un tipo</option>
                    {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </Select>
                )}
              />
              {errors.tipoDocumento && <p className="text-xs text-destructive">{errors.tipoDocumento.message}</p>}
            </div>
            
            {mappingInfo?.instruccion && (
              <div className="col-span-1 md:col-span-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md flex gap-3 text-sm text-blue-800 dark:text-blue-300">
                <Info className="w-5 h-5 shrink-0" />
                <p>{mappingInfo.instruccion}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECCIÓN B */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sección B: Detalles del Individuo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nombre del Registro {mappingInfo?.nombreObligatorio ? "*" : ""}</Label>
              <Input 
                {...register("nombreDocumento")} 
                placeholder={mappingInfo?.nombreSugerido || "Ej. Carné de identidad..."}
              />
              {errors.nombreDocumento && <p className="text-xs text-destructive">{errors.nombreDocumento.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Número (Opcional)</Label>
              <Input {...register("numero")} placeholder="Ej. 123456789" />
              {errors.numero && <p className="text-xs text-destructive">{errors.numero.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Estatus del Registro *</Label>
              <Controller
                name="estatus"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    {DOCUMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>País de Emisión *</Label>
              <Controller
                name="paisEmision"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Autoridad Emisora *</Label>
              <Controller
                name="tipoAutoridad"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    {AUTHORITY_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de Vencimiento</Label>
              <Input 
                type="date" 
                {...register("fechaVencimiento")} 
                disabled={watchEstatus === "Lost / Perdido"}
                className={watchEstatus === "Lost / Perdido" ? "opacity-50" : ""}
              />
              {errors.fechaVencimiento && <p className="text-xs text-destructive">{errors.fechaVencimiento.message}</p>}
              {showDateWarning && (
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  La fecha ya pasó. Considera cambiar estatus a Expirado.
                </p>
              )}
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label>Descripción / Comentario {mappingInfo?.comentarioObligatorio ? "*" : ""}</Label>
              <textarea 
                {...register("descripcion")}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={mappingInfo?.comentarioObligatorio ? "Especificar detalles obligatorios aquí..." : "Comentarios adicionales (opcional)"}
              />
              {errors.descripcion && <p className="text-xs text-destructive">{errors.descripcion.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* SECCIÓN C */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sección C: Datos del Titular</CardTitle>
            <CardDescription>Información personal de la persona titular del registro.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Fecha de Nacimiento</Label>
              <Input type="date" {...register("fechaNacimiento")} />
            </div>

            <div className="space-y-2">
              <Label>País de Nacimiento</Label>
              <Controller
                name="paisNacimiento"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Departamento de Nacimiento</Label>
              <Input {...register("departamentoNacimiento")} placeholder="Ej. Lima" />
            </div>

            <div className="space-y-2">
              <Label>Fecha de ingreso al país</Label>
              <Input type="date" {...register("fechaIngresoPais")} />
            </div>

            <div className="space-y-2">
              <Label>Estado civil</Label>
              <Controller
                name="estadoCivil"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    {MARITAL_STATUS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Género</Label>
              <Controller
                name="genero"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    {GENDER_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Grado de estudio</Label>
              <Input {...register("gradoEstudio")} placeholder="Ej. Licenciatura en Derecho" />
            </div>

            <div className="space-y-2">
              <Label>Estado de estudios</Label>
              <Controller
                name="estadoEstudios"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    {STUDY_STATUS_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Relación con el PF</Label>
              <Controller
                name="relacionConPF"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    {RELATION_WITH_PF_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                  </Select>
                )}
              />
            </div>

            {watchRelation === "Punto Focal" ? (
              <div className="space-y-2 md:col-span-2">
                <Label>ID de Registro de Individuos</Label>
                <Input
                  value={watch("grupoRegistro") || "Se generará automáticamente al guardar"}
                  readOnly
                />
              </div>
            ) : (
              <div className="space-y-2 md:col-span-2">
                <Label>Grupo de Registro</Label>
                <Controller
                  name="grupoRegistro"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <option value="">Seleccione un grupo existente</option>
                      {existingGroupIds.map(group => (
                        <option key={group} value={group}>{group}</option>
                      ))}
                    </Select>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sección D: Metadatos Adicionales</CardTitle>
            <CardDescription>Información complementaria del lugar de expedición.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Lugar de Emisión (Opcional)</Label>
              <Input {...register("lugarEmision")} placeholder="Ciudad, Estado..." />
            </div>

            <div className="space-y-2">
              <Label>Fecha de Emisión (Opcional)</Label>
              <Input type="date" {...register("fechaEmision")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate("/documents")}>
            Cancelar
          </Button>
          <Button type="submit">
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? "Guardar Cambios" : "Registrar Individuos"}
          </Button>
        </div>
      </form>
    </div>
  );
}
