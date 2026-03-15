import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const backendUrl = "http://127.0.0.1:8787/api/health";
const frontendCwd = process.cwd();
const backendCwd = fileURLToPath(new URL("../backend/", import.meta.url));

let shuttingDown = false;
let frontendProcess = null;

function pipeOutput(child, label) {
  const attach = (stream, method) => {
    if (!stream) return;
    const rl = createInterface({ input: stream });
    rl.on("line", (line) => {
      const text = line.trimEnd();
      if (!text) return;
      method(`[${label}] ${text}`);
    });
  };

  attach(child.stdout, console.log);
  attach(child.stderr, console.error);
}

function spawnNpm(args, options = {}) {
  const child = spawn(npmCommand, args, {
    cwd: options.cwd ?? frontendCwd,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
    shell: isWindows
  });

  pipeOutput(child, options.label ?? args.join(" "));
  return child;
}

async function terminate(child) {
  if (!child || child.killed) return;

  if (isWindows) {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
        stdio: "ignore"
      });
      killer.on("exit", () => resolve());
      killer.on("error", () => resolve());
    });
    return;
  }

  child.kill("SIGINT");
  await new Promise((resolve) => {
    child.once("exit", resolve);
    setTimeout(resolve, 3000);
  });
}

async function waitForBackendReady(timeoutMs = 45000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(backendUrl);
      if (response.ok) {
        return true;
      }
    } catch {
      // Retry until the backend is ready or times out.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return false;
}

async function shutdown(code = 0, backendProcess = null) {
  if (shuttingDown) return;
  shuttingDown = true;

  await Promise.all([
    terminate(frontendProcess),
    terminate(backendProcess)
  ]);

  process.exit(code);
}

async function main() {
  const backendProcess = spawnNpm(["run", "dev"], {
    cwd: backendCwd,
    label: "backend"
  });

  backendProcess.once("exit", (code) => {
    if (shuttingDown) return;
    console.error(`[backend] exited before startup completed (code ${code ?? "unknown"}).`);
    shutdown(code ?? 1, backendProcess);
  });

  console.log("Starting backend and waiting for http://127.0.0.1:8787/api/health ...");
  const backendReady = await waitForBackendReady();

  if (!backendReady) {
    console.error("Backend did not become ready within 45 seconds.");
    await shutdown(1, backendProcess);
    return;
  }

  console.log("Backend is ready. Starting frontend dev server.");
  frontendProcess = spawnNpm(["run", "dev:frontend"], {
    cwd: frontendCwd,
    label: "frontend"
  });

  frontendProcess.once("exit", (code) => {
    if (shuttingDown) return;
    console.error(`[frontend] exited unexpectedly (code ${code ?? "unknown"}).`);
    shutdown(code ?? 1, backendProcess);
  });

  const signalHandler = () => shutdown(0, backendProcess);
  process.on("SIGINT", signalHandler);
  process.on("SIGTERM", signalHandler);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

