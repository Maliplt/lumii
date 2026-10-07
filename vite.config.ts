import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  server: {
    proxy: {
      "/api/torrentio": {
        target: "https://torrentio.strem.fun",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/torrentio/, ""),
      },
      "/api/realdebrid": {
        target: "https://api.real-debrid.com/rest/1.0",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/realdebrid/, ""),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
