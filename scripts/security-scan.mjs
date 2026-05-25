import { execFile } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  ".wrangler",
  ".cloudflare",
]);
const ignoredFiles = new Set(["package-lock.json"]);
const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".txt",
  ".yml",
  ".yaml",
]);

const checks = [
  {
    name: "Private key block",
    pattern: /-----BEGIN (?:RSA|OPENSSH|DSA|EC|PGP) PRIVATE KEY-----/i,
  },
  {
    name: "GitHub token",
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
  },
  {
    name: "OpenAI API key",
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  },
  {
    name: "AWS access key",
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/,
  },
  {
    name: "Google API key",
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/,
  },
  {
    name: "Slack token",
    pattern: /\bxox[baprs]-[0-9A-Za-z-]{20,}\b/,
  },
  {
    name: "Stripe live secret key",
    pattern: /\bsk_live_[0-9A-Za-z]{20,}\b/,
  },
  {
    name: "JWT-like token",
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
  {
    name: "Secret assignment",
    pattern: /\b(?:api[_-]?key|secret|token|password|passwd|pwd|private[_-]?key)\b\s*[:=]\s*["']?[A-Za-z0-9_./+=-]{16,}/i,
  },
  {
    name: "Conversation transcript marker",
    pattern: new RegExp(
      [
        String.raw`<\/?(?:environment_context|system|developer|user|assistant)\b`,
        `${"Knowledge"} cutoff:`,
        `${"Current"} date:`,
        `You are ${"ChatGPT"}`,
        `You are ${"Codex"}`,
        `BEGIN ${"CONVERSATION"}`,
        `END ${"CONVERSATION"}`,
      ].join("|"),
      "i",
    ),
  },
];

const failures = [];

for (const filePath of await listFiles(root)) {
  const relativePath = path.relative(root, filePath);
  if (!shouldScanFile(relativePath)) {
    continue;
  }

  const content = await readFile(filePath, "utf8");
  scanContent(relativePath, content);
}

if (await hasGitRepository()) {
  const { stdout } = await execFileAsync("git", ["log", "--all", "-p", "--", "."], {
    cwd: root,
    maxBuffer: 1024 * 1024 * 50,
  });
  scanContent("git history", stdout);
}

if (failures.length > 0) {
  console.error("Security scan failed:");
  for (const failure of failures) {
    console.error(`- ${failure.check} in ${failure.location}`);
  }
  process.exit(1);
}

console.log("Security scan passed.");

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...await listFiles(absolutePath));
      }
      continue;
    }

    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function shouldScanFile(relativePath) {
  const baseName = path.basename(relativePath);
  const extension = path.extname(relativePath);
  return !ignoredFiles.has(baseName) && textExtensions.has(extension);
}

function scanContent(label, content) {
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const check of checks) {
      if (check.pattern.test(line)) {
        failures.push({
          check: check.name,
          location: `${label}:${index + 1}`,
        });
      }
    }
  });
}

async function hasGitRepository() {
  try {
    const repoPath = path.join(root, ".git");
    return (await stat(repoPath)).isDirectory();
  } catch {
    return false;
  }
}
