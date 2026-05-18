import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, ArrowLeft, AlertCircle, Info } from "lucide-react";
import { useDocumentsStore } from "@/store/documentsStore";
import { DOCUMENT_MAP, COUNTRIES, DOCUMENT_STATUSES, AUTHORITY_TYPES } from "@/utils/constants";
import { documentSchema } from "@/utils/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { isBefore, startOfDay } from "date-fns";

export default function DocumentFormView() {
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
    }
  });

  const watchCategoria = watch("categoriaDocumento");
  const watchTipo = watch("tipoDocumento");
  const watchEstatus = watch("estatus");
  const watchFechaVencimiento = watch("fechaVencimiento");

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
    // Clean up empty strings to null for dates
    if (!data.fechaEmision) data.fechaEmision = null;
    if (!data.fechaVencimiento) data.fechaVencimiento = null;
    
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
          {isEditing ? "Editar Documento" : "Registrar Nuevo Documento"}
        </h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* SECCIÓN A */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sección A: Clasificación del Documento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Categoría del Documento *</Label>
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
              <Label>Tipo de Documento *</Label>
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
            <CardTitle className="text-lg">Sección B: Detalles del Documento</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nombre del Documento {mappingInfo?.nombreObligatorio ? "*" : ""}</Label>
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
              <Label>Estatus del Documento *</Label>
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
            <CardTitle className="text-lg">Sección C: Metadatos Adicionales</CardTitle>
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
            {isEditing ? "Guardar Cambios" : "Registrar Documento"}
          </Button>
        </div>
      </form>
    </div>
  );
}
