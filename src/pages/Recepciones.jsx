import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentsStore } from "@/store/documentsStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Filter, Plus, RefreshCw, LayoutList, BarChart2,
  Eye, Edit, Trash2, ChevronDown, Columns, SlidersHorizontal,
  Share2, MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const ESTATUS_COLORS = {
  "Activo": "success",
  "Inactivo": "muted",
  "Pendiente": "warning",
  "Cerrado": "destructive",
};

export default function Recepciones() {
  const { documents, loadDocuments, deleteDocument } = useDocumentsStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [showGraph, setShowGraph] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const activeDocs = useMemo(() => documents.filter(d => !d.eliminado), [documents]);

  // Map documents to "Recepciones" format
  const recepciones = useMemo(() => {
    return activeDocs.map((doc, idx) => ({
      id: doc.id,
      estatus: "Activo",
      idRecepcion: `CGU-26-RCP-${String(101 + idx).padStart(3, "0")}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      nombreCompleto: doc.nombreCompleto || doc.nombreDocumento || "Sin nombre",
      numero: doc.numero || `${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      fechaCreacion: doc.creadoEn ? format(new Date(doc.creadoEn), "M/d/yyyy H:mm") : "—",
      tipoAcceso: doc.tipoRegistro || "Registro",
      tamanoFamilia: doc.tamanoFamilia || Math.floor(Math.random() * 5) + 1,
      edad: doc.edad || "—",
      sexo: doc.sexo === "Femenino" ? "Fe" : doc.sexo === "Masculino" ? "M" : "—",
      raw: doc,
    }));
  }, [activeDocs]);

  const filtered = useMemo(() => {
    if (!searchTerm) return recepciones;
    const q = searchTerm.toLowerCase();
    return recepciones.filter(r =>
      r.nombreCompleto.toLowerCase().includes(q) ||
      r.idRecepcion.toLowerCase().includes(q) ||
      r.tipoAcceso.toLowerCase().includes(q)
    );
  }, [recepciones, searchTerm]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  const handleDelete = (id) => {
    if (window.confirm("¿Está seguro de eliminar esta recepción?")) {
      deleteDocument(id);
    }
  };

  return (
    <div className="space-y-0 animate-in fade-in duration-300 h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 pb-3 border-b mb-4 flex-wrap">
        <Button variant="ghost" size="sm" className="text-xs gap-1.5 font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <LayoutList className="w-3.5 h-3.5" />
          Vista centrada
        </Button>
        <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => setShowGraph(!showGraph)}>
          <BarChart2 className="w-3.5 h-3.5" />
          Mostrar gráfico
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button size="sm" className="text-xs gap-1.5" onClick={() => navigate("/documents/new")}>
          <Plus className="w-3.5 h-3.5" />
          Nuevo
        </Button>
        <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => loadDocuments()}>
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </Button>
        <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground">
          <Eye className="w-3.5 h-3.5" />
          ConvertToRegistration...
        </Button>
        <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700">
          <Eye className="w-3.5 h-3.5" />
          Visualizar esta vista
        </Button>
        <Button variant="ghost" size="icon" className="w-7 h-7 text-muted-foreground ml-auto">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground hover:text-foreground border">
          <Share2 className="w-3.5 h-3.5" />
          Compartir
          <ChevronDown className="w-3 h-3" />
        </Button>
      </div>

      {/* Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Recepciones activas</h2>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Graph placeholder */}
      {showGraph && (
        <div className="bg-card rounded-lg border p-6 mb-4 flex items-center justify-center h-40 text-muted-foreground text-sm">
          <BarChart2 className="w-8 h-8 mr-3 opacity-30" />
          Gráfico de recepciones (próximamente)
        </div>
      )}

      {/* Table */}
      <div className="flex-1 bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 text-xs">
                <TableHead className="w-8 py-2">
                  <input type="checkbox" className="rounded border-input" />
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Estatus <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">ID de Recepci... <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Nombre Compl... <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Número... <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Fecha de cr... <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Tipo de Acc... <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Tamaño d... <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Edad <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold">
                  <div className="flex items-center gap-1">Se <ChevronDown className="w-3 h-3" /></div>
                </TableHead>
                <TableHead className="py-2 text-xs font-semibold text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-32 text-center text-muted-foreground text-sm">
                    No se encontraron recepciones activas.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((rec) => (
                  <TableRow key={rec.id} className="hover:bg-muted/20 text-sm">
                    <TableCell className="py-2">
                      <input type="checkbox" className="rounded border-input" />
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge variant="success" className="text-xs font-normal px-2">{rec.estatus}</Badge>
                    </TableCell>
                    <TableCell className="py-2">
                      <Link to={`/documents/${rec.id}`} className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-xs">
                        {rec.idRecepcion.slice(0, 15)}...
                      </Link>
                    </TableCell>
                    <TableCell className="py-2 font-medium max-w-[160px] truncate" title={rec.nombreCompleto}>
                      {rec.nombreCompleto.length > 18 ? rec.nombreCompleto.slice(0, 18) + "..." : rec.nombreCompleto}
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground text-xs">{rec.numero}</TableCell>
                    <TableCell className="py-2 text-xs">{rec.fechaCreacion}</TableCell>
                    <TableCell className="py-2 text-xs">{rec.tipoAcceso}</TableCell>
                    <TableCell className="py-2 text-center">{rec.tamanoFamilia}</TableCell>
                    <TableCell className="py-2 text-center">{rec.edad}</TableCell>
                    <TableCell className="py-2 text-center">{rec.sexo}</TableCell>
                    <TableCell className="py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="w-7 h-7" asChild title="Ver">
                          <Link to={`/documents/${rec.id}`}><Eye className="w-3.5 h-3.5 text-blue-600" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" asChild title="Editar">
                          <Link to={`/documents/edit/${rec.id}`}><Edit className="w-3.5 h-3.5 text-orange-500" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => handleDelete(rec.id)} title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
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
          <span>Filas: {filtered.length}</span>
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
