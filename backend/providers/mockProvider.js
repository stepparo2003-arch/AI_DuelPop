const { buildImagePrompt, buildVideoPrompt } = require("../prompts");

const weaponScores = {
  "Rocket Launcher": 70,
  "Quantum Cannon": 72,
  "Assault Rifle": 66,
  "Holy Sword": 70,
  "Thunder Staff": 68,
  "Machete": 64
};

const characterScores = {
  "Mecha Ronin": 78,
  "Thunder Mage": 74,
  "Iron Brawler": 68,
  "Rage Brute": 66,
  "Shadow Assassin": 64,
  "Bounty Hunter": 62
};

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function scoreInput(input, table, fallback) {
  if (!input) return fallback;
  if (input.mode === "custom") {
    const text = `${input.prompt || ""}`.toLowerCase();
    let bonus = 0;
    if (/cannon|rocket|laser|plasma|rifle|gun|炮|火箭|枪/.test(text)) bonus += 22;
    if (/shield|armor|tank|装甲|护盾/.test(text)) bonus += 12;
    if (/fast|shadow|assassin|speed|迅捷|刺客/.test(text)) bonus += 8;
    return fallback + Math.min(30, bonus);
  }
  return table[input.name] || fallback;
}

function synergyScore(character, weapon) {
  const charName = character?.name || character?.prompt || "";
  const weaponName = weapon?.name || weapon?.prompt || "";
  const text = `${charName} ${weaponName}`.toLowerCase();
  let score = 0;
  if (/ronin|assassin|刺客|剑|sword|machete|nunchaku|staff/.test(text)) score += 10;
  if (/mage|雷电|thunder|quantum|cannon|plasma|laser/.test(text)) score += 10;
  if (/brawler|brute|兽人|铁拳|machete|rocket|launcher/.test(text)) score += 8;
  if (/bounty|hunter|rifle|gun|步枪/.test(text)) score += 9;
  if (/heavy|armor|装甲|shield|defense/.test(text)) score += 5;
  if (/fast|shadow|speed|迅捷|silent/.test(text)) score += 5;
  return score;
}

function matchupSwing(left, right) {
  const leftText = `${left.character?.name || left.character?.prompt || ""} ${left.weapon?.name || left.weapon?.prompt || ""}`.toLowerCase();
  const rightText = `${right.character?.name || right.character?.prompt || ""} ${right.weapon?.name || right.weapon?.prompt || ""}`.toLowerCase();
  let swing = 0;
  if (/assassin|shadow|fast/.test(leftText) && /rocket|cannon/.test(rightText)) swing += 12;
  if (/assassin|shadow|fast/.test(rightText) && /rocket|cannon/.test(leftText)) swing -= 12;
  if (/mage|thunder/.test(leftText) && /armor|brawler|brute/.test(rightText)) swing += 8;
  if (/mage|thunder/.test(rightText) && /armor|brawler|brute/.test(leftText)) swing -= 8;
  if (/rifle|gun/.test(leftText) && /machete|nunchaku/.test(rightText)) swing += 5;
  if (/rifle|gun/.test(rightText) && /machete|nunchaku/.test(leftText)) swing -= 5;
  return swing;
}

function evaluateSide(player) {
  return scoreInput(player.character, characterScores, 60) +
    scoreInput(player.weapon, weaponScores, 56) +
    synergyScore(player.character, player.weapon);
}

async function generateBattleImage(payload, context) {
  await wait(800);
  return {
    imageUrl: context.assetUrl("/assets/static/格斗占位图.png"),
    sourcePath: context.assetPath("/assets/static/格斗占位图.png"),
    prompt: buildImagePrompt(payload),
    provider: "mock"
  };
}

async function judgeBattle(payload) {
  await wait(500);
  const leftScore = evaluateSide(payload.players.left) + matchupSwing(payload.players.left, payload.players.right);
  const rightScore = evaluateSide(payload.players.right) - matchupSwing(payload.players.left, payload.players.right);
  const winnerSide = rightScore > leftScore ? "right" : "left";

  return {
    winnerSide,
    summary: `Player ${winnerSide === "left" ? "A" : "B"} wins. Both players can improve by tightening character and weapon synergy.`,
    playerAAnalysis: "Player A should evaluate whether the selected weapon supports the character's natural rhythm. If using a fast or tactical character, try Nunchaku, Holy Sword, or Assault Rifle for cleaner tempo control; if using a heavy character, consider Rocket Launcher or Machete. For custom prompts, add clear combat traits such as speed, armor, range style, and signature move.",
    playerBAnalysis: "Player B should evaluate whether the selected weapon creates a coherent battle plan with the character. If the setup feels slow, switch to Shadow Assassin, Mecha Ronin, or Assault Rifle for better mobility and control; if the character is durable, pair with Machete, Holy Sword, or Rocket Launcher. For custom prompts, specify how the fighter uses the weapon and what advantage they create.",
    provider: "mock"
  };
}

async function generateBattleVideo(payload, judgeResult, context) {
  await wait(900);
  return {
    videoUrl: context.assetUrl("/assets/static/默认格斗视频.mp4"),
    coverUrl: context.assetUrl("/assets/static/格斗占位图.png"),
    prompt: buildVideoPrompt(judgeResult.winnerSide),
    provider: "mock"
  };
}

module.exports = {
  generateBattleImage,
  judgeBattle,
  generateBattleVideo
};
