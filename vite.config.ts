import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => ({
  resolve: { dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"] },
  plugins: [
    tsconfigPaths(),
    tanstackStart({
      // Entry com wrapper de erro SSR (src/server.ts).
      server: { entry: "server" },
    }),
    viteReact(),
    tailwindcss(),
    // Nitro so no build: em dev o preset vercel tenta emular o runtime da Vercel e o SSR fica indisponivel.
    command === "build" && nitro({ preset: "vercel" }),
  ],
}));
