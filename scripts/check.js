const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
function check(file) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status || 1);
}
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory() && !["generated", "data", "node_modules"].includes(entry.name)) walk(file);
    else if (entry.isFile() && /\.(js|cjs)$/.test(file)) check(file);
  }
}
for (const dir of ["backend", "scripts", "tests"]) walk(path.join(root, dir));
const html = fs.readFileSync(path.join(root, "frontend", "app", "index.html"), "utf8");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ai-duelpop-check-"));
try {
  let index = 0;
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/.test(match[1])) continue;
    const file = path.join(temp, `inline-${index++}.js`);
    fs.writeFileSync(file, match[2]);
    check(file);
  }
  console.log("Backend, scripts, tests, and frontend JavaScript syntax checks passed.");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
