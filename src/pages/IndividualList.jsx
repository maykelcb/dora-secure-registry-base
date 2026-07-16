import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentsStore } from "@/store/documentsStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Plus, RefreshCw, Eye, Edit, Trash2, ChevronDown,
  Columns, SlidersHorizontal, MoreHorizontal, Download
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportToExcel, exportToCSV } from "@/utils/exporters";
import { useAuthStore, ADMIN_EMAILS } from "@/store/authStore";

export default function IndividualList() {
  const { documents, deleteDocument, loadDocuments } = useDocumentsStore();
  const navigate = useNavigate();
  const currentEmail = useAuthStore((state) => state.currentEmail);
  const isAdmin = Boolean(currentEmail && ADMIN_EMAILS.includes(currentEmail.toLowerCase()));
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const activeDocs = useMemo(() => documents.filter(d => !d.eliminado), [documents]);

  const filteredDocs = useMemo(() => {
    if (!searchTerm) return activeDocs;
    const q = searchTerm.toLowerCase();
    return activeDocs.filter(doc =>
      (doc.nombreCompleto || doc.nombreDocumento || "").toLowerCase().includes(q) ||
      (doc.idIndividual || "").toLowerCase().includes(q) ||
      (doc.grupoRegistro || "").toLowerCase().includes(q) ||
      (doc.paisOrigen || "").toLowerCase().includes(q)
    );
  }, [activeDocs, searchTerm]);

  const paginatedDocs = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredDocs.slice(start, start + itemsPerPage);
  }, [filteredDocs, page]);

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);

  const handleDelete = (id) => {
    if (window.confirm("¿Está seguro de que desea eliminar este individuo? Será enviado a la papelera.")) {
      deleteDocument(id);
    }
  };

  const handleExportExcel = () => {
    if (window.confirm("El archivo exportado NO estará encriptado. ¿Continuar?")) {
      exportToExcel(filteredDocs, `individuos_${format(new Date(), 'yyyy-MM-dd')}`);
    }
  };

  const handleExportCSV = () => {
    if (window.confirm("El archivo exportado NO estará encriptado. ¿Continuar?")) {
      exportToCSV(filteredDocs, `individuos_${format(new Date(), 'yyyy-MM-dd')}`);
    }
  };

  const getSexoLabel = (sexo) => {
    if (!sexo) return "—";
    if (sexo === "Femenino") return "Fe...";
    if (sexo === "Masculino") return "M...";
    return sexo.slice(0, 3) + "...";
  };

  const getEstatusLabel = (doc) => {
    if (doc.estatusLegal) return doc.estatusLegal.slice(0, 8) + "...";
    return "Otro d...";
  };

  return (
    <div className="space-y-0 animate-in fade-in duration-300 h-full flex flex-col">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Vista de Individuos Activos</h2>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" className="text-xs gap-1.5 text-green-700 dark:text-green-400 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20" onClick={handleExportExcel}>
                <Download className="w-3.5 h-3.5" /> Excel
              </Button>
              <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleExportCSV}>
                <Download className="w-3.5 h-3.5" /> CSV
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => loadDocuments()}>
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Columns className="w-3.5 h-3.5" />
            Editar columnas
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Editar filtros
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Búsqueda rápida"
              className="pl-8 h-8 text-xs w-48"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <Button size="sm" className="text-xs gap-1.5" onClick={() => navigate("/documents/new")}>
            <Plus className="w-3.5 h-3.5" />
            Nuevo
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-8 py-2">
                  <input type="checkbox" className="rounded border-input" />
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Esta... <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">ID Indivi... <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Grupo de... <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Nombre Compl... <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">País de Orig... <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Edad <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Sexo <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Estatus... <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Fecha d... <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Fecha d... <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="h-32 text-center text-muted-foreground text-sm">
                    No se encontraron individuos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDocs.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-muted/20 text-sm">
                    <TableCell className="py-2">
                      <input type="checkbox" className="rounded border-input" />
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Act...</span>
                    </TableCell>
                    <TableCell className="py-2">
                      <Link to={`/documents/${doc.id}`} className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs">
                        {`CGU-${doc.id?.slice(0, 5) || "00000"}...`}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2">
                      <Link to={`/documents/${doc.id}`} className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs">
                        {doc.grupoRegistro ? doc.grupoRegistro.slice(0, 10) + "..." : "—"}
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 font-medium max-w-[160px] truncate" title={doc.nombreCompleto || doc.nombreDocumento}>
                      {(doc.nombreCompleto || doc.nombreDocumento || "Sin nombre").slice(0, 20)}
                      {(doc.nombreCompleto || doc.nombreDocumento || "").length > 20 ? "..." : ""}
                    </TableCell>
                    <TableCell className="py-2 text-xs">{doc.paisOrigen || "—"}</TableCell>
                    <TableCell className="py-2 text-center text-xs">{doc.edad || "—"}</TableCell>
                    <TableCell className="py-2 text-xs">{getSexoLabel(doc.sexo)}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{getEstatusLabel(doc)}</TableCell>
                    <TableCell className="py-2 text-xs">
                      {doc.fechaRegistro ? format(new Date(doc.fechaRegistro), "M/d/yyyy") : 
                       doc.creadoEn ? format(new Date(doc.creadoEn), "M/d/yyyy") : "—"}
                    </TableCell>
                    <TableCell className="py-2 text-xs">
                      {doc.modificadoEn ? format(new Date(doc.modificadoEn), "M/d/yyyy") : "—"}
                    </TableCell>
                    <TableCell className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" asChild title="Ver">
                          <Link to={`/documents/${doc.id}`}><Eye className="w-3.5 h-3.5 text-blue-600" /></Link>
                        </Button>
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="icon" className="w-7 h-7" asChild title="Editar">
                              <Link to={`/documents/edit/${doc.id}`}><Edit className="w-3.5 h-3.5 text-orange-500" /></Link>
                            </Button>
                            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleDelete(doc.id)} title="Eliminar">
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t flex items-center justify-between bg-muted/10 text-xs text-muted-foreground">
          <span>Filas: {filteredDocs.length}{filteredDocs.length >= 5000 ? "+" : ""}</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Anterior
              </Button>
              <span>Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
