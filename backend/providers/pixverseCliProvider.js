const fs = require("fs/promises");
const path = require("path");
const { exec, execSync } = require("child_process");
const { buildImagePrompt, buildVideoPrompt } = require("../prompts");

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm"];
const DEFAULT_TIMEOUT_MS = 20 * 60 * 1000;
const DEFAULT_IMAGE_COMMAND = [
  "{pixverse} create image",
  "--prompt {prompt}",
  "--images {referenceImages}",
  "--model seedream-4.5",
  "--quality 2160p",
  "--aspect-ratio 16:9",
  "--json"
].join(" ");
const DEFAULT_VIDEO_COMMAND = [
  "{pixverse} create video",
  "--prompt {prompt}",
  "--image {inputImage}",
  "--model v6",
  "--quality 1080p",
  "--duration 8",
  "--json"
].join(" ");

function getPixverseBin() {
  return process.env.PIXVERSE_CLI_BIN || "pixverse";
}

function commandExists(commandName = getPixverseBin()) {
  try {
    execSync(`command -v ${shellQuote(commandName)}`, {
      shell: true,
      stdio: "ignore",
      env: process.env
    });
    return true;
  } catch {
    return false;
  }
}

function hasImageConfig() {
  return process.env.PIXVERSE_CLI_DISABLED !== "1";
}

function hasVideoConfig() {
  return process.env.PIXVERSE_CLI_DISABLED !== "1";
}

function getImageCommandTemplate() {
  const template = process.env.PIXVERSE_CLI_IMAGE_COMMAND || DEFAULT_IMAGE_COMMAND;
  if (/\{referenceImages\}|--images?\s/.test(template)) return template;
  return `${template} --images {referenceImages}`;
}

function getVideoCommandTemplate() {
  return process.env.PIXVERSE_CLI_VIDEO_COMMAND || DEFAULT_VIDEO_COMMAND;
}

