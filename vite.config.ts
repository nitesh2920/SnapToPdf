import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";



export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

