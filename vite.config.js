import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // En dev local, proxy /api vers Vercel dev server
      // Si tu utilises `vercel dev`, ce proxy n'est pas nécessaire
      // Si tu utilises `vite` seul, tu peux pointer vers un mock ou désactiver
    },
  },
});
