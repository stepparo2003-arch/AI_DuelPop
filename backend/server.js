const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");
const ROOT_DIR = path.resolve(__dirname, "..");

function loadEnvFile() {
  const envPath = path.join(ROOT_DIR, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const mockProvider = require("./providers/mockProvider");
const qwenJudgeProvider = require("./providers/qwenJudgeProvider");
const pixverseVideoProvider = require("./providers/pixverseVideoProvider");
const pixverseCliProvider = require("./providers/pixverseCliProvider");
const { imageSystemPrompt, judgeSystemPrompt } = require("./prompts");

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const FRONTEND_FILE = path.join(ROOT_DIR, "frontend", "app", "index.html");
const GENERATED_DIR = path.join(ROOT_DIR, "backend", "generated");
const DATA_DIR = path.join(ROOT_DIR, "backend", "data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const REQUIRE_REAL_GENERATION = process.env.REQUIRE_REAL_GENERATION === "1";

const jobs = new Map();
let historyCache = null;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".md": "text/markdown; charset=utf-8"
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end(body);
}

function sendNoContent(res) {
  res.writeHead(204, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end();
}

function notFound(res) {
  sendJson(res, 404, { error: { code: "not_found", message: "Resource not found." } });
}

function badRequest(res, message, details) {
  sendJson(res, 400, { error: { code: "bad_request", message, details } });
}

function internalError(res, message) {
  sendJson(res, 500, { error: { code: "internal_error", message } });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
    req.on("error", reject);
  });
}

function publicUrl(req, pathname) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host || `${HOST}:${PORT}`;
  return `${proto}://${host}${encodeURI(pathname)}`;
}

function validateInput(input) {
  if (!input || typeof input !== "object") return false;
  if (input.mode === "preset") return Boolean(input.name && input.assetPath);
  if (input.mode === "custom") return Boolean((input.prompt || "").trim() || input.referenceImageUrl);
  return false;
}

function validateBattlePayload(payload) {
  const missing = [];
  const players = payload?.players || {};
  for (const side of ["left", "right"]) {
    const player = players[side] || {};
    if (!validateInput(player.character)) missing.push(`${side}.character`);
    if (!validateInput(player.weapon)) missing.push(`${side}.weapon`);
  }
  return missing;
}

function serializeJob(job) {
  return {
    id: job.id,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    input: job.input,
    result: job.result,
    error: job.error
  };
}

function updateJob(job, patch) {
  Object.assign(job, patch, { updatedAt: new Date().toISOString() });
}

async function ensureDataDir() {
  await fs.promises.mkdir(DATA_DIR, { recursive: true });
}

async function readHistory() {
  if (historyCache) return historyCache;
  try {
    const raw = await fs.promises.readFile(HISTORY_FILE, "utf8");
    const parsed = JSON.parse(raw);
    historyCache = Array.isArray(parsed) ? parsed : [];
  } catch {
    historyCache = [];
  }
  return historyCache;
}

async function writeHistory(records) {
  historyCache = records;
  await ensureDataDir();
  await fs.promises.writeFile(HISTORY_FILE, JSON.stringify(records, null, 2), "utf8");
}

function compactProviderResult(result) {
  if (!result) return null;
  const copy = { ...result };
  delete copy.stdout;
  delete copy.stderr;
  delete copy.command;
  delete copy.sourcePath;
  return copy;
}

