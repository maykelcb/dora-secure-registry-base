import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentsStore } from "@/store/documentsStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilePlus, FileText, FileWarning, AlertTriangle, FileX, ChevronRight, Bell, Eye, EyeOff } from "lucide-react";
import { format, differenceInDays, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

export default function Dashboard() {
  const { documents, loadDocuments, isLoading } = useDocumentsStore();
  const navigate = useNavigate();
  const [alertsDismissed, setAlertsDismissed] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const activeDocs = useMemo(() => documents.filter(d => !d.eliminado), [documents]);

  const metrics = useMemo(() => {
    const total = activeDocs.length;
    const vigentes = activeDocs.filter(d => d.estatus === "Vigente").length;
    const expirados = activeDocs.filter(d => d.estatus === "Expired / Expirado").length;
    const perdidos = activeDocs.filter(d => d.estatus === "Lost / Perdido").length;
    return { total, vigentes, expirados, perdidos };
  }, [activeDocs]);

  const expiringDocs = useMemo(() => {
    const today = startOfDay(new Date());
    return activeDocs.filter(d => {
      if (d.estatus !== "Vigente" || !d.fechaVencimiento) return false;
      const expiryDate = startOfDay(new Date(d.fechaVencimiento));
      const daysLeft = differenceInDays(expiryDate, today);
      return daysLeft >= 0 && daysLeft <= 30; // Expiring in next 30 days
    }).map(d => {
      const daysLeft = differenceInDays(new Date(d.fechaVencimiento), today);
      return { ...d, daysLeft };
    }).sort((a, b) => a.daysLeft - b.daysLeft);
  }, [activeDocs]);

  const alreadyExpiredDocs = useMemo(() => {
    const today = startOfDay(new Date());
    return activeDocs.filter(d => {
      if (d.estatus !== "Vigente" || !d.fechaVencimiento) return false;
      const expiryDate = startOfDay(new Date(d.fechaVencimiento));
      return isBefore(expiryDate, today); // System says Vigente but date has passed
    });
  }, [activeDocs]);

  const last5 = useMemo(() => {
    return [...activeDocs]
      .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn))
      .slice(0, 5);
  }, [activeDocs]);

  const MetricCard = ({ title, value, icon: Icon, colorClass }) => (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold font-serif">{value}</h3>
        </div>
        <div className={`p-4 rounded-full ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-serif tracking-tight">Panel Principal</h2>
          <p className="text-muted-foreground mt-1">Resumen general del registro de individuos.</p>
        </div>
        <Button onClick={() => navigate("/documents/new")} size="lg" className="shadow-md">
          <FilePlus className="w-5 h-5 mr-2" />
          Registrar Individuos
        </Button>
      </div>

      {/* Alertas */}
      {(!alertsDismissed && (expiringDocs.length > 0 || alreadyExpiredDocs.length > 0)) && (
        <Card className="border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20 shadow-none">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <CardTitle className="text-lg text-orange-800 dark:text-orange-300">Alertas de Vencimiento</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setAlertsDismissed(true)} className="text-orange-600 hover:text-orange-800 hover:bg-orange-200/50">
              Ocultar alertas
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {alreadyExpiredDocs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-md border border-red-100 dark:border-red-900/30">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="text-sm font-medium">{doc.nombreDocumento || doc.tipoDocumento}</p>
                    <p className="text-xs text-muted-foreground">Venció el {format(new Date(doc.fechaVencimiento), "dd MMM yyyy", { locale: es })}</p>
                  </div>
                </div>
                <Badge variant="destructive">Expirado</Badge>
              </div>
            ))}
            {expiringDocs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-md border border-orange-100 dark:border-orange-900/30">
                <div className="flex items-center space-x-3">
                  <FileWarning className={`w-5 h-5 ${doc.daysLeft <= 7 ? "text-destructive" : "text-orange-500"}`} />
                  <div>
                    <p className="text-sm font-medium">{doc.nombreDocumento || doc.tipoDocumento}</p>
                    <p className="text-xs text-muted-foreground">Vence el {format(new Date(doc.fechaVencimiento), "dd MMM yyyy", { locale: es })}</p>
                  </div>
                </div>
                <Badge variant={doc.daysLeft <= 7 ? "destructive" : "warning"}>
                  Faltan {doc.daysLeft} {doc.daysLeft === 1 ? 'día' : 'días'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Individuos" value={metrics.total} icon={FileText} colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" />
        <MetricCard title="Individuos Vigentes" value={metrics.vigentes} icon={FileText} colorClass="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" />
        <MetricCard title="Individuos Expirados" value={metrics.expirados} icon={AlertTriangle} colorClass="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" />
        <MetricCard title="Individuos Perdidos" value={metrics.perdidos} icon={FileX} colorClass="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" />
      </div>

      {/* Recent Records */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Últimos 5 Individuos</CardTitle>
            <CardDescription>Individuos añadidos recientemente al sistema.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/documents">
              Ver todos <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {last5.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto text-muted/50 mb-3" />
              <p>No hay registros aún.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Registro</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {last5.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.nombreDocumento || doc.tipoDocumento.split(" / ")[0]}</TableCell>
                    <TableCell className="text-muted-foreground">{doc.categoriaDocumento.split(" / ")[0]}</TableCell>
                    <TableCell>
                      {doc.fechaVencimiento ? format(new Date(doc.fechaVencimiento), "dd/MM/yyyy") : "N/A"}
                    </TableCell>
                    <TableCell>
                      {doc.estatus === "Vigente" && <Badge variant="success">Vigente</Badge>}
                      {doc.estatus === "Expired / Expirado" && <Badge variant="destructive">Expirado</Badge>}
                      {doc.estatus === "Lost / Perdido" && <Badge variant="muted">Perdido</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/documents/${doc.id}`}>
                          <Eye className="w-4 h-4 mr-1" /> Ver
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
