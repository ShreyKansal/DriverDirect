import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";
import { resolvePackages } from "../tools/builtinRegistry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MODULE_TO_PACKAGE = JSON.parse(
  readFileSync(join(__dirname, "../data/moduleToPackage.json"), "utf8")
);
const BASE_IMAGE_PACKAGES = new Set(
  JSON.parse(readFileSync(join(__dirname, "../data/baseImagePackages.json"), "utf8"))
);

function extractImportsFromCode(code = "") {
  const packages = new Set();
  const lines = code.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // "import X" or "import X as Y"
    const importMatch = trimmed.match(/^import\s+([\w.]+)/);
    if (importMatch) {
      const root = importMatch[1].split(".")[0];
      const pkg = MODULE_TO_PACKAGE[root] || (root.includes("_") ? root.replace(/_/g, "-") : null);
      if (pkg) packages.add(pkg);
    }
    // "from X import Y" or "from X.Y import Z"
    const fromMatch = trimmed.match(/^from\s+([\w.]+)\s+import/);
    if (fromMatch) {
      const root = fromMatch[1].split(".")[0];
      const pkg = MODULE_TO_PACKAGE[root] || (root.includes("_") ? root.replace(/_/g, "-") : null);
      if (pkg) packages.add(pkg);
    }
  }
  return [...packages];
}

export function collectDependencies(workflow) {
  const allPackages = new Set();

  for (const node of workflow.nodes || []) {
    // Built-in tools → known packages from registry
    const builtinPkgs = resolvePackages((node.builtinTools || []).map((t) => t.id));
    for (const pkg of builtinPkgs) allPackages.add(pkg);

    // Custom tools → parse import statements
    for (const tool of node.customTools || []) {
      const pkgs = extractImportsFromCode(tool.code || "");
      for (const pkg of pkgs) allPackages.add(pkg);
    }
  }

  // Filter out packages already baked into the base Docker image
  const toInstall = [...allPackages].filter((pkg) => !BASE_IMAGE_PACKAGES.has(pkg));

  return {
    all: [...allPackages],
    toInstall,
    alreadyInBaseImage: [...allPackages].filter((pkg) => BASE_IMAGE_PACKAGES.has(pkg))
  };
}
