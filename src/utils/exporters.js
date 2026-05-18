import * as XLSX from "xlsx";
import { format } from "date-fns";

/**
 * Normaliza los datos antes de exportar
 */
const prepareDataForExport = (data) => {
  return data.map(doc => ({
    "Categoría": doc.categoriaDocumento,
    "Tipo de Documento": doc.tipoDocumento,
    "Nombre del Documento": doc.nombreDocumento || "-",
    "Número": doc.numero || "-",
    "Estatus": doc.estatus,
    "Autoridad": doc.tipoAutoridad,
    "País": doc.paisEmision,
    "Lugar": doc.lugarEmision || "-",
    "Fecha Emisión": doc.fechaEmision ? format(new Date(doc.fechaEmision), "dd/MM/yyyy") : "-",
    "Fecha Vencimiento": doc.fechaVencimiento ? format(new Date(doc.fechaVencimiento), "dd/MM/yyyy") : "-",
    "Descripción": doc.descripcion || "-",
    "Fecha de Registro": format(new Date(doc.creadoEn), "dd/MM/yyyy HH:mm")
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
