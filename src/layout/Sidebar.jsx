import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Settings, ShieldAlert, FilePlus } from "lucide-react";
import { cn } from "@/utils/cn";

export default function Sidebar() {
  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/documents", icon: FileText, label: "Documentos" },
    { to: "/documents/new", icon: FilePlus, label: "Registrar Documento" },
    { to: "/settings", icon: Settings, label: "Configuración" },
  ];

  return (
    <aside className="w-64 border-r bg-card hidden md:flex flex-col h-full shadow-sm z-10 relative">
      <div className="h-16 flex items-center px-6 border-b">
        <ShieldAlert className="w-6 h-6 text-primary mr-2" />
        <h1 className="text-2xl font-bold font-serif text-primary tracking-tight">DORA</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
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
        DORA Secure Registry <br/>
        &copy; {new Date().getFullYear()}
      </div>
    </aside>
  );
}