async function recordCompletedBattle(job, context) {
  const records = await readHistory();
  const image = compactProviderResult(job.result?.image);
  const judge = compactProviderResult(job.result?.judge);
  const video = compactProviderResult(job.result?.video);
  const record = {
    id: job.id,
    createdAt: job.createdAt,
    completedAt: job.updatedAt,
    title: `Battle ${new Date(job.createdAt).toLocaleString("en-US", { hour12: false })}`,
    input: job.input,
    assets: {
      arenaBackground: {
        label: "Fixed arena background",
        imageUrl: context.assetUrl("/assets/static/格斗擂台背景底图.png")
      },
      seedreamImage: image,
      qwenJudge: judge,
      pixverseVideo: video
    },
    prompts: {
      seedream: image?.prompt || "",
      qwen: judgeSystemPrompt,
      pixverse: video?.prompt || ""
    },
    providers: {
      image: image?.provider || "unknown",
      judge: judge?.provider || "unknown",
      video: video?.provider || "unknown"
    }
  };
  const nextRecords = [record, ...records.filter(item => item.id !== job.id)].slice(0, 100);
  await writeHistory(nextRecords);
}

async function runBattleJob(job, req) {
  const context = {
    assetUrl: pathname => publicUrl(req, pathname),
    assetPath: pathname => path.join(ROOT_DIR, pathname.replace(/^\/+/, "")),
    rootDir: ROOT_DIR,
    jobDir: path.join(GENERATED_DIR, job.id)
  };

  try {
    updateJob(job, { status: "running", stage: "image_generating", progress: 18 });
    let image;
    try {
      image = pixverseCliProvider.hasImageConfig()
        ? await pixverseCliProvider.generateBattleImage(job.input, context)
        : await mockProvider.generateBattleImage(job.input, context);
    } catch (imageError) {
      if (REQUIRE_REAL_GENERATION) throw imageError;
      image = await mockProvider.generateBattleImage(job.input, context);
      image.provider = "mock_fallback";
      image.fallbackReason = imageError.message || "Seedream CLI image generation failed.";
    }

    updateJob(job, {
      stage: "judge_running",
      progress: 48,
      result: { ...job.result, image }
    });
    let judge;
    try {
      judge = qwenJudgeProvider.hasConfig()
        ? await qwenJudgeProvider.judgeBattle(job.input, image)
        : await mockProvider.judgeBattle(job.input, image);
    } catch (judgeError) {
      judge = await mockProvider.judgeBattle(job.input, image);
      judge.provider = "mock_fallback";
      judge.fallbackReason = judgeError.message || "Qwen judge failed.";
    }

    updateJob(job, {
      stage: "video_generating",
      progress: 76,
      result: { ...job.result, image, judge }
    });
    let video;
    try {
      video = pixverseCliProvider.hasVideoConfig()
        ? await pixverseCliProvider.generateBattleVideo(job.input, judge, { ...context, image })
        : pixverseVideoProvider.hasConfig()
        ? await pixverseVideoProvider.generateBattleVideo(job.input, judge, { ...context, image })
        : await mockProvider.generateBattleVideo(job.input, judge, context);
    } catch (videoError) {
      if (REQUIRE_REAL_GENERATION) throw videoError;
      video = await mockProvider.generateBattleVideo(job.input, judge, context);
      video.provider = "mock_fallback";
      video.fallbackReason = videoError.message || "PixVerse video generation failed.";
    }

    updateJob(job, {
      status: "completed",
      stage: "completed",
      progress: 100,
      result: { image, judge, video }
    });
    try {
      await recordCompletedBattle(job, context);
    } catch (recordError) {
      console.warn("Battle completed, but history record could not be saved:", recordError.message || recordError);
    }
  } catch (error) {
    updateJob(job, {
      status: "failed",
      stage: "failed",
      error: {
        code: "generation_failed",
        message: error.message || "Battle generation failed."
      }
    });
  }
}

function createBattleJob(payload, req) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const job = {
    id,
    status: "queued",
    stage: "queued",
    progress: 0,
    createdAt: now,
    updatedAt: now,
    input: payload,
    result: null,
    error: null
  };

  jobs.set(id, job);
  setTimeout(() => runBattleJob(job, req), 0);
  return job;
}

