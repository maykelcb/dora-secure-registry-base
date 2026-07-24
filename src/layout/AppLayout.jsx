import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";

export default function AppLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20">
      <Sidebar open={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
        
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
