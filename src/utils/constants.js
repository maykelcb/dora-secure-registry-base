export const DOCUMENT_MAP = [
  {
    nombre: "Cédula de identidad / Tarjeta de identidad / DNI",
    categoria: "Identity Documentation / Documentación de identidad",
    tipo: "National identity card / Tarjeta nacional de identidad",
    instruccion: "Se refiere a la cédula de identidad / carné de identidad o DNI emitidos por un país (normalmente el país de origen). DNI (PER) solo para hijos nacidos de al menos 1 padre de interés.",
    ejemplos: ["Cédula de identidad (VEN)", "DNI (PER)", "Tarjeta de identidad (COL)", "Cédula de ciudadanía (COL)"],
    comentarioObligatorio: false,
    soloSiNecesario: false
  },
  {
    nombre: "Carné de Extranjería (Calidad Migratoria Humanitaria / otras calidades)",
    categoria: "Identity Documentation / Documentación de identidad",
    tipo: "Migration Card / Tarjeta de Migración",
    instruccion: "Aclarar bajo comentario si se refiere al Carné de Extranjería otorgado por Calidad Migratoria Humanitaria, Especial Residente, Formación, Vulnerabilidad, Inversionista, entre otras.",
    comentarioObligatorio: true,
    soloSiNecesario: false
  },
  {
    nombre: "Carné de Extranjería otorgado a refugiados (convenios internacionales)",
    categoria: "Identity Documentation / Documentación de identidad",
    tipo: "Identity Document for refugee (issued by government) / Documento de identidad para persona refugiada",
    instruccion: "Solo para carné de extranjería brindado a personas refugiadas reconocidas por la Comisión Especial para los Refugiados (CEPR).",
    comentarioObligatorio: false,
    soloSiNecesario: false
  },
  {
    nombre: "Carné de solicitante de refugio (físico o virtual)",
    categoria: "Registration Documentation / Documentación de Registro",
    tipo: "Asylum seeker certificate (no event) / Certificado de solicitante de asilo",
    instruccion: "Carné de solicitante de refugio físico o virtual emitido por la CEPR.",
    comentarioObligatorio: false,
    soloSiNecesario: false
  },
  {
    nombre: "Autorización de Trabajo Virtual para solicitantes de refugio",
    categoria: "Permits and Related Documentation / Permisos y documentación relacionada",
    tipo: "Work permit / Permiso de trabajo",
    instruccion: "Autorización de trabajo virtual emitida por la CEPR a los solicitantes de refugio.",
    comentarioObligatorio: false,
    soloSiNecesario: false
  },
  {
    nombre: "CPP (Carné de Permiso Temporal de Permanencia)",
    categoria: "Permits and Related Documentation / Permisos y documentación relacionada",
    tipo: "Temporary Residence Permit / Permiso de Residencia Temporal",
    instruccion: "Se refiere al carné de permiso temporal de permanencia (CPP).",
    comentarioObligatorio: false,
    soloSiNecesario: false
  },
  {
    nombre: "Pasaporte nacional (país de origen)",
    categoria: "Travel Documentation / Documentación de Viaje",
    tipo: "National Passport / Pasaporte nacional",
    instruccion: "Se refiere al pasaporte nacional.",
    comentarioObligatorio: false,
    soloSiNecesario: false
  },
  {
    nombre: "Partida de nacimiento",
    categoria: "Birth Documentation / Documentación de nacimiento",
    tipo: "Birth Certificate / Certificado de nacimiento",
    instruccion: "Se refiere a la partida de nacimiento.",
    comentarioObligatorio: false,
    soloSiNecesario: false
  },
  {
    nombre: "Acta de nacido vivo",
    categoria: "Birth Documentation / Documentación de nacimiento",
    tipo: "Birth Notification / Notificación de nacimiento",
    instruccion: "Certificado de nacido vivo, también conocido como acta de nacido vivo.",
    comentarioObligatorio: false,
    soloSiNecesario: false
  },
  {
    nombre: "Certificado de defunción",
    categoria: "Death Documentation / Documentación de defunción",
    tipo: "Death certificate / Certificado de defunción",
    instruccion: "Adjuntar documento cuando se cierre el caso por defunción (si se tiene).",
    comentarioObligatorio: false,
    soloSiNecesario: false
  },
  {
    nombre: "Otros documentos de identidad del país de origen (ej. Carnet de la Patria)",
    categoria: "Other documentation",
    tipo: "Other complementary documentation",
    instruccion: "Registrar cuando la persona no tiene documentos de identidad legal. Especificar en 'nombre' el nombre del documento. OBLIGATORIO poner el nombre.",
    nombreObligatorio: true,
    comentarioObligatorio: false,
    soloSiNecesario: false
  },
  {
    nombre: "Visas",
    categoria: "Travel Documentation / Documentación de Viaje", // Added / Viaje to match categories
    tipo: "Visa",
    instruccion: "Incluye visa humanitaria, familiar de residente o turismo. Aclarar tipo de visa bajo nombre.",
    comentarioObligatorio: false,
    soloSiNecesario: false
  },
  {
    nombre: "Licencia de conducir",
    categoria: "Permits and Related Documentation / Permisos y documentación relacionada",
    tipo: "Driving license / Licencia de conducción",
    instruccion: "Solo necesario registrar si la persona no tiene ninguna otra documentación para demostrar su identidad.",
    comentarioObligatorio: false,
    soloSiNecesario: true
  },
  {
    nombre: "Denuncia policial",
    categoria: "Legal Documentation / Documentación legal",
    tipo: "Police letter / Carta de la Policía",
    instruccion: "Denuncia policial por pérdida de documentos. Solo registrar si necesario para la gestión de este caso.",
    comentarioObligatorio: false,
    soloSiNecesario: true
  },
  {
    nombre: "Certificados médico",
    categoria: "Health Documentation / Documentación de salud y sanidad",
    tipo: "Medical certificate/records / Certificado/registro médico",
    instruccion: "Certificados médicos relevantes al caso (comprobar alguna SPN). Solo registrar si necesario para la gestión de este caso.",
    comentarioObligatorio: false,
    soloSiNecesario: true
  },
  {
    nombre: "Certificado de matrimonio",
    categoria: "Marital Status Documentation / Documentación del estado civil",
    tipo: "Marriage certificate (no event) / Certificado de matrimonio",
    instruccion: "Certificados de matrimonio o unión civil. Solo registrar si necesario para la gestión de este caso.",
    comentarioObligatorio: false,
    soloSiNecesario: true
  },
  {
    nombre: "Constancia de registro consular",
    categoria: "Legal Documentation / Documentación legal",
    tipo: "Other legal document / Otro documento legal",
    instruccion: "Documento legal que emite la embajada de Venezuela que acredita la identidad.",
    comentarioObligatorio: false,
    soloSiNecesario: false
  },
  {
    nombre: "Autorización de viaje para menores de edad (Autorización Notarial)",
    categoria: "Other Documentation / Otra Documentación",
    tipo: "Other / Otro",
    instruccion: "Documento certificado notarialmente por el cual los padres autorizan el viaje de su hijo menor de edad dentro o fuera del territorio peruano. Especificar 'Autorización Notarial' en el campo nombre.",
    nombreSugerido: "Autorización Notarial",
    comentarioObligatorio: false,
    soloSiNecesario: false
  },
  {
    nombre: "Autorización de viaje para menores de edad (Autorización Consular)",
    categoria: "Other Documentation / Otra Documentación",
    tipo: "Other / Otro",
    instruccion: "Documento por el cual los padres que se encuentran en el extranjero autorizan el viaje de su hijo menor de edad fuera del territorio peruano. Especificar 'Autorización Consular' en el campo nombre.",
    nombreSugerido: "Autorización Consular",
    comentarioObligatorio: false,
    soloSiNecesario: false
  },
  {
    nombre: "Autorización de viaje para menores de edad (Autorización Judicial)",
    categoria: "Other Documentation / Otra Documentación",
    tipo: "Other / Otro",
    instruccion: "Documento solicitado al Juzgado de Familia cuando no hay acuerdo entre padres, padre ausente/desaparecido, o cuando no aplica la Autorización Notarial. Especificar 'Autorización Judicial' en el campo nombre.",
    nombreSugerido: "Autorización Judicial",
    comentarioObligatorio: false,
    soloSiNecesario: false
  }
];

export const COUNTRIES = [
  "Perú", "Venezuela", "Colombia", "Ecuador", "Chile", "Argentina", 
  "Bolivia", "Brasil", "Uruguay", "Paraguay", "México", "Haití", 
  "Cuba", "República Dominicana", "Nicaragua", "Honduras", "El Salvador", 
  "Guatemala", "Costa Rica", "Panamá", "Estados Unidos", "España", "Otro"
];

export const DOCUMENT_STATUSES = [
  { value: "Vigente", label: "Vigente", description: "Documentos no expirados o sin fecha de expiración" },
  { value: "Expired / Expirado", label: "Expired / Expirado", description: "Documento vencido" },
  { value: "Lost / Perdido", label: "Lost / Perdido", description: "La persona declara haber perdido el documento" }
];

export const AUTHORITY_TYPES = [
  { value: "Government / Gobierno", label: "Gobierno", description: "Documentos emitidos por el Gobierno y entidades públicas" },
  { value: "Private Entity / Entidad Privada", label: "Entidad Privada", description: "Documentos emitidos por instituciones privadas" }
];
