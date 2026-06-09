const fs = require("fs/promises");
const path = require("path");
const { judgeSystemPrompt } = require("../prompts");

const DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DEFAULT_MODEL = "qwen3.6-plus";

function getApiKey() {
  return process.env.DASHSCOPE_API_KEY || process.env.BAILIAN_API_KEY || process.env.ALIYUN_API_KEY || "";
}

function getBaseUrl() {
  return (process.env.DASHSCOPE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

function getModel() {
  return process.env.QWEN_JUDGE_MODEL || DEFAULT_MODEL;
}

function hasConfig() {
  return Boolean(getApiKey());
}

function getInputLabel(input) {
  if (!input) return "Unknown";
  if (input.mode === "custom") return input.prompt || "Custom prompt";
  return `${input.name}: ${input.description || "preset reference"}`;
}

function buildJudgeText(payload) {
  const left = payload.players.left;
  const right = payload.players.right;

  return `Please judge the arena battle standoff image and return only JSON.

Game preset roster:
- Bounty Hunter: tactical ranged fighter, disciplined targeting, flexible movement.
- Iron Brawler: durable armored close-combat pressure fighter.
- Mecha Ronin: cyber samurai, balanced precision, armor, blade-compatible style.
- Thunder Mage: ranged elemental caster, burst timing, lightning control.
- Rage Brute: heavy aggressive bruiser, raw impact, intimidation, durability.
- Shadow Assassin: fast stealth fighter, evasive movement, ambush and burst.

Game preset weapons:
- Nunchaku: fast close-range chain attacks, combo pressure, mobility.
- Holy Sword: balanced melee reach, precision, defense/offense versatility.
- Machete: brutal close-range pressure, high commitment, strong finish potential.
- Assault Rifle: flexible mid-range sustained fire, spacing control.
- Quantum Cannon: heavy energy burst, long-range power, slower handling.
- Rocket Launcher: explosive area pressure, destructive power, poor close-range handling.

Core game mechanic:
Both players choose one character and one weapon, or write custom prompts. Good pairings are not determined by raw weapon power alone. Character-weapon fit, tactical usage, range control, mobility, counterplay, arena positioning, and creative execution all matter.

Left-side fighter:
- Character: ${getInputLabel(left.character)}
- Weapon: ${getInputLabel(left.weapon)}

Right-side fighter:
- Character: ${getInputLabel(right.character)}
- Weapon: ${getInputLabel(right.weapon)}

Decide the final winner by creatively simulating how the duel may unfold.
Do not follow one crude rule such as firearm beats melee weapon, heavy weapon beats light weapon, or higher destructive power always wins.
Consider:
- character traits and physical style
- weapon-character compatibility
- how each character may actually use the selected equipment
- attack range, speed, mobility, defense, stance, timing, counters, tactical surprise, and arena positioning
- whether an unusual or weaker-looking weapon could win through better fit, technique, or matchup

After deciding the winner, write useful improvement advice for each player. For each player, include:
- brief result diagnosis
- character advice: keep current character, switch to another preset character, or improve custom character prompt
- equipment advice: keep current equipment, switch to another preset weapon, or improve custom weapon prompt
- pairing advice: how to better match character and equipment next time

Mention concrete preset names when recommending alternatives. If custom prompt would help, suggest what the player should add to the custom prompt.

Return format:
{
  "winnerSide": "left" or "right",
  "summary": "one concise sentence summarizing the outcome and the most important improvement direction",
  "playerAAnalysis": "clear post-match analysis and improvement suggestions for Player A in 3-5 concise sentences",
  "playerBAnalysis": "clear post-match analysis and improvement suggestions for Player B in 3-5 concise sentences"
}`;
}

function normalizeImageUrl(image) {
  return image?.remoteImageUrl || image?.imageUrl || image?.url || "";
}

function isLocalUrl(url) {
  return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(url || "");
}

function mimeFromPath(filePath) {
  const ext = path.extname(filePath || "").toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "image/png";
}

async function imageUrlForQwen(image) {
  const remoteUrl = image?.remoteImageUrl || "";
  if (remoteUrl && !isLocalUrl(remoteUrl)) return remoteUrl;
  if (image?.sourcePath) {
    const bytes = await fs.readFile(image.sourcePath);
    return `data:${mimeFromPath(image.sourcePath)};base64,${bytes.toString("base64")}`;
  }
  return normalizeImageUrl(image);
}

function extractJson(text) {
  const trimmed = `${text || ""}`.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Qwen judge did not return JSON.");
    return JSON.parse(match[0]);
  }
}

function normalizeJudgeResult(parsed) {
  const winnerSide = parsed?.winnerSide;
  if (winnerSide !== "left" && winnerSide !== "right") {
    throw new Error("Qwen judge returned an invalid winnerSide.");
  }

  return {
    winnerSide,
    summary: typeof parsed.summary === "string" && parsed.summary.trim()
      ? parsed.summary.trim()
      : `Player ${winnerSide === "left" ? "A" : "B"} wins. Review asset library for tactical improvement suggestions.`,
    playerAAnalysis: typeof parsed.playerAAnalysis === "string" && parsed.playerAAnalysis.trim()
      ? parsed.playerAAnalysis.trim()
      : "Player A should review the character and weapon pairing, then try a more synergistic setup or a sharper custom prompt next round.",
    playerBAnalysis: typeof parsed.playerBAnalysis === "string" && parsed.playerBAnalysis.trim()
      ? parsed.playerBAnalysis.trim()
      : "Player B should review the character and weapon pairing, then try a more synergistic setup or a sharper custom prompt next round.",
    provider: "qwen",
    model: getModel()
  };
}

async function judgeBattle(payload, image) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Missing DASHSCOPE_API_KEY for Qwen judge.");
  }

  const imageUrl = await imageUrlForQwen(image);
  const userContent = [
    {
      type: "text",
      text: buildJudgeText(payload)
    }
  ];

  if (imageUrl) {
    userContent.push({
      type: "image_url",
      image_url: { url: imageUrl }
    });
  }

  const response = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "authorization": `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: getModel(),
      messages: [
        { role: "system", content: judgeSystemPrompt },
        { role: "user", content: userContent }
      ],
      response_format: { type: "json_object" },
      temperature: 0.65
    })
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.error?.message || `Qwen judge request failed with ${response.status}.`;
    throw new Error(message);
  }

  const content = body?.choices?.[0]?.message?.content;
  return normalizeJudgeResult(extractJson(content));
}

module.exports = {
  hasConfig,
  judgeBattle
};
