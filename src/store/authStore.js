import { create } from "zustand";
import { generateSalt, deriveKey, hashString } from "@/utils/crypto";

export const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  encryptionKey: null, // Stored ONLY in memory for session
  sessionExpiresAt: null,
  isSetupComplete: !!localStorage.getItem("dora-auth-hash"),
  
  // Login attempt protection
  failedAttempts: 0,
  lockoutUntil: null,

  setup: (password) => {
    const salt = generateSalt();
    const key = deriveKey(password, salt);
    const hash = hashString(key); // Hash the key to verify later

    localStorage.setItem("dora-auth-salt", salt);
    localStorage.setItem("dora-auth-hash", hash);

    set({
      isSetupComplete: true,
      isAuthenticated: true,
      encryptionKey: key,
      failedAttempts: 0,
      lockoutUntil: null,
    });
    get().extendSession();
  },

  login: (password) => {
    const state = get();
    if (state.lockoutUntil && new Date().getTime() < state.lockoutUntil) {
      return { success: false, message: "Cuenta bloqueada temporalmente. Intenta más tarde." };
    }

    const salt = localStorage.getItem("dora-auth-salt");
    const storedHash = localStorage.getItem("dora-auth-hash");

    if (!salt || !storedHash) {
      return { success: false, message: "No se encontraron datos de configuración." };
    }

    const key = deriveKey(password, salt);
    const hash = hashString(key);

    if (hash === storedHash) {
      set({
        isAuthenticated: true,
        encryptionKey: key,
        failedAttempts: 0,
        lockoutUntil: null,
      });
      get().extendSession();
      return { success: true };
    } else {
      const newAttempts = state.failedAttempts + 1;
      let lockout = null;
      if (newAttempts >= 5) {
        lockout = new Date().getTime() + 5 * 60 * 1000; // Lock for 5 mins
      }
      set({ failedAttempts: newAttempts, lockoutUntil: lockout });
      return { 
        success: false, 
        message: lockout ? "Demasiados intentos. Cuenta bloqueada por 5 minutos." : "Contraseña incorrecta." 
      };
    }
  },

  logout: () => {
    set({
      isAuthenticated: false,
      encryptionKey: null,
      sessionExpiresAt: null,
    });
  },

  extendSession: () => {
    // Read timeout from localStorage settings if available, else default to 30
    let timeoutMins = 30;
    try {
      const settingsStr = localStorage.getItem("dora-settings");
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings.state && settings.state.timeoutMinutes) {
          timeoutMins = settings.state.timeoutMinutes;
        }
      }
    } catch(e) {}
    
    set({ sessionExpiresAt: new Date().getTime() + timeoutMins * 60 * 1000 });
  },

  checkSession: () => {
    const { isAuthenticated, sessionExpiresAt, logout } = get();
    if (isAuthenticated && sessionExpiresAt && new Date().getTime() > sessionExpiresAt) {
      logout();
      return false; // Session expired
    }
    return isAuthenticated;
  },

  // Para cuando el usuario quiera cambiar su contraseña
  // Requiere tener la clave actual para re-encriptar todo, esto se maneja junto con el documentsStore
  updatePasswordData: (newPassword) => {
    const salt = generateSalt();
    const newKey = deriveKey(newPassword, salt);
    const newHash = hashString(newKey);
    
    localStorage.setItem("dora-auth-salt", salt);
    localStorage.setItem("dora-auth-hash", newHash);

    set({ encryptionKey: newKey });
    return newKey;
  }
}));
