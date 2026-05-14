import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const SANDBOX_IMAGE   = "driverdirect/tool-sandbox:latest";
const SANDBOX_LABEL   = "driverdirect.sandbox=true";
const HEALTH_TIMEOUT  = 15000;  // ms to wait for container to be ready
const HEALTH_INTERVAL = 300;    // ms between /health polls
const BOOTSTRAP_TIMEOUT = 120000; // ms for pip install phase
const TOOL_CALL_TIMEOUT = 35000;  // ms per tool execution (slightly above the python signal.alarm)

// In-memory registry: runId → { containerId, baseUrl }
const registry = new Map();

function containerName(runId) {
  return `sandbox_${runId.replace(/[^a-z0-9]/gi, "_")}`;
}

async function dockerRun(name) {
  const cmd = [
    "docker run -d",
    "--rm",
    `--name ${name}`,
    `--label ${SANDBOX_LABEL}`,
    "--memory 256m",
    "--cpus 0.5",
    "--network bridge",   // start with internet access for bootstrap pip installs
    "--tmpfs /tmp:rw,size=64m",
    SANDBOX_IMAGE
  ].join(" ");

  const { stdout } = await execAsync(cmd);
  return stdout.trim();
}

async function pollHealth(baseUrl) {
  const deadline = Date.now() + HEALTH_TIMEOUT;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) return true;
    } catch {
      // container not ready yet
    }
    await new Promise((r) => setTimeout(r, HEALTH_INTERVAL));
  }
  throw new Error("Sandbox container did not become healthy in time.");
}

async function getContainerPort(containerId) {
  const { stdout } = await execAsync(`docker inspect --format "{{(index (index .NetworkSettings.Ports \\"8080/tcp\\") 0).HostPort}}" ${containerId}`);
  const port = stdout.trim();
  if (!port || isNaN(Number(port))) throw new Error("Could not determine sandbox container port.");
  return Number(port);
}

export async function startSandbox(runId) {
  const name = containerName(runId);

  // Run with a published port (Docker assigns a random host port)
  const cmd = [
    "docker run -d",
    "--rm",
    `--name ${name}`,
    `--label ${SANDBOX_LABEL}`,
    "--memory 256m",
    "--cpus 0.5",
    "-p 8080",  // publish container 8080 to a random host port
    "--tmpfs /tmp:rw,size=64m",
    SANDBOX_IMAGE
  ].join(" ");

  const { stdout } = await execAsync(cmd);
  const containerId = stdout.trim();

  const port = await getContainerPort(containerId);
  const baseUrl = `http://localhost:${port}`;

  await pollHealth(baseUrl);

  registry.set(runId, { containerId, baseUrl, name });
  return { containerId, baseUrl };
}

export async function bootstrap(runId, packages, onProgress) {
  const entry = registry.get(runId);
  if (!entry) throw new Error(`No sandbox found for run ${runId}`);

  if (!packages || packages.length === 0) {
    onProgress?.({ type: "bootstrap_complete", packages: [] });
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BOOTSTRAP_TIMEOUT);

  try {
    const res = await fetch(`${entry.baseUrl}/bootstrap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packages }),
      signal: controller.signal
    });

    const data = await res.json();

    if (data.ready) {
      onProgress?.({ type: "bootstrap_complete", packages: data.installed || [] });
    } else {
      throw new Error(data.error || "Bootstrap failed with unknown error.");
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function callTool(runId, { toolCallId, code, functionName, input }) {
  const entry = registry.get(runId);
  if (!entry) throw new Error(`No sandbox found for run ${runId}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TOOL_CALL_TIMEOUT);

  try {
    const res = await fetch(`${entry.baseUrl}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, function_name: functionName, input }),
      signal: controller.signal
    });

    if (!res.ok) {
      const text = await res.text().catch(() => `HTTP ${res.status}`);
      return { output: null, error: `Sandbox HTTP ${res.status}: ${text.slice(0, 300)}`, executionMs: 0 };
    }

    return await res.json(); // { output, error, executionMs }
  } finally {
    clearTimeout(timer);
  }
}

export async function stopSandbox(runId) {
  const entry = registry.get(runId);
  if (!entry) return;
  registry.delete(runId);
  try {
    await execAsync(`docker stop ${entry.containerId} 2>/dev/null || true`);
  } catch {
    // already stopped — ignore
  }
}

export async function cleanupOrphans() {
  try {
    const { stdout } = await execAsync(`docker ps -q --filter "label=${SANDBOX_LABEL}"`);
    const ids = stdout.trim().split("\n").filter(Boolean);
    await Promise.all(ids.map((id) => execAsync(`docker stop ${id}`).catch(() => {})));
    if (ids.length) console.log(`[sandbox] Cleaned up ${ids.length} orphaned sandbox container(s).`);
  } catch {
    // Docker may not be installed — silently skip
  }
}
