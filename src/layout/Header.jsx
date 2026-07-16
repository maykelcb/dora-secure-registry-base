import { LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useEffect } from "react";

export default function Header() {
  const logout = useAuthStore((state) => state.logout);
  const { theme, toggleTheme } = useSettingsStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 shadow-sm z-10 relative">
      <div className="flex items-center md:hidden">
        <img src="/logo.jpg" alt="Logo" className="w-5 h-5 mr-2 object-contain" />
        <h1 className="text-xl font-bold font-serif text-primary">RAHU</h1>
      </div>
      <div className="hidden md:flex items-center text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-900">
        Modo Seguro Offline Activo
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
        <Button variant="outline" size="sm" onClick={logout} className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
          <LogOut className="w-4 h-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>
    </header>
  );
}
