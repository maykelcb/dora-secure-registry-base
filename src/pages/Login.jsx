import { useState, useEffect, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { Mail, ShieldCheck, AlertCircle, ArrowLeft, RefreshCw, Loader2, Lock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { maskEmail } from "@/utils/emailService";
import { getOtpSecondsLeft } from "@/utils/otpService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────
// Componente: 6 inputs individuales tipo PIN
// ─────────────────────────────────────────────
function OtpInput({ onComplete, disabled, shakeError }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (shakeError) {
      setTimeout(() => {
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }, 0);
    }
  }, [shakeError]);

  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < 5) inputRefs.current[index + 1]?.focus();

    if (newDigits.every((d) => d !== "")) {
      onComplete(newDigits.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (digits[index] === "" && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const nd = [...digits];
        nd[index] = "";
        setDigits(nd);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const nd = pasted.split("");
      setDigits(nd);
      inputRefs.current[5]?.focus();
      onComplete(pasted);
    }
  };

  return (
    <div className={`flex justify-center gap-2 ${shakeError ? "otp-shake" : ""}`} onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          id={`otp-digit-${i}`}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          autoComplete="one-time-code"
          style={{
            width: "50px",
            height: "60px",
            textAlign: "center",
            fontSize: "1.6rem",
            fontWeight: "700",
            borderRadius: "12px",
            border: digit
              ? "2px solid hsl(var(--primary))"
              : "2px solid hsl(var(--border))",
            background: digit
              ? "hsl(var(--primary) / 0.08)"
              : "hsl(var(--background))",
            color: "hsl(var(--foreground))",
            outline: "none",
            transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
            boxShadow: digit ? "0 0 0 3px hsl(var(--primary) / 0.15)" : "none",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "hsl(var(--primary))";
            e.target.style.boxShadow = "0 0 0 3px hsl(var(--primary) / 0.2)";
          }}
          onBlur={(e) => {
            if (!digit) {
              e.target.style.borderColor = "hsl(var(--border))";
              e.target.style.boxShadow = "none";
            }
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente: Countdown timer
// ─────────────────────────────────────────────
function Countdown({ expiresAt, onExpired }) {
  const [seconds, setSeconds] = useState(() => getOtpSecondsLeft(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const left = getOtpSecondsLeft(expiresAt);
      setSeconds(left);
      if (left === 0) { clearInterval(interval); onExpired?.(); }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const isUrgent = seconds <= 60;

  return (
    <span style={{
      color: isUrgent ? "#ef4444" : "hsl(var(--muted-foreground))",
      fontVariantNumeric: "tabular-nums",
      fontWeight: 600,
    }}>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

// ─────────────────────────────────────────────
// Página principal Login
// ─────────────────────────────────────────────
export default function Login() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const otpPending      = useAuthStore((s) => s.otpPending);
  const otpExpiresAt    = useAuthStore((s) => s.otpExpiresAt);
  const currentEmail    = useAuthStore((s) => s.currentEmail);
  const isSendingOtp    = useAuthStore((s) => s.isSendingOtp);
  const requestOtp      = useAuthStore((s) => s.requestOtp);
  const verifyOtp       = useAuthStore((s) => s.verifyOtp);
  const cancelOtp       = useAuthStore((s) => s.cancelOtp);
  const regenerateOtp   = useAuthStore((s) => s.regenerateOtp);
  const resetTakenOverState = useAuthStore((s) => s.resetTakenOverState);

  // Formulario de email
  const [email, setEmail]         = useState("");
  const [emailError, setEmailError] = useState("");

  // Estado de la pantalla OTP
  const [otpExpired, setOtpExpired]   = useState(false);
  const [otpError, setOtpError]       = useState("");
  const [shakeError, setShakeError]   = useState(false);
  const [verifying, setVerifying]     = useState(false);

  // Dev mode: muestra el código en pantalla cuando EmailJS no está configurado
  const [devOtp, setDevOtp] = useState(null);

  // Limpiar estado de sesión tomada al montar el login
  useEffect(() => {
    resetTakenOverState();
  }, [resetTakenOverState]);

  // Limpiar estado OTP al entrar a la pantalla
  useEffect(() => {
    if (otpPending) {
      setTimeout(() => {
        setOtpExpired(false);
        setOtpError("");
      }, 0);
    }
  }, [otpPending]);

  // ── Validación de email ──────────────────────────────────────
  const validateEmail = (value) => {
    if (!value.trim()) return "Ingresa tu correo electrónico";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Correo electrónico no válido";
    return "";
  };

  // ── Enviar OTP ───────────────────────────────────────────────
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setEmailError("");

    const res = await requestOtp(email.trim().toLowerCase());
    if (!res.success) {
      toast.error(res.message || "Error al enviar el código. Intenta de nuevo.");
      return;
    }

    if (res.devMode) {
      setDevOtp(res.otp);
      toast("⚙️ Modo desarrollo: EmailJS no configurado. El código se muestra abajo.", {
        duration: 6000,
        style: { background: "#1e3a5f", color: "#93c5fd" },
      });
    } else {
      setDevOtp(null);
      toast.success(`Código enviado a ${maskEmail(email)}`, { icon: "📨" });
    }
  };

  // ── Verificar OTP ────────────────────────────────────────────
  const triggerShake = useCallback(() => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 650);
  }, []);

  const handleOtpComplete = async (code) => {
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 300));
    const res = verifyOtp(code);
    setVerifying(false);

    if (!res.success) {
      setOtpError(res.message);
      triggerShake();
      if (res.message.includes("expirado")) setOtpExpired(true);
    } else {
      toast.success("¡Acceso concedido! Bienvenido.", { icon: "✅" });
    }
  };

  // ── Reenviar OTP ─────────────────────────────────────────────
  const handleRegenerate = async () => {
    const res = await regenerateOtp();
    if (!res.success) {
      toast.error(res.message || "Error al reenviar el código.");
      return;
    }
    setOtpExpired(false);
    setOtpError("");
    if (res.devMode) {
      setDevOtp(res.otp);
      toast("⚙️ Nuevo código generado (modo desarrollo).", { duration: 5000 });
    } else {
      setDevOtp(null);
      toast.success("Nuevo código enviado a tu correo", { icon: "🔄" });
    }
  };

  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <>
      <style>{`
        @keyframes otpShake {
          0%,100%{transform:translateX(0)}
          15%{transform:translateX(-8px)}
          30%{transform:translateX(8px)}
          45%{transform:translateX(-6px)}
          60%{transform:translateX(6px)}
          75%{transform:translateX(-3px)}
          90%{transform:translateX(3px)}
        }
        .otp-shake{animation:otpShake .6s cubic-bezier(.36,.07,.19,.97);}
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .fade-slide-up{animation:fadeSlideUp .4s ease forwards;}
        @keyframes pulseRing{
          0%{box-shadow:0 0 0 0 hsl(var(--primary)/.35)}
          70%{box-shadow:0 0 0 10px hsl(var(--primary)/0)}
          100%{box-shadow:0 0 0 0 hsl(var(--primary)/0)}
        }
        .icon-pulse{animation:pulseRing 2s infinite;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin .8s linear infinite;}
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-primary/20">
        {/* Fondo decorativo */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl opacity-60" />

        {/* Logo */}
        <div className="text-center mb-8 z-10">
          <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mx-auto mb-4 border border-primary/20 shadow-inner overflow-hidden">
            <img src="/logo.jpg" alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">DORA</h1>
          <p className="text-muted-foreground mt-2 font-medium">Document Registry &amp; Archive</p>
        </div>

        <Card className="w-full max-w-md z-10 border-primary/10 shadow-xl relative overflow-hidden">
          {/* Línea de acento */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400" />

          {/* ══════════════════════════════════════
              ESTADO 1 — Ingreso de correo
          ══════════════════════════════════════ */}
          {!otpPending ? (
            <div className="fade-slide-up">
              <CardHeader className="pt-8 text-center">
                <div
                  className="icon-pulse flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-3"
                  style={{ background: "hsl(var(--primary) / 0.12)", border: "1.5px solid hsl(var(--primary) / 0.3)" }}
                >
                  <Mail className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
                <CardDescription className="mt-1">
                  Ingresa tu correo electrónico y te enviaremos un código de verificación.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleRequestOtp}>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email-input">Correo electrónico</Label>
                    <div className="relative">
                      <Mail
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                      />
                      <Input
                        id="email-input"
                        type="email"
                        placeholder="usuario@ejemplo.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                        disabled={isSendingOtp}
                        className="pl-10 h-11"
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    {emailError && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {emailError}
                      </p>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pb-8">
                  <Button
                    type="submit"
                    className="w-full text-md font-semibold h-11"
                    disabled={isSendingOtp}
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 spin" />
                        Enviando código…
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar código de verificación
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </div>

          /* ══════════════════════════════════════
              ESTADO 2 — Verificación OTP
          ══════════════════════════════════════ */
          ) : (
            <div className="fade-slide-up">
              <CardHeader className="pt-8 text-center">
                <div
                  className="icon-pulse flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-3"
                  style={{ background: "hsl(var(--primary) / 0.12)", border: "1.5px solid hsl(var(--primary) / 0.3)" }}
                >
                  <ShieldCheck className="w-7 h-7" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <CardTitle className="text-xl">Verificación en dos pasos</CardTitle>
                <CardDescription className="mt-1">
                  Enviamos un código de 6 dígitos a{" "}
                  <span className="font-semibold text-foreground">
                    {currentEmail ? maskEmail(currentEmail) : "tu correo"}
                  </span>
                  . Ingrésalo a continuación.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 pb-2">
                {/* Badge modo desarrollo */}
                {devOtp && (
                  <div
                    className="flex items-center gap-3 p-3 rounded-xl border fade-slide-up"
                    style={{ background: "hsl(210 80% 20% / 0.5)", borderColor: "hsl(210 80% 40% / 0.4)" }}
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-xs font-medium mb-0.5" style={{ color: "#93c5fd" }}>
                        ⚙️ Modo desarrollo — EmailJS no configurado
                      </p>
                      <p
                        className="text-2xl font-bold tracking-[0.35em]"
                        style={{ color: "#60a5fa", fontVariantNumeric: "tabular-nums" }}
                        aria-label={`Código: ${devOtp}`}
                      >
                        {devOtp}
                      </p>
                    </div>
                    {otpExpiresAt && (
                      <div className="text-right shrink-0">
                        <p className="text-xs mb-0.5" style={{ color: "#93c5fd" }}>Expira en</p>
                        <Countdown expiresAt={otpExpiresAt} onExpired={() => setOtpExpired(true)} />
                      </div>
                    )}
                  </div>
                )}

                {/* Badge correo enviado (modo real, sin código visible) */}
                {!devOtp && !otpExpired && otpExpiresAt && (
                  <div
                    className="flex items-center justify-between p-3 rounded-xl border"
                    style={{ background: "hsl(var(--primary) / 0.06)", borderColor: "hsl(var(--primary) / 0.2)" }}
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--primary))" }} />
                      <p className="text-sm text-muted-foreground">
                        Código enviado a tu bandeja de entrada
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs text-muted-foreground mb-0.5">Expira en</p>
                      <Countdown expiresAt={otpExpiresAt} onExpired={() => setOtpExpired(true)} />
                    </div>
                  </div>
                )}

                {/* Inputs OTP */}
                {!otpExpired ? (
                  <>
                    <div className="space-y-3">
                      <Label className="block text-center text-sm text-muted-foreground">
                        Ingresa los 6 dígitos
                      </Label>
                      <OtpInput
                        onComplete={handleOtpComplete}
                        disabled={verifying}
                        shakeError={shakeError}
                      />
                    </div>

                    {otpError && (
                      <div className="flex items-center justify-center gap-2 p-2 rounded-lg text-sm text-destructive bg-destructive/10 border border-destructive/20 fade-slide-up">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {otpError}
                      </div>
                    )}

                    {verifying && (
                      <p className="text-center text-sm text-muted-foreground animate-pulse">
                        Verificando…
                      </p>
                    )}
                  </>
                ) : (
                  /* Código expirado */
                  <div className="text-center space-y-4 py-2">
                    <div className="flex items-center justify-center gap-2 p-3 rounded-lg text-sm text-destructive bg-destructive/10 border border-destructive/20">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      El código ha expirado.
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-10"
                      onClick={handleRegenerate}
                      disabled={isSendingOtp}
                    >
                      {isSendingOtp
                        ? <><Loader2 className="w-4 h-4 mr-2 spin" />Enviando…</>
                        : <><RefreshCw className="w-4 h-4 mr-2" />Reenviar nuevo código</>
                      }
                    </Button>
                  </div>
                )}

                {/* Reenviar (antes de expirar) */}
                {!otpExpired && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      disabled={isSendingOtp}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline disabled:opacity-40"
                    >
                      ¿No recibiste el código? Reenviar
                    </button>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pb-8 pt-2">
                <button
                  type="button"
                  onClick={cancelOtp}
                  className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 rounded-lg hover:bg-muted/50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Usar otro correo
                </button>
              </CardFooter>
            </div>
          )}
        </Card>

        <div className="mt-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Lock className="w-3 h-3" />
          Encriptación AES-256 · Autenticación en dos pasos
        </div>
      </div>
    </>
  );
}
