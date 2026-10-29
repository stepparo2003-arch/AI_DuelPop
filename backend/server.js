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
const GENERATED_DIR = path.join(ROOT_DIR, "backend", "generated");
const DATA_DIR = path.join(ROOT_DIR, "backend", "data");
const HISTORY_FILE = process.env.HISTORY_FILE
  ? path.resolve(process.env.HISTORY_FILE)
  : path.join(DATA_DIR, "history.json");
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const REAL_MODE = process.env.APP_MODE === "real";
const REQUIRE_REAL_GENERATION = REAL_MODE && process.env.REQUIRE_REAL_GENERATION !== "0";

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
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8"
};

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type"
  });
  res.end(body);
}

function sendNoContent(res) {
  res.writeHead(204, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
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

function firstString(...values) {
  return values.find(value => typeof value === "string" && value.trim())?.trim() || "";
}

function extractMessageFromObject(value) {
  if (!value || typeof value !== "object") return "";
  return firstString(
    value.message,
    value.Message,
    value.ErrMsg,
    value.error_description,
    value.error?.message,
    value.error?.Message,
    value.error?.ErrMsg,
    value.data?.message,
    value.data?.Message,
    value.data?.ErrMsg
  );
}

function extractProviderMessage(raw) {
  const text = `${raw || ""}`.trim();
  if (!text) return "";
  try {
    const parsed = JSON.parse(text);
    const message = extractMessageFromObject(parsed);
    if (message) return message;
  } catch {
    // Provider errors are often mixed with shell output; try extracting a JSON object below.
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const message = extractMessageFromObject(parsed);
      if (message) return message;
    } catch {
      // Fall back to line cleanup.
    }
  }

  const usefulLine = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(line =>
      line &&
      !/^Command failed:/i.test(line) &&
      !/^at\s+/i.test(line) &&
      !/^node:/i.test(line)
    );
  return usefulLine || text;
}

function conciseErrorReason(raw) {
  const message = extractProviderMessage(raw)
    .replace(/\s+/g, " ")
    .replace(/^Error:\s*/i, "")
    .trim();
  if (!message) return "the generation service did not provide a detailed reason";
  return message.length > 180 ? `${message.slice(0, 177)}...` : message;
}

function classifyGenerationFailure(reason) {
  const text = `${reason || ""}`.toLowerCase();
  if (/balance|insufficient|quota|credit|credits|billing|bill|payment|recharge|余额|额度|欠费|充值|点数/.test(text)) {
    return "billing";
  }
  if (/api[-_ ]?key|token|auth|unauthori[sz]ed|forbidden|permission|credential|login|sign in|401|403|鉴权|认证|登录|权限/.test(text)) {
    return "auth";
  }
  if (/rate limit|too many requests|throttle|429|频率|限流|请求过多/.test(text)) {
    return "rate_limit";
  }
  if (/moderation|safety|safe|policy|violation|copyright|watermark|logo|celebrity|famous|artist|character|blocked|rejected|unsafe|审核|违规|敏感|版权|水印|商标|名人/.test(text)) {
    return "content";
  }
  if (/timeout|timed out|network|econn|socket|dns|connect|connection|unreachable|超时|网络|连接/.test(text)) {
    return "network";
  }
  if (/server|internal|unavailable|maintenance|busy|5\d\d|服务|维护|繁忙/.test(text)) {
    return "service";
  }
  return "unknown";
}

function generationFailureAdvice(kind) {
  const advice = {
    billing: "Please check the PixVerse/API account balance, credits, billing status, or quota, then retry after recharging or restoring access.",
    auth: "Please check the API key, PixVerse CLI login status, account permissions, and environment configuration, then retry.",
    rate_limit: "Please wait a moment before retrying, or reduce concurrent generation requests if multiple jobs are running.",
    content: "Please revise or re-upload compliant materials. Avoid specific real people, famous artists, copyrighted characters, logos, watermarks, or unsafe content.",
    network: "Please check the network connection and service availability, then retry. If the issue repeats, try again after the connection is stable.",
    service: "The generation service may be temporarily unavailable or busy. Please retry later.",
    unknown: "Please review the submitted materials, account status, and service configuration, then try again."
  };
  return advice[kind] || advice.unknown;
}

function formatGenerationFailure(error, stage) {
  const reason = conciseErrorReason(error?.message || error);
  const kind = classifyGenerationFailure(reason);
  const stageLabel = stage === "video_generating"
    ? "Video generation failed"
    : stage === "image_generating"
    ? "Image generation failed"
    : "AI generation failed";
  return `${stageLabel}: ${reason}. ${generationFailureAdvice(kind)}`;
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sameBattleInput(left, right) {
  return stableStringify(left || {}) === stableStringify(right || {});
}

async function ensureDataDir() {
  await fs.promises.mkdir(path.dirname(HISTORY_FILE), { recursive: true });
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

async function deleteHistoryRecords(ids) {
  const idSet = new Set(ids.map(id => `${id}`.trim()).filter(Boolean));
  if (!idSet.size) return { deleted: 0, records: await readHistory() };
  const records = await readHistory();
  const nextRecords = records.filter(record => !idSet.has(`${record.id || ""}`));
  const deleted = records.length - nextRecords.length;
  if (deleted > 0) {
    await writeHistory(nextRecords);
  }
  return { deleted, records: nextRecords };
}

function findReusableBattleJob(payload) {
  for (const job of jobs.values()) {
    if ((job.status === "queued" || job.status === "running") && sameBattleInput(job.input, payload)) {
      return job;
    }
  }
  return null;
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
      if (REQUIRE_REAL_GENERATION && (!pixverseCliProvider.hasImageConfig() || !pixverseCliProvider.commandExists())) {
        throw new Error("Real image generation requires an installed and enabled PixVerse CLI.");
      }
      image = REAL_MODE && pixverseCliProvider.hasImageConfig()
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
      if (REQUIRE_REAL_GENERATION && !qwenJudgeProvider.hasConfig()) {
        throw new Error("Real judging requires DASHSCOPE_API_KEY.");
      }
      judge = REAL_MODE && qwenJudgeProvider.hasConfig()
        ? await qwenJudgeProvider.judgeBattle(job.input, image)
        : await mockProvider.judgeBattle(job.input, image);
    } catch (judgeError) {
      if (REQUIRE_REAL_GENERATION) throw judgeError;
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
      if (REQUIRE_REAL_GENERATION && !pixverseCliProvider.hasVideoConfig() && !pixverseVideoProvider.hasConfig()) {
        throw new Error("Real video generation requires PixVerse CLI or PIXVERSE_API_KEY.");
      }
      video = REAL_MODE && pixverseCliProvider.hasVideoConfig()
        ? await pixverseCliProvider.generateBattleVideo(job.input, judge, { ...context, image })
        : REAL_MODE && pixverseVideoProvider.hasConfig()
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
    const failedStage = job.stage;
    updateJob(job, {
      status: "failed",
      stage: "failed",
      error: {
        code: "generation_failed",
        message: formatGenerationFailure(error, failedStage)
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
  let decoded;
  try {
    decoded = decodeURIComponent(urlPathname);
  } catch {
    return null;
  }
  if (decoded === "/" || decoded === "/index.html") decoded = "/frontend/app/index.html";
  if (decoded.includes("\\") || decoded.includes("\0") || decoded.split("/").some(segment => segment.startsWith("."))) return null;

  const absolute = path.resolve(ROOT_DIR, `.${decoded}`);
  const mediaExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".mp4", ".mov", ".webm"]);
  const frontendExtensions = new Set([".html", ".css", ".js", ".png", ".jpg", ".svg", ".woff", ".woff2"]);
  const allowedRoots = [
    { dir: path.join(ROOT_DIR, "frontend", "app"), extensions: frontendExtensions },
    { dir: path.join(ROOT_DIR, "assets", "static"), extensions: mediaExtensions },
    { dir: GENERATED_DIR, extensions: mediaExtensions },
    { dir: path.join(ROOT_DIR, "docs", "media"), extensions: mediaExtensions }
  ];
  const rule = allowedRoots.find(({ dir, extensions }) =>
    absolute.startsWith(`${dir}${path.sep}`) && extensions.has(path.extname(absolute).toLowerCase())
  );
  if (!rule) return null;
  try {
    // Reject symlinks that escape the permitted directory, including parent-directory links.
    const actual = fs.realpathSync(absolute);
    if (!actual.startsWith(`${rule.dir}${path.sep}`)) return null;
    return actual;
  } catch {
    return null;
  }
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
      mode: REAL_MODE ? "real" : "mock",
      judgeProvider: REAL_MODE && qwenJudgeProvider.hasConfig() ? "qwen" : "mock",
      imageProvider: REAL_MODE && pixverseCliProvider.hasImageConfig() ? "pixverse_cli_seedream" : "mock",
      videoProvider: REAL_MODE && pixverseCliProvider.hasVideoConfig()
        ? "pixverse_cli_v6"
        : REAL_MODE && pixverseVideoProvider.hasConfig()
        ? "pixverse_api"
        : "mock",
      pixverseCliAvailable: REAL_MODE && pixverseCliProvider.commandExists(),
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

  if (req.method === "DELETE" && url.pathname === "/api/library") {
    let payload;
    try {
      payload = await readBody(req);
    } catch (error) {
      badRequest(res, error.message);
      return;
    }

    const ids = Array.isArray(payload.ids) ? payload.ids : [];
    if (!ids.length) {
      badRequest(res, "Provide at least one library record id to delete.");
      return;
    }

    const result = await deleteHistoryRecords(ids);
    sendJson(res, 200, result);
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

  if (req.method === "DELETE" && libraryMatch) {
    const result = await deleteHistoryRecords([libraryMatch[1]]);
    if (!result.deleted) {
      notFound(res);
      return;
    }
    sendJson(res, 200, result);
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

    const reusableJob = findReusableBattleJob(payload);
    if (reusableJob) {
      sendJson(res, 202, serializeJob(reusableJob));
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
  const listeningPort = server.address().port;
  console.log(`AI Arena Duel backend running at http://${HOST}:${listeningPort}`);
  console.log(`Frontend: http://${HOST}:${listeningPort}/frontend/app/index.html`);
});
