import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSettingsStore = create(
  persist(
    (set) => ({
      theme: "light",
      timeoutMinutes: 30, // Default to 30 mins
      toggleTheme: () => set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      setTheme: (theme) => set({ theme }),
      setTimeoutMinutes: (minutes) => set({ timeoutMinutes: minutes }),
    }),
    {
      name: "dora-settings",
    }
  )
);
