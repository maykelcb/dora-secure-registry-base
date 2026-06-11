import { create } from "zustand";
import { generateOTP, verifyOTP } from "@/utils/otpService";
import { sendOtpEmail } from "@/utils/emailService";

// Generar un ID único de pestaña en sessionStorage (persiste en recargas de la misma pestaña)
const tabId = typeof window !== "undefined"
  ? (() => {
      let id = sessionStorage.getItem("dora-tab-id");
      if (!id) {
        id = "tab-" + Math.random().toString(36).substring(2, 11) + "-" + Date.now();
        sessionStorage.setItem("dora-tab-id", id);
      }
      return id;
    })()
  : "server-tab";

// Canal de comunicación entre pestañas
const channel = typeof window !== "undefined" && window.BroadcastChannel
  ? new BroadcastChannel("dora-session-channel")
  : null;

/**
 * Devuelve la clave de encriptación del sistema.
 * Se lee desde la variable de entorno; si no está configurada,
 * usa un fallback de desarrollo (no seguro para producción).
 */
export function getSystemEncryptionKey() {
  const envKey = import.meta.env.VITE_SYSTEM_ENCRYPTION_KEY;
  if (envKey && !envKey.includes("cambia_esto")) return envKey;
  // Fallback solo para desarrollo local
  return "dora-dev-fallback-key-2024-insegura";
}

