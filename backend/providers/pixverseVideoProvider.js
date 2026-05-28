const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { buildVideoPrompt } = require("../prompts");

const DEFAULT_BASE_URL = "https://app-api.pixverse.ai";
const DEFAULT_MODEL = "v6";
const DEFAULT_DURATION = 8;
const DEFAULT_QUALITY = "720p";
const DEFAULT_POLL_INTERVAL_MS = 3000;
const DEFAULT_TIMEOUT_MS = 120000;

function getApiKey() {
  return process.env.PIXVERSE_API_KEY || "";
}

function getBaseUrl() {
  return (process.env.PIXVERSE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function getModel() {
  return process.env.PIXVERSE_VIDEO_MODEL || DEFAULT_MODEL;
}

function getDuration() {
  return Number(process.env.PIXVERSE_VIDEO_DURATION || DEFAULT_DURATION);
}

function getQuality() {
  return process.env.PIXVERSE_VIDEO_QUALITY || DEFAULT_QUALITY;
}

function hasConfig() {
  return Boolean(getApiKey());
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function traceId() {
  return crypto.randomUUID();
}

function headers(extra = {}) {
  return {
    "API-KEY": getApiKey(),
    "Ai-trace-id": traceId(),
    ...extra
  };
}

function mimeFromPath(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg") return "image/jpg";
  return "image/jpeg";
}

function fileNameFromPath(filePath) {
  return path.basename(filePath) || "battle-standoff.png";
}

function isLocalUrl(url) {
  return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(url || "");
}

async function uploadImageFromFile(filePath) {
  const buffer = await fs.readFile(filePath);
  const form = new FormData();
  form.append("image", new Blob([buffer], { type: mimeFromPath(filePath) }), fileNameFromPath(filePath));

  const response = await fetch(`${getBaseUrl()}/openapi/v2/image/upload`, {
    method: "POST",
    headers: headers(),
    body: form
  });
  return parsePixverseResponse(response, "PixVerse image upload failed.");
}

async function uploadImageFromUrl(imageUrl) {
  const form = new FormData();
  form.append("image_url", imageUrl);

  const response = await fetch(`${getBaseUrl()}/openapi/v2/image/upload`, {
    method: "POST",
    headers: headers(),
    body: form
  });
  return parsePixverseResponse(response, "PixVerse image URL upload failed.");
}

async function parsePixverseResponse(response, fallbackMessage) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ErrCode !== 0) {
    throw new Error(body.ErrMsg || fallbackMessage);
  }
  return body.Resp || {};
}

async function uploadImage(image) {
  if (image?.sourcePath) {
    return uploadImageFromFile(image.sourcePath);
  }

  if (image?.imageUrl && !isLocalUrl(image.imageUrl)) {
    return uploadImageFromUrl(image.imageUrl);
  }

  throw new Error("PixVerse needs a public image URL or a local sourcePath to upload.");
}

async function createImageToVideoTask(imgId, prompt) {
  const response = await fetch(`${getBaseUrl()}/openapi/v2/video/img/generate`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      duration: getDuration(),
      img_id: imgId,
      model: getModel(),
      motion_mode: "normal",
      prompt,
      quality: getQuality(),
      seed: 0,
      generate_audio_switch: false
    })
  });
  return parsePixverseResponse(response, "PixVerse image-to-video generation failed.");
}

async function getVideoResult(videoId) {
  const response = await fetch(`${getBaseUrl()}/openapi/v2/video/result/${videoId}`, {
    method: "GET",
    headers: headers()
  });
  return parsePixverseResponse(response, "PixVerse video status request failed.");
}

async function pollVideo(videoId) {
  const timeoutAt = Date.now() + Number(process.env.PIXVERSE_VIDEO_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const interval = Number(process.env.PIXVERSE_VIDEO_POLL_INTERVAL_MS || DEFAULT_POLL_INTERVAL_MS);

  while (Date.now() < timeoutAt) {
    const result = await getVideoResult(videoId);
    if (result.status === 1) return result;
    if (result.status === 7) throw new Error("PixVerse content moderation failed.");
    if (result.status === 8) throw new Error("PixVerse video generation failed.");
    await wait(interval);
  }

  throw new Error("PixVerse video generation timed out.");
}

async function generateBattleVideo(payload, judgeResult, context) {
  const image = context.image;
  const uploadedImage = await uploadImage(image);
  const imgId = uploadedImage.img_id;
  if (typeof imgId !== "number") {
    throw new Error("PixVerse upload did not return img_id.");
  }

  const prompt = buildVideoPrompt(judgeResult.winnerSide);
  const task = await createImageToVideoTask(imgId, prompt);
  const videoId = task.video_id;
  if (typeof videoId !== "number") {
    throw new Error("PixVerse generation did not return video_id.");
  }

  const result = await pollVideo(videoId);
  if (!result.url) {
    throw new Error("PixVerse completed without a video URL.");
  }

  return {
    videoUrl: result.url,
    coverUrl: image?.imageUrl || uploadedImage.img_url || context.assetUrl("/assets/static/格斗占位图.png"),
    prompt,
    provider: "pixverse",
    model: getModel(),
    videoId,
    imgId,
    quality: getQuality(),
    duration: getDuration()
  };
}

module.exports = {
  hasConfig,
  generateBattleVideo
};
