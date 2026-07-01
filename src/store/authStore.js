import { create } from "zustand";
import { generateOTP, verifyOTP } from "@/utils/otpService";
import { sendOtpEmail } from "@/utils/emailService";
import { decryptData, encryptData } from "@/utils/crypto";
import { supabase, isSupabaseConfigured } from "@/utils/supabaseClient";
import toast from "react-hot-toast";

// Lista de administradores principales
export const ADMIN_EMAILS = [
  "presidenteongunmundosinlimites@gmail.com",
  "audrysbsf@gmail.com",
  "maykelcb093@gmail.com"
];

/**
 * Obtiene el registro de usuarios desde Supabase o localStorage.
 */
export async function fetchUserRegistry() {
  const encryptionKey = getSystemEncryptionKey();
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("encrypted_data")
        .eq("id", "system-user-registry")
        .maybeSingle();

      if (error) {
        console.error("Error fetching user registry from Supabase:", error);
        return null;
      }
      if (!data) return null;

      const decrypted = decryptData(data.encrypted_data, encryptionKey);
      return decrypted?.users || null;
    } catch (e) {
      console.error("Error decrypting user registry:", e);
      return null;
    }
  } else {
    // Modo local (LocalStorage)
    try {
      const STORAGE_KEY = "dora-encrypted-docs";
      const encryptedData = localStorage.getItem(STORAGE_KEY);
      if (!encryptedData) return null;
      const decrypted = decryptData(encryptedData, encryptionKey);
      if (!decrypted) return null;
      const registryDoc = decrypted.find(d => d.id === "system-user-registry");
      return registryDoc?.users || null;
    } catch (e) {
      console.error("Error loading user registry locally:", e);
      return null;
    }
  }
}

/**
 * Guarda el registro de usuarios en Supabase o localStorage.
 */
export async function saveUserRegistry(usersList) {
  const encryptionKey = getSystemEncryptionKey();
  const doc = {
    id: "system-user-registry",
    users: usersList,
    updatedAt: new Date().toISOString()
  };
  const encrypted = encryptData(doc, encryptionKey);

  if (isSupabaseConfigured()) {
    try {
      // Verificar si la fila de registro ya existe
      const { data: existingRow, error: checkError } = await supabase
        .from("documents")
        .select("id")
        .eq("id", "system-user-registry")
        .maybeSingle();

      if (checkError) {
        console.error("Error checking system-user-registry existence:", checkError);
      }

      if (existingRow) {
        // Actualizar registro existente
        const { error } = await supabase
          .from("documents")
          .update({
            encrypted_data: encrypted,
            updated_at: new Date().toISOString()
          })
          .eq("id", "system-user-registry");
        if (error) throw error;
      } else {
        // Insertar nuevo registro
        const { error } = await supabase
          .from("documents")
          .insert([
            {
              id: "system-user-registry",
              encrypted_data: encrypted,
              eliminado: false,
              created_at: new Date().toISOString()
            }
          ]);
        if (error) throw error;
      }
    } catch (e) {
      console.error("Error saving user registry to Supabase:", e);
    }
  } else {
    try {
      const STORAGE_KEY = "dora-encrypted-docs";
      const encryptedData = localStorage.getItem(STORAGE_KEY);
      let currentDocs = [];
      if (encryptedData) {
        const decrypted = decryptData(encryptedData, encryptionKey);
        if (decrypted) currentDocs = decrypted;
      }
      const cleanDocs = currentDocs.filter(d => d.id !== "system-user-registry");
      cleanDocs.push(doc);
      const newEncrypted = encryptData(cleanDocs, encryptionKey);
      localStorage.setItem(STORAGE_KEY, newEncrypted);
    } catch (e) {
      console.error("Error saving user registry locally:", e);
    }
  }
}

/**
 * Inicializa el registro de usuarios si no existe.
 */
export async function initializeUserRegistryIfNeeded() {
  const existing = await fetchUserRegistry();
  if (existing) return existing;

  const initialUsers = ADMIN_EMAILS.map(email => ({
    email: email.toLowerCase(),
    role: "admin",
    status: "active",
    lastActive: new Date().toISOString()
  }));

  await saveUserRegistry(initialUsers);
  return initialUsers;
}

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

