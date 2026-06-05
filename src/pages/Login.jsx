import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Navigate } from "react-router-dom";
import { ShieldAlert, Lock, AlertCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import toast from "react-hot-toast";

// Schema for Setup
const setupSchema = z.object({
  password: z.string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[0-9]/, "Debe contener al menos 1 número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos 1 carácter especial"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Schema for Login
const loginSchema = z.object({
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export default function Login() {
  const isSetupComplete = useAuthStore((state) => state.isSetupComplete);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setup = useAuthStore((state) => state.setup);
  const login = useAuthStore((state) => state.login);
  const lockoutUntil = useAuthStore((state) => state.lockoutUntil);
  const failedAttempts = useAuthStore((state) => state.failedAttempts);

  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

  const { register: registerSetup, handleSubmit: handleSetupSubmit, formState: { errors: setupErrors } } = useForm({
    resolver: zodResolver(setupSchema),
  });

  const { register: registerLogin, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    let interval;
    if (lockoutUntil) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        if (now < lockoutUntil) {
          setLockoutTimeLeft(Math.ceil((lockoutUntil - now) / 1000));
        } else {
          setLockoutTimeLeft(0);
        }
      }, 1000);
    } else {
      setLockoutTimeLeft(0);
    }
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const onSetup = (data) => {
    setup(data.password);
    toast.success("Sistema inicializado correctamente");
  };

  const onLogin = (data) => {
    const res = login(data.password);
    if (!res.success) {
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-primary/20">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-60"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl opacity-60"></div>
      
      <div className="text-center mb-8 z-10">
        <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-4 border border-primary/20 shadow-inner overflow-hidden">
          <img src="/logo.jpg" alt="Logo" className="w-10 h-10 object-contain" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">DORA</h1>
        <p className="text-muted-foreground mt-2 font-medium">Document Registry & Archive</p>
      </div>

      <Card className="w-full max-w-md z-10 border-primary/10 shadow-xl relative overflow-hidden">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400"></div>

        {!isSetupComplete ? (
          <>
            <CardHeader className="pt-8 text-center">
              <CardTitle className="text-xl">Configuración Inicial</CardTitle>
              <CardDescription>
                Por favor, crea una contraseña maestra.
                Esta será la llave criptográfica que encriptará todos tus datos localmente.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSetupSubmit(onSetup)}>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-400 font-medium">
                    Importante: Si olvidas esta contraseña, tus datos serán irrecuperables. Guárdala en un lugar seguro.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="setup-pwd">Contraseña Maestra</Label>
                  <Input id="setup-pwd" type="password" {...registerSetup("password")} />
                  {setupErrors.password && <p className="text-sm text-destructive">{setupErrors.password.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setup-pwd-conf">Confirmar Contraseña</Label>
                  <Input id="setup-pwd-conf" type="password" {...registerSetup("confirmPassword")} />
                  {setupErrors.confirmPassword && <p className="text-sm text-destructive">{setupErrors.confirmPassword.message}</p>}
                </div>
              </CardContent>
              <CardFooter className="pb-8">
                <Button type="submit" className="w-full text-md font-semibold h-11">
                  <Lock className="w-4 h-4 mr-2" />
                  Inicializar y Encriptar
                </Button>
              </CardFooter>
            </form>
          </>
        ) : (
          <>
            <CardHeader className="pt-8 text-center">
              <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
              <CardDescription>Ingresa tu contraseña maestra para desencriptar el almacenamiento local.</CardDescription>
            </CardHeader>
            <form onSubmit={handleLoginSubmit(onLogin)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-pwd">Contraseña Maestra</Label>
                  <Input 
                    id="login-pwd" 
                    type="password" 
                    {...registerLogin("password")} 
                    disabled={lockoutTimeLeft > 0} 
                    className={lockoutTimeLeft > 0 ? "opacity-50" : ""}
                  />
                  {loginErrors.password && <p className="text-sm text-destructive">{loginErrors.password.message}</p>}
                </div>
                
                {lockoutTimeLeft > 0 && (
                  <div className="text-sm text-destructive flex items-center justify-center p-2 bg-destructive/10 rounded-md">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Cuenta bloqueada. Intenta en {lockoutTimeLeft}s.
                  </div>
                )}
                
                {failedAttempts > 0 && lockoutTimeLeft === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Intentos fallidos: {failedAttempts}/5
                  </p>
                )}
              </CardContent>
              <CardFooter className="pb-8">
                <Button type="submit" className="w-full text-md font-semibold h-11" disabled={lockoutTimeLeft > 0}>
                  Desbloquear Sistema
                </Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
      
      <div className="mt-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <Lock className="w-3 h-3" />
        Encriptación AES-256 Local · 100% Offline
      </div>
    </div>
  );
}
