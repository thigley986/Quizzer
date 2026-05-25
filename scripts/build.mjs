import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const publicDir = path.join(root, "public");
const distDir = path.join(root, "dist");
const requiredFiles = ["index.html", "styles.css", "app.js"];

for (const file of requiredFiles) {
  const target = path.join(publicDir, file);

  if (!existsSync(target)) {
    throw new Error(`Missing required public file: ${file}`);
  }
}

const appSource = await readFile(path.join(publicDir, "app.js"), "utf8");
const hasHorseContent = /\b(horse|horses|equestrian|riding|tack|breed)\b/i.test(
  appSource,
);

if (hasHorseContent) {
  throw new Error("Question content must not include horse or equestrian topics.");
}

if (process.argv.includes("--check")) {
  console.log("Static app checks passed.");
  process.exit(0);
}

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });
await cp(publicDir, distDir, { recursive: true });

console.log("Built static app to dist/.");