const getInitialAuth = () => {
  if (typeof window === "undefined") return { isAuthenticated: false, currentEmail: null, sessionExpiresAt: null };
  const activeSessionStr = localStorage.getItem("dora-active-session");
  if (!activeSessionStr) return { isAuthenticated: false, currentEmail: null, sessionExpiresAt: null };

  try {
    const activeSession = JSON.parse(activeSessionStr);
    if (activeSession.email && activeSession.activeTabId === tabId) {
      // Verificar si no ha expirado
      if (activeSession.expiresAt && Date.now() > activeSession.expiresAt) {
        localStorage.removeItem("dora-active-session");
        return { isAuthenticated: false, currentEmail: null, sessionExpiresAt: null };
      }
      return {
        isAuthenticated: true,
        currentEmail: activeSession.email,
        sessionExpiresAt: activeSession.expiresAt || null
      };
    }
  } catch {
    // ignorar
  }
  return { isAuthenticated: false, currentEmail: null, sessionExpiresAt: null };
};

const initialAuth = getInitialAuth();

export const useAuthStore = create((set, get) => ({
  // ── Estado de sesión ──────────────────────────────────────────
  isAuthenticated: initialAuth.isAuthenticated,
  currentEmail: initialAuth.currentEmail,
  sessionExpiresAt: initialAuth.sessionExpiresAt,

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

  // ── Estado del panel de administración ────────────────────────
  userRegistry: [],
  isLoadingRegistry: false,
  lastStatusCheckTime: 0,

  // ── Acción: verificar conflicto de sesión al arrancar o navegar ──
  checkSessionConflict: async () => {
    // Si la sesión no está activa en este navegador local, no hay conflicto
    const activeSessionStr = localStorage.getItem("dora-active-session");
    if (!activeSessionStr) return false;

    try {
      const activeSession = JSON.parse(activeSessionStr);

      // Si la sesión ya expiró, la limpiamos y no hay conflicto
      if (activeSession.expiresAt && Date.now() > activeSession.expiresAt) {
        localStorage.removeItem("dora-active-session");
        return false;
      }

      if (!activeSession.email || activeSession.activeTabId === tabId) {
        // Somos nosotros mismos, restauramos sesión si hace falta
        if (!get().isAuthenticated) {
          set({
            isAuthenticated: true,
            currentEmail: activeSession.email,
            sessionExpiresAt: activeSession.expiresAt || (Date.now() + 30 * 60 * 1000)
          });
        }
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

    // Validar estado del usuario antes de enviar OTP
    const cleanEmail = email.trim().toLowerCase();
    try {
      const users = await initializeUserRegistryIfNeeded();
      const user = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (user) {
        if (user.status === "blocked") {
          set({ isSendingOtp: false });
          return { success: false, message: "Su cuenta ha sido bloqueada. Comuníquese con el administrador." };
        }
        if (user.status === "suspended") {
          set({ isSendingOtp: false });
          return { success: false, message: "Su cuenta ha sido suspendida. Comuníquese con el administrador." };
        }
      }
    } catch (e) {
      console.error("Error al verificar permisos del usuario:", e);
    }

    const { code, expiresAt } = generateOTP();
    const result = await sendOtpEmail(cleanEmail, code);

    if (!result.success) {
      set({ isSendingOtp: false });
      return { success: false, message: result.error };
    }

    set({
      otpPending: true,
      otpCode: code,
      otpExpiresAt: expiresAt,
      currentEmail: cleanEmail,
      isSendingOtp: false,
    });

    return { success: true, devMode: result.devMode ?? false, otp: code };
  },

  // ── Acción: verificar OTP (segundo paso) ─────────────────────
  verifyOtp: async (inputCode) => {
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

      // Registrar o actualizar usuario y esperar a que finalice
      try {
        const users = await initializeUserRegistryIfNeeded();
        const emailLower = currentEmail.toLowerCase();
        let userExists = false;
        const updatedUsers = users.map(u => {
          if (u.email.toLowerCase() === emailLower) {
            userExists = true;
            return {
              ...u,
              lastActive: new Date().toISOString()
            };
          }
          return u;
        });

        if (!userExists) {
          const isUserAdmin = ADMIN_EMAILS.includes(emailLower);
          updatedUsers.push({
            email: emailLower,
            role: isUserAdmin ? "admin" : "user",
            status: "active",
            lastActive: new Date().toISOString()
          });
        }
        await saveUserRegistry(updatedUsers);
      } catch (e) {
        console.error("Error al actualizar registro de usuario en login:", e);
      }

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

    // Validar estado antes de reenviar
    try {
      const users = await fetchUserRegistry();
      if (users) {
        const user = users.find(u => u.email.toLowerCase() === currentEmail.toLowerCase());
        if (user) {
          if (user.status === "blocked") {
            set({ isSendingOtp: false });
            return { success: false, message: "Su cuenta ha sido bloqueada. Comuníquese con el administrador." };
          }
          if (user.status === "suspended") {
            set({ isSendingOtp: false });
            return { success: false, message: "Su cuenta ha sido suspendida. Comuníquese con el administrador." };
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

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
    const expiresAt = new Date().getTime() + timeoutMins * 60 * 1000;
    set({ sessionExpiresAt: expiresAt });

    // También actualizar en localStorage
    const activeSessionStr = localStorage.getItem("dora-active-session");
    if (activeSessionStr) {
      try {
        const activeSession = JSON.parse(activeSessionStr);
        activeSession.expiresAt = expiresAt;
        activeSession.lastPing = Date.now();
        localStorage.setItem("dora-active-session", JSON.stringify(activeSession));
      } catch { /* ignorar */ }
    }
  },

  checkSession: async () => {
    const { isAuthenticated, sessionExpiresAt, logout, currentEmail, lastStatusCheckTime } = get();
    if (isAuthenticated && sessionExpiresAt && new Date().getTime() > sessionExpiresAt) {
      logout();
      return false;
    }

    if (isAuthenticated && currentEmail) {
      const now = Date.now();
      // Validar estado cada 60 segundos
      if (now - lastStatusCheckTime > 60000) {
        set({ lastStatusCheckTime: now });
        try {
          const users = await fetchUserRegistry();
          if (users) {
            const user = users.find(u => u.email.toLowerCase() === currentEmail.toLowerCase());
            if (user && (user.status === "blocked" || user.status === "suspended")) {
              logout();
              toast.error(`Sesión cerrada: Tu cuenta ha sido ${user.status === "blocked" ? "bloqueada" : "suspendida"}.`);
              return false;
            }
          }
        } catch (e) {
          console.error("Error al validar sesión activa:", e);
        }
      }
    }
    return isAuthenticated;
  },

  // ── Acciones del Panel de Administración ───────────────────────
  loadUserRegistry: async () => {
    set({ isLoadingRegistry: true });
    try {
      const users = await initializeUserRegistryIfNeeded();
      set({ userRegistry: users, isLoadingRegistry: false });
    } catch (e) {
      console.error("Error al cargar el registro de usuarios:", e);
      set({ isLoadingRegistry: false });
    }
  },

  updateUserStatus: async (email, newStatus) => {
    const { userRegistry, currentEmail } = get();
    const cleanEmail = email.trim().toLowerCase();

    // Evitar que el admin se bloquee/suspenda a sí mismo
    if (cleanEmail === currentEmail.toLowerCase() && newStatus !== "active") {
      toast.error("No puedes suspender o bloquear tu propia cuenta de administrador.");
      return;
    }

    try {
      const updated = userRegistry.map(u => {
        if (u.email.toLowerCase() === cleanEmail) {
          return { ...u, status: newStatus };
        }
        return u;
      });

      await saveUserRegistry(updated);
      set({ userRegistry: updated });
      toast.success(`Usuario ${email} actualizado a estado '${newStatus}'`);
    } catch (e) {
      console.error(e);
      toast.error("Error al actualizar el estado del usuario.");
    }
  },

  addUserManual: async (email, role) => {
    const { userRegistry } = get();
    const cleanEmail = email.trim().toLowerCase();

    if (userRegistry.some(u => u.email.toLowerCase() === cleanEmail)) {
      toast.error("Este usuario ya se encuentra registrado.");
      return;
    }

    try {
      const updated = [...userRegistry, {
        email: cleanEmail,
        role: role || "user",
        status: "active",
        lastActive: "Nunca"
      }];

      await saveUserRegistry(updated);
      set({ userRegistry: updated });
      toast.success(`Usuario ${email} registrado con éxito.`);
    } catch (e) {
      console.error(e);
      toast.error("Error al registrar el usuario.");
    }
  },

  removeUserRegistry: async (email) => {
    const { userRegistry, currentEmail } = get();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail === currentEmail.toLowerCase()) {
      toast.error("No puedes eliminar tu propio usuario de administrador.");
      return;
    }

    try {
      const updated = userRegistry.filter(u => u.email.toLowerCase() !== cleanEmail);
      await saveUserRegistry(updated);
      set({ userRegistry: updated });
      toast.success(`Usuario ${email} eliminado del registro.`);
    } catch (e) {
      console.error(e);
      toast.error("Error al eliminar el usuario.");
    }
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
