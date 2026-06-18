import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDocumentsStore } from "@/store/documentsStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FilePlus,
  FileText,
  FileWarning,
  AlertTriangle,
  ChevronRight,
  Bell,
  Eye,
  Users,
  UserCheck,
  UserX,
  Globe,
  MapPin
} from "lucide-react";
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
    
    const masculinos = activeDocs.filter(d => {
      const s = (d.sexo || d.genero || "").toLowerCase();
      return s === "masculino" || s === "m";
    }).length;

    const femeninos = activeDocs.filter(d => {
      const s = (d.sexo || d.genero || "").toLowerCase();
      return s === "femenino" || s === "f";
    }).length;

    const uniqueGroups = new Set(
      activeDocs
        .map(d => d.grupoRegistro || d.grupo)
        .filter(g => g && typeof g === "string" && g.trim() !== "")
    );
    const grupos = uniqueGroups.size;

    return { total, masculinos, femeninos, grupos };
  }, [activeDocs]);

  const paisesCount = useMemo(() => {
    const counts = {};
    activeDocs.forEach(d => {
      const pais = d.paisOrigen || d.paisNacimiento || "No especificado";
      counts[pais] = (counts[pais] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [activeDocs]);

  const getSexoBadge = (sexo) => {
    const s = (sexo || "").toLowerCase();
    if (s === "masculino" || s === "m") {
      return <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-300 dark:border-sky-900/50">Masculino</Badge>;
    }
    if (s === "femenino" || s === "f") {
      return <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/20 dark:text-pink-300 dark:border-pink-900/50">Femenino</Badge>;
    }
    return <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/20 dark:text-slate-300 dark:border-slate-900/50">{sexo || "No especificado"}</Badge>;
  };

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

  const MetricCard = ({ title, value, icon: Icon, colorClass, subtitle }) => (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold font-serif">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
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
                    <p className="text-xs text-muted-foreground">Venció el {doc.fechaVencimiento ? format(new Date(doc.fechaVencimiento), "dd MMM yyyy", { locale: es }) : "—"}</p>
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
                    <p className="text-xs text-muted-foreground">Vence el {doc.fechaVencimiento ? format(new Date(doc.fechaVencimiento), "dd MMM yyyy", { locale: es }) : "—"}</p>
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
        <MetricCard
          title="Total Individuos"
          value={metrics.total}
          icon={Users}
          colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
          subtitle="registros activos"
        />
        <MetricCard
          title="Masculinos"
          value={metrics.masculinos}
          icon={UserCheck}
          colorClass="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
        />
        <MetricCard
          title="Femeninos"
          value={metrics.femeninos}
          icon={UserX}
          colorClass="bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300"
        />
        <MetricCard
          title="Grupos de Registro"
          value={metrics.grupos}
          icon={FileText}
          colorClass="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
          subtitle="núcleos familiares"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Records */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Últimos Individuos Registrados</CardTitle>
              <CardDescription>Los 5 registros más recientes del sistema.</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/documents">
                Ver todos <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Cargando registros...</div>
            ) : last5.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto text-muted/50 mb-3" />
                <p>No hay individuos registrados aún.</p>
                <Button className="mt-4" onClick={() => navigate("/documents/new")}>
                  <FilePlus className="w-4 h-4 mr-2" /> Registrar primer individuo
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre Completo</TableHead>
                    <TableHead>Sexo</TableHead>
                    <TableHead>País de Origen</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {last5.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium max-w-[180px] truncate">
                        {doc.nombreCompleto || doc.nombreDocumento || "Sin nombre"}
                      </TableCell>
                      <TableCell>{getSexoBadge(doc.sexo || doc.genero)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {doc.paisOrigen || doc.paisNacimiento || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.creadoEn
                          ? format(new Date(doc.creadoEn), "dd/MM/yyyy", { locale: es })
                          : "—"}
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

        {/* Countries Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Países de Origen
            </CardTitle>
            <CardDescription>Top 5 países de los individuos registrados.</CardDescription>
          </CardHeader>
          <CardContent>
            {paisesCount.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <MapPin className="w-8 h-8 mx-auto opacity-30 mb-2" />
                Sin datos disponibles.
              </div>
            ) : (
              <div className="space-y-3">
                {paisesCount.map(([pais, count]) => (
                  <div key={pais} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">{pais}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="h-2 rounded-full bg-primary/20 w-20 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${Math.round((count / (activeDocs.length || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
