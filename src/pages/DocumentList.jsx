import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDocumentsStore } from "@/store/documentsStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportToExcel, exportToCSV } from "@/utils/exporters";

export default function DocumentList() {
  const { documents, deleteDocument, loadDocuments } = useDocumentsStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstatus, setFilterEstatus] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const activeDocs = useMemo(() => documents.filter(d => !d.eliminado), [documents]);

  const filteredDocs = useMemo(() => {
    return activeDocs.filter(doc => {
      const matchSearch = 
        (doc.nombreDocumento || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.numero || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.tipoDocumento || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchEstatus = filterEstatus ? doc.estatus === filterEstatus : true;
      const matchCategoria = filterCategoria ? doc.categoriaDocumento.includes(filterCategoria) : true;

      return matchSearch && matchEstatus && matchCategoria;
    });
  }, [activeDocs, searchTerm, filterEstatus, filterCategoria]);

  const paginatedDocs = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredDocs.slice(start, start + itemsPerPage);
  }, [filteredDocs, page]);

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este documento? Será enviado a la papelera.")) {
      deleteDocument(id);
    }
  };

  const handleExportExcel = () => {
    if (window.confirm("El archivo exportado NO estará encriptado. ¿Continuar?")) {
      exportToExcel(filteredDocs, `registros_documentos_${format(new Date(), 'yyyy-MM-dd')}`);
    }
  };

  const handleExportCSV = () => {
    if (window.confirm("El archivo exportado NO estará encriptado. ¿Continuar?")) {
      exportToCSV(filteredDocs, `registros_documentos_${format(new Date(), 'yyyy-MM-dd')}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-serif tracking-tight">Directorio de Documentos</h2>
          <p className="text-muted-foreground mt-1">
            Total filtrados: {filteredDocs.length} de {activeDocs.length} registros
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="text-green-700 dark:text-green-400 border-green-200 hover:bg-green-50 dark:hover:bg-green-900/20">
            <Download className="w-4 h-4 mr-2" /> Excel
          </Button>
          <Button asChild>
            <Link to="/documents/new">
              <Plus className="w-4 h-4 mr-2" /> Nuevo Registro
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, número o tipo..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 md:w-1/3">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={filterEstatus} onChange={(e) => setFilterEstatus(e.target.value)}>
            <option value="">Todos los Estatus</option>
            <option value="Vigente">Vigente</option>
            <option value="Expired / Expirado">Expirado</option>
            <option value="Lost / Perdido">Perdido</option>
          </Select>
        </div>
      </div>

      <div className="flex-1 bg-card rounded-xl border shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nombre del Documento</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    No se encontraron registros que coincidan con la búsqueda.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDocs.map(doc => (
                  <TableRow key={doc.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {doc.nombreDocumento || doc.tipoDocumento.split(" / ")[0]}
                    </TableCell>
                    <TableCell>{doc.numero || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={doc.categoriaDocumento}>
                      {doc.categoriaDocumento.split(" / ")[0]}
                    </TableCell>
                    <TableCell>{doc.paisEmision}</TableCell>
                    <TableCell>
                      {doc.fechaVencimiento ? format(new Date(doc.fechaVencimiento), "dd/MM/yyyy") : "N/A"}
                    </TableCell>
                    <TableCell>
                      {doc.estatus === "Vigente" && <Badge variant="success">Vigente</Badge>}
                      {doc.estatus === "Expired / Expirado" && <Badge variant="destructive">Expirado</Badge>}
                      {doc.estatus === "Lost / Perdido" && <Badge variant="muted">Perdido</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild title="Ver Detalle">
                          <Link to={`/documents/${doc.id}`}><Eye className="w-4 h-4 text-blue-600" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild title="Editar">
                          <Link to={`/documents/edit/${doc.id}`}><Edit className="w-4 h-4 text-orange-600" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} title="Eliminar">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Anterior
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
