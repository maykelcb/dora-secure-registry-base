import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Settings, FilePlus, Users, ClipboardCheck, ShieldCheck, X } from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuthStore, ADMIN_EMAILS } from "@/store/authStore";

export default function Sidebar({ open = false, onClose }) {
  const currentEmail = useAuthStore((state) => state.currentEmail);
  const isAdmin = currentEmail && ADMIN_EMAILS.includes(currentEmail.toLowerCase());

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
    { to: "/recepciones", icon: ClipboardCheck, label: "Recepciones", end: true },
    { to: "/documents", icon: FileText, label: "Registro de Individuos", end: true },
    { to: "/documents/new", icon: FilePlus, label: "Registrar Individuos" },
    { to: "/groups", icon: Users, label: "Grupo de Registro" },
    ...(isAdmin ? [{ to: "/admin", icon: ShieldCheck, label: "Panel de Admin" }] : []),
    { to: "/settings", icon: Settings, label: "Configuración" },
  ];

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r bg-card flex flex-col h-full shadow-sm transition-transform duration-300 md:static md:translate-x-0 md:flex",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b">
          <div className="flex items-center">
            <img src="/logo.jpg" alt="Logo" className="w-6 h-6 mr-2 object-contain" />
            <h1 className="text-2xl font-bold font-serif text-primary tracking-tight">RAHU</h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t text-xs text-center text-muted-foreground">
          RAHU (Red de asistencia humanitaria) <br/>
          &copy; {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
}
