import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// UX prototype only: demo data, no backend, no /api proxy, never deployed.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5174,
    strictPort: true,
  },
  test: {
    environment: "jsdom",
  },
});
