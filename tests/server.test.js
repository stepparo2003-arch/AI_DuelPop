const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { spawn } = require("node:child_process");

async function fixture(env = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ai-duelpop-test-"));
  await fs.cp(path.resolve(__dirname, "../backend"), path.join(root, "backend"), {
    recursive: true, filter: source => !["generated", "data"].includes(path.basename(source))
  });
  await fs.mkdir(path.join(root, "frontend/app"), { recursive: true });
  await fs.copyFile(path.resolve(__dirname, "../frontend/app/index.html"), path.join(root, "frontend/app/index.html"));
  await fs.mkdir(path.join(root, "assets/static"), { recursive: true });
  await fs.writeFile(path.join(root, "assets/static/默认格斗视频.mp4"), Buffer.alloc(64, 1));
  await fs.writeFile(path.join(root, "assets/static/格斗占位图.png"), "fixture-image");
  await fs.mkdir(path.join(root, "backend/generated/test"), { recursive: true });
  await fs.writeFile(path.join(root, "backend/generated/test/frame.png"), "generated-media");
  await fs.writeFile(path.join(root, "backend/generated/test/prompt.txt"), "private-prompt");
  await fs.writeFile(path.join(root, ".env"), "AUDIT_FAKE_VALUE=test-only\n");
  await fs.symlink(path.join(root, ".env"), path.join(root, "assets/static/escape.png"));
  const child = spawn(process.execPath, ["backend/server.js"], {
    cwd: root,
    env: { ...process.env, APP_MODE: "", PORT: "0", HOST: "127.0.0.1",
      HISTORY_FILE: path.join(root, "backend/data/history.json"),
      DASHSCOPE_API_KEY: "test-only-dummy", PIXVERSE_API_KEY: "test-only-dummy",
      PIXVERSE_CLI_DISABLED: "0", REQUIRE_REAL_GENERATION: "1", ...env },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const exited = new Promise(resolve => child.once("exit", resolve));
  let stderr = "";
  child.stderr.on("data", data => { stderr += data; });
  try {
    const base = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Server startup timeout: ${stderr}`)), 5000);
      let output = "";
      child.stdout.on("data", data => {
        output += data;
        const match = output.match(/backend running at (http:\/\/127\.0\.0\.1:\d+)/);
        if (match) { clearTimeout(timer); resolve(match[1]); }
      });
      child.once("error", error => { clearTimeout(timer); reject(error); });
      child.once("exit", code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${stderr}`)); });
    });
    return { base, root, close: async () => { child.kill(); await exited; await fs.rm(root, { recursive: true, force: true }); } };
  } catch (error) {
    child.kill(); await exited; await fs.rm(root, { recursive: true, force: true }); throw error;
  }
}
const payload = { players: Object.fromEntries(["left", "right"].map(side => [side, {
  character: { mode: "preset", name: "Bounty Hunter", assetPath: "../../assets/static/赏金猎人.png" },
  weapon: { mode: "preset", name: "Holy Sword", assetPath: "../../assets/static/圣剑.png" }
}])) };
async function battle(base) {
  const response = await fetch(`${base}/api/battles`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  assert.equal(response.status, 202);
  const queued = await response.json();
  for (let i = 0; i < 100; i++) {
    const job = await (await fetch(`${base}/api/battles/${queued.id}`)).json();
    if (["completed", "failed"].includes(job.status)) return job;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Battle timed out");
}

test("default mock workflow is offline, saves history, and serves only permitted files", async t => {
  const app = await fixture();
  t.after(app.close);
  const health = await (await fetch(`${app.base}/api/health`)).json();
  assert.equal(health.mode, "mock");
  assert.equal(health.service, "ai-duelpop");
  assert.equal(health.requireRealGeneration, false);
  for (const key of ["imageProvider", "judgeProvider", "videoProvider"]) assert.equal(health[key], "mock");
  assert.equal((await fetch(app.base)).status, 200);
  for (const file of ["/.env", "/.env.example", "/backend/server.js", "/package.json", "/backend/data/history.json",
    "/backend/generated/test/prompt.txt", "/assets/static/escape.png", "/assets/static/%2e%2e/%2e%2e/.env", "/%ZZ"]) {
    const response = await fetch(app.base + file);
    assert.equal(response.status, 404, file);
    assert.equal((await response.text()).includes("AUDIT_FAKE_VALUE"), false);
  }
  assert.equal((await fetch(`${app.base}/backend/generated/test/frame.png`)).status, 200);
  const invalid = await fetch(`${app.base}/api/battles`, { method: "POST", body: "{}" });
  assert.equal(invalid.status, 400);
  const job = await battle(app.base);
  assert.equal(job.status, "completed", JSON.stringify(job.error));
  for (const key of ["image", "judge", "video"]) assert.equal(job.result[key].provider, "mock");
  const video = await fetch(job.result.video.videoUrl, { headers: { range: "bytes=0-15" } });
  assert.equal(video.status, 206);
  assert.equal(video.headers.get("content-type"), "video/mp4");
  assert.equal((await video.arrayBuffer()).byteLength, 16);
  const records = (await (await fetch(`${app.base}/api/library`)).json()).records;
  assert.equal(records.length, 1);
  assert.equal(records[0].id, job.id);
  const persisted = JSON.parse(await fs.readFile(path.join(app.root, "backend/data/history.json"), "utf8"));
  assert.equal(persisted[0].id, job.id);
  assert.equal((await fetch(`${app.base}/backend/data/history.json`)).status, 404);
});

test("strict real mode fails honestly when the image provider is disabled", async t => {
  const app = await fixture({ APP_MODE: "real", PIXVERSE_CLI_DISABLED: "1", REQUIRE_REAL_GENERATION: "1" });
  t.after(app.close);
  const job = await battle(app.base);
  assert.equal(job.status, "failed");
  assert.equal(job.error.code, "generation_failed");
  assert.equal((await (await fetch(`${app.base}/api/library`)).json()).records.length, 0);
});