export const useAuthStore = create((set, get) => ({
  // ── Estado de sesión ──────────────────────────────────────────
  isAuthenticated: false,
  currentEmail: null,
  sessionExpiresAt: null,

  // ── Control de pestañas concurrentes ──────────────────────────
  tabId: tabId,
  sessionConflict: false,
  sessionTakenOver: false,
  conflictEmail: null,

  // ── Estado del flujo OTP (solo en memoria) ────────────────────
  otpPending: false,
  otpCode: null,
  otpExpiresAt: null,
  isSendingOtp: false,

  // ── Acción: verificar conflicto de sesión al arrancar o navegar ──
  checkSessionConflict: async () => {
    // Si la sesión no está activa en este navegador local, no hay conflicto
    const activeSessionStr = localStorage.getItem("dora-active-session");
    if (!activeSessionStr) return false;

    try {
      const activeSession = JSON.parse(activeSessionStr);
      if (!activeSession.email || activeSession.activeTabId === tabId) {
        // Somos nosotros mismos, no hay conflicto
        return false;
      }

      // Enviar un ping a ver si la otra pestaña está abierta en el navegador
      let hasConflict = false;

      const pongHandler = (event) => {
        const { type, payload } = event.data;
        if (
          type === "PONG_ACTIVE" &&
          payload.email === activeSession.email &&
          payload.receiverTabId === tabId
        ) {
          hasConflict = true;
        }
      };

      if (channel) {
        channel.addEventListener("message", pongHandler);
        channel.postMessage({
          type: "PING_ACTIVE",
          payload: { email: activeSession.email, senderTabId: tabId }
        });
      }

      // Esperar 300ms a ver si responde
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (channel) {
        channel.removeEventListener("message", pongHandler);
      }

      if (hasConflict) {
        set({ sessionConflict: true, conflictEmail: activeSession.email });
        return true;
      } else {
        // Nadie respondió, así que tomamos control de la sesión inactiva
        localStorage.setItem(
          "dora-active-session",
          JSON.stringify({
            email: activeSession.email,
            activeTabId: tabId,
            lastPing: Date.now()
          })
        );
        set({
          sessionConflict: false,
          conflictEmail: null,
          isAuthenticated: true,
          currentEmail: activeSession.email
        });
        return false;
      }
    } catch {
      return false;
    }
  },

  // ── Acción: tomar posesión de la sesión (cuando el usuario hace clic en "Sí, usar aquí") ──
  takeoverSession: () => {
    const { conflictEmail } = get();
    if (!conflictEmail) return;

    localStorage.setItem(
      "dora-active-session",
      JSON.stringify({
        email: conflictEmail,
        activeTabId: tabId,
        lastPing: Date.now()
      })
    );

    set({
      isAuthenticated: true,
      currentEmail: conflictEmail,
      sessionConflict: false,
      conflictEmail: null,
      sessionTakenOver: false
    });

    get().extendSession();

    // Notificar a la otra pestaña para que se desconecte inmediatamente
    if (channel) {
      channel.postMessage({
        type: "TAKEOVER",
        payload: { email: conflictEmail, activeTabId: tabId }
      });
    }
  },

  // ── Acción: manejador cuando otra pestaña toma la sesión de este correo ──
  handleTakeover: () => {
    set({
      isAuthenticated: false,
      currentEmail: null,
      sessionExpiresAt: null,
      sessionTakenOver: true,
      sessionConflict: false,
      otpPending: false,
      otpCode: null,
      otpExpiresAt: null
    });
  },

  // ── Acción: restablecer el flag de sesión tomada por otra pestaña ──
  resetTakenOverState: () => {
    set({ sessionTakenOver: false });
  },

  // ── Acción: solicitar OTP (primer paso) ───────────────────────
  requestOtp: async (email) => {
    set({ isSendingOtp: true });

    const { code, expiresAt } = generateOTP();
    const result = await sendOtpEmail(email, code);

    if (!result.success) {
      set({ isSendingOtp: false });
      return { success: false, message: result.error };
    }

    set({
      otpPending: true,
      otpCode: code,
      otpExpiresAt: expiresAt,
      currentEmail: email,
      isSendingOtp: false,
    });

    return { success: true, devMode: result.devMode ?? false, otp: code };
  },

  // ── Acción: verificar OTP (segundo paso) ─────────────────────
  verifyOtp: (inputCode) => {
    const { otpCode, otpExpiresAt, currentEmail } = get();
    const result = verifyOTP(inputCode, otpCode, otpExpiresAt);

    if (result.valid) {
      // Registrar sesión activa
      localStorage.setItem(
        "dora-active-session",
        JSON.stringify({
          email: currentEmail,
          activeTabId: tabId,
          lastPing: Date.now()
        })
      );

      set({
        isAuthenticated: true,
        otpPending: false,
        otpCode: null,
        otpExpiresAt: null,
        sessionConflict: false,
        sessionTakenOver: false,
      });
      get().extendSession();

      // Notificar a otras pestañas activas para que se cierren/desautentiquen
      if (channel) {
        channel.postMessage({
          type: "TAKEOVER",
          payload: { email: currentEmail, activeTabId: tabId }
        });
      }

      return { success: true };
    }

    if (result.reason === "expired") {
      return { success: false, message: "El código ha expirado. Genera uno nuevo." };
    }
    return { success: false, message: "Código incorrecto. Inténtalo de nuevo." };
  },

  // ── Acción: reenviar OTP ──────────────────────────────────────
  regenerateOtp: async () => {
    const { currentEmail } = get();
    if (!currentEmail) return { success: false };

    set({ isSendingOtp: true });
    const { code, expiresAt } = generateOTP();
    const result = await sendOtpEmail(currentEmail, code);

    if (!result.success) {
      set({ isSendingOtp: false });
      return { success: false, message: result.error };
    }

    set({
      otpCode: code,
      otpExpiresAt: expiresAt,
      isSendingOtp: false,
    });

    return { success: true, devMode: result.devMode ?? false, otp: code };
  },

  // ── Acción: cancelar flujo OTP ────────────────────────────────
  cancelOtp: () => {
    set({
      otpPending: false,
      otpCode: null,
      otpExpiresAt: null,
      currentEmail: null,
    });
  },

  // ── Acción: cerrar sesión ─────────────────────────────────────
  logout: () => {
    localStorage.removeItem("dora-active-session");
    set({
      isAuthenticated: false,
      currentEmail: null,
      sessionExpiresAt: null,
      otpPending: false,
      otpCode: null,
      otpExpiresAt: null,
      sessionConflict: false,
      sessionTakenOver: false,
    });
  },

  // ── Sesión ────────────────────────────────────────────────────
  extendSession: () => {
    let timeoutMins = 30;
    try {
      const settingsStr = localStorage.getItem("dora-settings");
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings.state?.timeoutMinutes) {
          timeoutMins = settings.state.timeoutMinutes;
        }
      }
    } catch { /* ignorar */ }
    set({ sessionExpiresAt: new Date().getTime() + timeoutMins * 60 * 1000 });
  },

  checkSession: () => {
    const { isAuthenticated, sessionExpiresAt, logout } = get();
    if (isAuthenticated && sessionExpiresAt && new Date().getTime() > sessionExpiresAt) {
      logout();
      return false;
    }
    return isAuthenticated;
  },
}));

// Registrar el listener global de mensajería
if (channel) {
  channel.onmessage = (event) => {
    const { type, payload } = event.data;
    const store = useAuthStore.getState();
    const currentEmail = store.currentEmail;
    const isAuthenticated = store.isAuthenticated;

    if (type === "PING_ACTIVE" && payload.email === currentEmail && isAuthenticated) {
      const activeSessionStr = localStorage.getItem("dora-active-session");
      if (activeSessionStr) {
        try {
          const activeSession = JSON.parse(activeSessionStr);
          if (activeSession.activeTabId === tabId) {
            channel.postMessage({
              type: "PONG_ACTIVE",
              payload: {
                email: currentEmail,
                activeTabId: tabId,
                receiverTabId: payload.senderTabId,
              },
            });
          }
        } catch { /* ignored */ }
      }
    }

    if (type === "TAKEOVER" && payload.email === currentEmail && payload.activeTabId !== tabId) {
      store.handleTakeover();
    }
  };
}
