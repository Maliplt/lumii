import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

import fs from "fs";
import path from "path";

function copyGamesPlugin() {
  return {
    name: "copy-src-games",
    closeBundle() {
      const srcDir = path.resolve(process.cwd(), "src/games");
      const destDir = path.resolve(process.cwd(), "dist/src/games");
      try {
        fs.cpSync(srcDir, destDir, { recursive: true });
        const entries = fs.readdirSync(destDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const lowerName = entry.name.toLowerCase();
            if (lowerName !== entry.name) {
              const lowerDest = path.join(destDir, lowerName);
              if (!fs.existsSync(lowerDest)) {
                fs.cpSync(path.join(destDir, entry.name), lowerDest, { recursive: true });
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to copy games to dist", e);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    copyGamesPlugin(),
  ],
  build: {
    chunkSizeWarningLimit: 1500,
  },
});
