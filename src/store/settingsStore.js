import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: "light",
      timeoutMinutes: 720, // Default to 12 hours (720 mins)
      toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      setTheme: (theme) => set({ theme }),
      setTimeoutMinutes: (minutes) => set({ timeoutMinutes: minutes }),
    }),
    {
      name: "dora-settings",
    }
  )
);
