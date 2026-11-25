import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// SWC compiles the Nest decorators and their metadata (ADR-010).
export default defineConfig({
  plugins: [swc.vite()],
  test: {
    environment: "node",
  },
});
