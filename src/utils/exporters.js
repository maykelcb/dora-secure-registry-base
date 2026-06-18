import * as XLSX from "xlsx";
import { format } from "date-fns";

/**
 * Normaliza los datos antes de exportar
 */
const prepareDataForExport = (data) => {
  return data.map(doc => ({
    "ID Individual": doc.idIndividual || `CGU-${doc.id?.slice(0, 5) || "00000"}`,
    "Grupo de Registro": doc.grupoRegistro || "-",
    "Nombre Completo": doc.nombreCompleto || doc.nombreDocumento || "-",
    "Sexo / Género": doc.sexo || doc.genero || "-",
    "Edad": doc.edad || "-",
    "País de Origen": doc.paisOrigen || doc.paisNacimiento || "-",
    "Estatus Legal": doc.estatusLegal || doc.estatus || "-",
    "Relación con PF": doc.relacionConPF || "Punto Focal (Líder)",
    "Documento de Identidad": doc.documentoIdentidad || doc.tipoDocumento || "-",
    "Número de Documento": doc.numeroDocumento || doc.numero || "-",
    "Teléfono": doc.telefono || "-",
    "Correo Electrónico": doc.email || "-",
    "Dirección Actual": doc.direccionActual || "-",
    "Unidad de Operaciones": doc.unidadOperaciones || "-",
    "Fecha de Registro": doc.creadoEn ? format(new Date(doc.creadoEn), "dd/MM/yyyy HH:mm") : "-",
    "Creado Por": doc.creadoPor || "-",
    "Modificado Por": doc.modificadoPor || "-"
  }));
};

export const exportToExcel = (data, filename) => {
  const preparedData = prepareDataForExport(data);
  const worksheet = XLSX.utils.json_to_sheet(preparedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Documentos");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToCSV = (data, filename) => {
  const preparedData = prepareDataForExport(data);
  const worksheet = XLSX.utils.json_to_sheet(preparedData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  // Agregar BOM para UTF-8 (Excel lo necesita para abrir CSV con tildes)
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
