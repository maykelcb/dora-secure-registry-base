import * as z from "zod";

// We use superRefine to do conditional validations based on category/type
export const documentSchema = z.object({
  categoriaDocumento: z.string().min(1, "Debe seleccionar una categoría"),
  tipoDocumento: z.string().min(1, "Debe seleccionar un tipo de documento"),
  nombreDocumento: z.string().optional(),
  numero: z.string()
    .regex(/^[a-zA-Z0-9-]*$/, "Solo se permiten caracteres alfanuméricos y guiones")
    .optional(),
  estatus: z.string().min(1, "Debe seleccionar un estatus"),
  tipoAutoridad: z.string().min(1, "Debe seleccionar un tipo de autoridad"),
  paisEmision: z.string().min(1, "Debe seleccionar un país de emisión"),
  fechaEmision: z.string().optional().nullable(),
  fechaVencimiento: z.string().optional().nullable(),
  lugarEmision: z.string().optional(),
  descripcion: z.string().optional(),
  fechaNacimiento: z.string().optional().nullable(),
  paisNacimiento: z.string().optional(),
  departamentoNacimiento: z.string().optional(),
  fechaIngresoPais: z.string().optional().nullable(),
  estadoCivil: z.string().optional(),
  genero: z.string().optional(),
  gradoEstudio: z.string().optional(),
  estadoEstudios: z.string().optional(),
  relacionConPF: z.string().optional(),
  grupoRegistro: z.string().optional(),
}).superRefine((data, ctx) => {
  // Regla: Nombre de documento obligatorio para "Other documentation"
  if (data.categoriaDocumento.includes("Other documentation")) {
    if (!data.nombreDocumento || data.nombreDocumento.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Obligatorio: especificar el nombre del documento",
        path: ["nombreDocumento"],
      });
    }
  }

  // Regla: Descripción obligatoria para "Migration Card" (Carné de Extranjería)
  if (data.tipoDocumento && data.tipoDocumento.includes("Migration Card")) {
    if (!data.descripcion || data.descripcion.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Obligatorio: aclarar la calidad migratoria (Humanitaria, Especial Residente, etc.)",
        path: ["descripcion"],
      });
    }
  }

  // Validación de fechas
  if (data.fechaVencimiento && data.fechaEmision) {
    const start = new Date(data.fechaEmision);
    const end = new Date(data.fechaVencimiento);
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha de vencimiento no puede ser anterior a la emisión",
        path: ["fechaVencimiento"],
      });
    }
  }
});
