import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { ShieldAlert, LogOut, ArrowRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SessionBarrier() {
  const sessionConflict = useAuthStore((s) => s.sessionConflict);
  const sessionTakenOver = useAuthStore((s) => s.sessionTakenOver);
  const conflictEmail = useAuthStore((s) => s.conflictEmail);
  const takeoverSession = useAuthStore((s) => s.takeoverSession);
  const resetTakenOverState = useAuthStore((s) => s.resetTakenOverState);

  const [closeFailed, setCloseFailed] = useState(false);

  // Intentar cerrar la pestaña
  const handleCloseTab = () => {
    window.close();
    // Si sigue abierta después de una fracción de segundo, es que el navegador bloqueó window.close()
    setTimeout(() => {
      setCloseFailed(true);
    }, 150);
  };

  if (!sessionConflict && !sessionTakenOver) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-scale-up {
          animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
        {/* Conflicto de Sesión */}
        {sessionConflict && (
          <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl animate-scale-up text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-orange-500" />
            
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl">
              <ShieldAlert className="w-8 h-8 text-amber-500 animate-pulse" />
            </div>

            <h2 className="text-xl font-bold text-slate-950 dark:text-white">
              Sesión activa en otra pestaña
            </h2>

            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              El correo <span className="font-semibold text-slate-900 dark:text-slate-100">{conflictEmail}</span> ya cuenta con una sesión activa abierta en otra ventana o pestaña de este navegador.
            </p>

            <div className="p-3 my-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600 dark:text-amber-400 font-medium text-left flex items-start gap-2">
              <span className="mt-0.5 font-bold">⚠️ Nota:</span>
              <span>Si decides usarla aquí, se cerrará automáticamente la sesión en la otra pestaña.</span>
            </div>

            {!closeFailed ? (
              <div className="flex flex-col gap-2 mt-6">
                <Button 
                  onClick={takeoverSession} 
                  className="w-full h-11 bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
                >
                  Sí, usar aquí <ArrowRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCloseTab}
                  className="w-full h-11 border-slate-200 dark:border-slate-800 font-medium flex items-center justify-center gap-2"
                >
                  No, cerrar esta pestaña
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
                  <XCircle className="w-4 h-4 shrink-0" />
                  <p className="text-left font-medium">
                    El navegador impidió cerrar esta pestaña automáticamente. Puedes cerrarla tú manualmente o bien cambiar la sesión aquí.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={takeoverSession} 
                    className="flex-1 h-11 bg-primary text-primary-foreground font-semibold"
                  >
                    Usar aquí
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => useAuthStore.getState().logout()} 
                    className="flex-1 h-11"
                  >
                    Cerrar Sesión
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sesión Tomada por Otra Pestaña */}
        {sessionTakenOver && (
          <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl animate-scale-up text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 to-rose-600" />

            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl">
              <LogOut className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-xl font-bold text-slate-950 dark:text-white">
              Sesión transferida
            </h2>

            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Tu sesión ha sido transferida o iniciada en otra pestaña de este navegador. Esta ventana ya no tiene acceso.
            </p>

            <div className="mt-6">
              <Button 
                onClick={resetTakenOverState} 
                className="w-full h-11 bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2"
              >
                Volver a Iniciar Sesión
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