function shellQuote(value) {
  const text = String(value ?? "");
  return `'${text.replace(/'/g, `'\\''`)}'`;
}

function renderCommand(template, values) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => {
    if (!(key in values)) return "";
    if (Array.isArray(values[key])) return values[key].map(shellQuote).join(" ");
    return shellQuote(values[key]);
  });
}

function runCommand(command, cwd) {
  const timeout = Number(process.env.PIXVERSE_CLI_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  return new Promise((resolve, reject) => {
    exec(command, {
      cwd,
      timeout,
      maxBuffer: 10 * 1024 * 1024,
      env: process.env
    }, (error, stdout, stderr) => {
      if (error) {
        error.message = `${error.message}\n${stderr || ""}`.trim();
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeText(filePath, text) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, text, "utf8");
}

function safeJson(text) {
  const trimmed = `${text || ""}`.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function pathExists(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function collectFiles(dir, extensions, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(filePath, extensions, results);
    } else if (extensions.includes(path.extname(entry.name).toLowerCase())) {
      const stat = await fs.stat(filePath);
      results.push({ filePath, mtimeMs: stat.mtimeMs });
    }
  }
  return results;
}

async function newestFile(dir, extensions) {
  const files = await collectFiles(dir, extensions);
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return files[0]?.filePath || null;
}

function publicGeneratedPath(context, filePath) {
  const relative = path.relative(context.rootDir, filePath).split(path.sep).join("/");
  return `/${relative}`;
}

function outputFromJson(parsed, kind) {
  if (!parsed) return {};
  if (kind === "image") {
    return {
      url: parsed.imageUrl || parsed.image_url || parsed.url,
      path: parsed.imagePath || parsed.image_path || parsed.path || parsed.output
    };
  }
  return {
    url: parsed.videoUrl || parsed.video_url || parsed.url,
    path: parsed.videoPath || parsed.video_path || parsed.path || parsed.output
  };
}

async function resolveGeneratedResult({ parsed, kind, defaultPath, outputDir, context }) {
  const fromJson = outputFromJson(parsed, kind);
  const candidatePath = fromJson.path
    ? path.resolve(context.rootDir, fromJson.path)
    : defaultPath;

  if (candidatePath && await pathExists(candidatePath)) {
    return {
      sourcePath: candidatePath,
      url: context.assetUrl(publicGeneratedPath(context, candidatePath))
    };
  }

  const foundPath = await newestFile(outputDir, kind === "image" ? IMAGE_EXTENSIONS : VIDEO_EXTENSIONS);
  if (foundPath) {
    return {
      sourcePath: foundPath,
      url: context.assetUrl(publicGeneratedPath(context, foundPath))
    };
  }

  if (fromJson.url) {
    return {
      sourcePath: null,
      url: fromJson.url
    };
  }

  throw new Error(`PixVerse CLI did not produce a ${kind} result.`);
}

async function resolveReferencePath(value, context) {
  const raw = `${value || ""}`.trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  const candidates = [];
  if (raw.startsWith("/")) {
    candidates.push(context.assetPath(raw));
  }

  candidates.push(path.resolve(context.rootDir, "frontend", "app", raw));
  candidates.push(path.resolve(context.rootDir, raw.replace(/^\/+/, "")));

  for (const candidate of candidates) {
    if (await pathExists(candidate)) return candidate;
  }
  return null;
}

async function collectImageReferences(payload, context) {
  const arenaImage = context.assetPath("/assets/static/格斗擂台背景底图.png");
  const references = [
    { role: "arena background", path: arenaImage }
  ];

  const slots = [
    ["left character", payload.players.left.character],
    ["left weapon", payload.players.left.weapon],
    ["right character", payload.players.right.character],
    ["right weapon", payload.players.right.weapon]
  ];

  for (const [role, input] of slots) {
    const source = input?.referenceImageUrl || input?.assetPath;
    const resolved = await resolveReferencePath(source, context);
    if (resolved) references.push({ role, path: resolved });
  }

  return references;
}

async function generateBattleImage(payload, context) {
  const outputDir = path.join(context.jobDir, "seedream-image");
  const outputImage = path.join(outputDir, "battle-standoff.png");
  const prompt = buildImagePrompt(payload);
  const promptFile = path.join(outputDir, "seedream-image-prompt.txt");
  const references = await collectImageReferences(payload, context);
  const referenceFile = path.join(outputDir, "image-references.json");

  await ensureDir(outputDir);
  await writeText(promptFile, prompt);
  await writeText(referenceFile, JSON.stringify(references, null, 2));

  const command = renderCommand(getImageCommandTemplate(), {
    prompt,
    promptFile,
    outputDir,
    outputImage,
    arenaImage: context.assetPath("/assets/static/格斗擂台背景底图.png"),
    referenceImages: references.map(reference => reference.path),
    pixverse: getPixverseBin()
  });
  const { stdout, stderr } = await runCommand(command, context.rootDir);
  const parsed = safeJson(stdout);
  const result = await resolveGeneratedResult({
    parsed,
    kind: "image",
    defaultPath: outputImage,
    outputDir,
    context
  });

  return {
    imageUrl: result.url,
    sourcePath: result.sourcePath,
    prompt,
    references,
    provider: "pixverse_cli_seedream",
    command,
    stdout,
    stderr
  };
}

async function generateBattleVideo(payload, judgeResult, context) {
  const outputDir = path.join(context.jobDir, "pixverse-video");
  const outputVideo = path.join(outputDir, "battle-video.mp4");
  const prompt = buildVideoPrompt(judgeResult.winnerSide);
  const promptFile = path.join(outputDir, "pixverse-video-prompt.txt");
  const inputImage = context.image?.sourcePath || context.image?.imageUrl;

  if (!inputImage) {
    throw new Error("PixVerse CLI video generation needs an input image path or URL.");
  }

  await ensureDir(outputDir);
  await writeText(promptFile, prompt);

  const command = renderCommand(getVideoCommandTemplate(), {
    prompt,
    promptFile,
    outputDir,
    outputVideo,
    inputImage,
    winnerSide: judgeResult.winnerSide,
    pixverse: getPixverseBin()
  });
  const { stdout, stderr } = await runCommand(command, context.rootDir);
  const parsed = safeJson(stdout);
  const result = await resolveGeneratedResult({
    parsed,
    kind: "video",
    defaultPath: outputVideo,
    outputDir,
    context
  });

  return {
    videoUrl: result.url,
    coverUrl: context.image?.imageUrl,
    sourcePath: result.sourcePath,
    prompt,
    provider: "pixverse_cli_v6",
    command,
    stdout,
    stderr
  };
}

module.exports = {
  hasImageConfig,
  hasVideoConfig,
  commandExists,
  generateBattleImage,
  generateBattleVideo
};
