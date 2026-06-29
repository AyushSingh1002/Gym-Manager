import { create } from "zustand"

interface AppState {
  sidebarOpen: boolean
  theme: "light" | "dark"
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setTheme: (theme: "light" | "dark") => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  theme: "light",
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}))
