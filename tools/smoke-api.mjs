// Smoke test of the shipped API (dist/main.js, emitted by tsc, not the SWC test build).
// Starts it on a free local port, checks GET /api/health, then stops it. Run after `pnpm build`.
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const port = await new Promise((resolve) => {
  const srv = createServer().listen(0, "127.0.0.1", () => {
    const free = srv.address().port;
    srv.close(() => resolve(free));
  });
});

const api = spawn(process.execPath, ["apps/api/dist/main.js"], {
  env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
  stdio: ["ignore", "inherit", "inherit"],
});

const url = `http://127.0.0.1:${port}/api/health`;
let ok = false;
try {
  for (let i = 0; i < 40 && !ok; i++) {
    if (api.exitCode !== null)
      throw new Error(`API exited with code ${api.exitCode}`);
    try {
      const res = await fetch(url);
      const body = await res.json();
      if (res.status !== 200 || body.status !== "ok") {
        throw new Error(
          `Unexpected response ${res.status}: ${JSON.stringify(body)}`,
        );
      }
      ok = true;
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Unexpected"))
        throw err;
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  if (!ok) throw new Error(`No answer from ${url} within 10 s`);
  console.log(`smoke: ${url} ok`);
} finally {
  api.kill();
}