function resolveStaticPath(urlPathname) {
  const decoded = decodeURIComponent(urlPathname);
  if (decoded === "/" || decoded === "/index.html") return FRONTEND_FILE;
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const absolute = path.join(ROOT_DIR, normalized);
  if (!absolute.startsWith(ROOT_DIR)) return null;
  return absolute;
}

function streamStatic(req, res, filePath) {
  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) {
      notFound(res);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";
    const range = req.headers.range;

    if (range) {
      const match = range.match(/bytes=(\d*)-(\d*)/);
      if (!match) {
        res.writeHead(416);
        res.end();
        return;
      }
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : stat.size - 1;
      if (start >= stat.size || end >= stat.size || start > end) {
        res.writeHead(416, { "content-range": `bytes */${stat.size}` });
        res.end();
        return;
      }
      res.writeHead(206, {
        "content-type": contentType,
        "content-length": end - start + 1,
        "content-range": `bytes ${start}-${end}/${stat.size}`,
        "accept-ranges": "bytes",
        "access-control-allow-origin": "*"
      });
      fs.createReadStream(filePath, { start, end }).pipe(res);
      return;
    }

    res.writeHead(200, {
      "content-type": contentType,
      "content-length": stat.size,
      "accept-ranges": "bytes",
      "access-control-allow-origin": "*"
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

async function handleApi(req, res, url) {
  if (req.method === "OPTIONS") {
    sendNoContent(res);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      service: "ai-arena-duel",
      mode: qwenJudgeProvider.hasConfig() ? "qwen-judge" : "mock",
      judgeProvider: qwenJudgeProvider.hasConfig() ? "qwen" : "mock",
      imageProvider: pixverseCliProvider.hasImageConfig() ? "pixverse_cli_seedream" : "mock",
      videoProvider: pixverseCliProvider.hasVideoConfig()
        ? "pixverse_cli_v6"
        : pixverseVideoProvider.hasConfig()
        ? "pixverse_api"
        : "mock",
      pixverseCliAvailable: pixverseCliProvider.commandExists(),
      requireRealGeneration: REQUIRE_REAL_GENERATION,
      time: new Date().toISOString()
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/prompts") {
    sendJson(res, 200, {
      imageSystemPrompt,
      judgeSystemPrompt
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/library") {
    const records = await readHistory();
    sendJson(res, 200, { records });
    return;
  }

  const libraryMatch = url.pathname.match(/^\/api\/library\/([a-zA-Z0-9-]+)$/);
  if (req.method === "GET" && libraryMatch) {
    const records = await readHistory();
    const record = records.find(item => item.id === libraryMatch[1]);
    if (!record) {
      notFound(res);
      return;
    }
    sendJson(res, 200, { record });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/battles") {
    let payload;
    try {
      payload = await readBody(req);
    } catch (error) {
      badRequest(res, error.message);
      return;
    }

    const missing = validateBattlePayload(payload);
    if (missing.length) {
      badRequest(res, "Both players need character and weapon inputs.", { missing });
      return;
    }

    const job = createBattleJob(payload, req);
    sendJson(res, 202, serializeJob(job));
    return;
  }

  const battleMatch = url.pathname.match(/^\/api\/battles\/([a-zA-Z0-9-]+)$/);
  if (req.method === "GET" && battleMatch) {
    const job = jobs.get(battleMatch[1]);
    if (!job) {
      notFound(res);
      return;
    }
    sendJson(res, 200, serializeJob(job));
    return;
  }

  notFound(res);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      notFound(res);
      return;
    }

    const filePath = resolveStaticPath(url.pathname);
    if (!filePath) {
      notFound(res);
      return;
    }
    streamStatic(req, res, filePath);
  } catch (error) {
    internalError(res, error.message || "Unexpected server error.");
  }
});

server.listen(PORT, HOST, () => {
  console.log(`AI Arena Duel backend running at http://${HOST}:${PORT}`);
  console.log(`Frontend: http://${HOST}:${PORT}/frontend/app/index.html`);
});
