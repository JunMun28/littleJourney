import { defineConfig } from "@tanstack/start/config";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  routers: {
    client: {
      entry: "./src/entry-client.tsx",
    },
    ssr: {
      entry: "./src/entry-server.tsx",
    },
  },
  tsr: {
    appDirectory: "./src",
    routesDirectory: "./src/routes",
    generatedRouteTree: "./src/routeTree.gen.ts",
  },
  vite: {
    plugins: [viteTsConfigPaths()],
  },
});
