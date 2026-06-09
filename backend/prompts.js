const imageSystemPrompt = `You are an expert visual generation director for a web-based AI arena fighting game.

Your task is to generate a single 16:9 battle standoff image based on:
1. the provided arena background,
2. the left player's character reference,
3. the left player's weapon reference,
4. the right player's character reference,
5. the right player's weapon reference.

The image must look like a 90s retro arcade side-scrolling fighting game.

Core composition requirements:
- Use the provided arena background as the exact main environment. Treat it as a locked background plate, not a loose style reference.
- Do not replace the arena with a white, blank, studio, abstract, minimal, or newly invented background.
- Preserve the full dark fighting arena: crowd, red banners, stage lights, ring ropes, floor, and corner posts.
- Keep a fixed side-view fighting game camera angle.
- Place the left player on the left side of the ring.
- Place the right player on the right side of the ring.
- Both fighters must face each other.
- Both fighters must be full-body and clearly visible.
- Each fighter must visibly hold or carry their own selected weapon.
- Do not add extra fighters.
- Do not add UI elements.
- Do not add text, logo, watermark, names, or menus.

Output requirements:
- One final 16:9 image only.
- No text.
- No logo.
- No watermark.`;

const judgeSystemPrompt = `You are an objective AI battle judge and post-match coach for a web-based arena fighting game.

First decide the final winner of the duel. Then provide concise post-match coaching for each player.

Do not use a single rough rule such as guns always beat melee weapons. Imagine how each character could actually use their equipment in this arena. Consider character traits, weapon compatibility, combat style, mobility, defense, range, timing, surprise tactics, environmental use, and possible creative maneuvers.

Return only valid JSON:
{
  "winnerSide": "left" or "right",
  "summary": "one concise sentence summarizing the outcome and the most important improvement direction",
  "playerAAnalysis": "clear post-match analysis and improvement suggestions for Player A",
  "playerBAnalysis": "clear post-match analysis and improvement suggestions for Player B"
}`;

function getInputLabel(input) {
  if (!input) return "Unknown";
  if (input.mode === "custom") return input.prompt || "Custom prompt";
  return `${input.name}: ${input.description || "preset reference"}`;
}

function buildImagePrompt(payload) {
  const left = payload.players.left;
  const right = payload.players.right;

  return `Create a 16:9 battle standoff image by combining the provided reference images.

Reference image order:
1. Arena background reference.
2. Left player's character reference, if provided.
3. Left player's weapon reference, if provided.
4. Right player's character reference, if provided.
5. Right player's weapon reference, if provided.

Arena:
Use the provided fighting arena background as the exact locked base scene. This background is mandatory and must remain visually stable. Preserve its dark crowded arena, red banners, stage lights, ring ropes, floor texture, corner posts, side-view camera, arena scale, lighting direction, and retro arcade atmosphere.

Background lock:
Do not remove, simplify, recolor, brighten into a white background, replace, crop away, blur away, or redesign the arena background. Do not generate a new generic boxing ring. Insert the two fighters into the existing provided arena plate while keeping the environment structure stable and recognizable.

Left Player:
Character reference or description:
${getInputLabel(left.character)}

Weapon reference or description:
${getInputLabel(left.weapon)}

Place this fighter on the left side. Preserve the selected character's main silhouette, armor/clothing structure, face/head shape, dominant colors, and visual identity. Preserve the selected weapon's recognizable shape, size, colors, and core details.

Right Player:
Character reference or description:
${getInputLabel(right.character)}

Weapon reference or description:
${getInputLabel(right.weapon)}

Place this fighter on the right side. Preserve the selected character's main silhouette, armor/clothing structure, face/head shape, dominant colors, and visual identity. Preserve the selected weapon's recognizable shape, size, colors, and core details.

Scene:
The left player stands on the left side of the ring.
The right player stands on the right side of the ring.
Both fighters face each other in a tense pre-fight standoff.
Both fighters hold or carry their selected weapons clearly.
The two fighters must look directly derived from the provided references, not generic replacements.

Style:
90s retro arcade side-scrolling fighting game style, high-quality pixel-inspired illustration, bold black outlines, dramatic high-contrast shadows, saturated arcade colors, energetic fighting game atmosphere.

Strict requirements:
No blank background, no white background, no studio background, no text, no logo, no watermark, no UI, no health bars, no extra fighters, no copyrighted characters.`;
}

function buildVideoPrompt(winnerSide) {
  const winner = winnerSide === "left" ? "left-side fighter" : "right-side fighter";
  const loser = winnerSide === "left" ? "right-side fighter" : "left-side fighter";

  return `Use the provided battle standoff image as the first frame.

Create an 8-second battle video in a 90s retro arcade side-scrolling fighting game style with explosive fighting impact.

The two fighters in the ring start an intense, creative, high-impact battle. The left-side fighter and the right-side fighter exchange fast attacks, blocks, dodges, parries, counters, jump-ins, evasive footwork, and weapon strikes. Each fighter must fully express their distinct combat personality and must use the unique advantages of their own visible weapon in imaginative ways.

Weapon behavior rules:
If a fighter is using a ranged weapon such as an assault rifle, gun, rocket launcher, quantum cannon, laser cannon, or other firearm/cannon-like equipment, their combat choreography must match ranged-weapon logic. They should create distance, sidestep, retreat, aim, fire bursts, unleash projectiles, use recoil, suppress the opponent, and reposition between shots. Avoid showing them primarily using the gun or cannon body as a close-range club or melee stick. Close-range weapon-body strikes are allowed only briefly when the opponent gets too close, during a defensive shove, or as a rare finishing flourish.

If a fighter is using a melee weapon such as a sword, machete, nunchaku, staff, or blade-like equipment, their choreography should emphasize close-range pressure, footwork, slashes, parries, chains, dodges, counters, and body movement around the weapon's reach.

Make every hit feel powerful: visible impact flashes, shockwave-like force, strong recoil, sparks, dust bursts, weapon trails, body reaction, hit pause, and heavy knockback energy. The action should feel exciting, fierce, readable, and packed with satisfying fighting-game hit feedback.

The ${winner} gradually gains the advantage and finally defeats the ${loser}. The defeated fighter is knocked back or falls down in a non-graphic way.

Final blow sequence:
For the final decisive strike that completely knocks down the opponent, suddenly push the camera in closer and focus tightly on the fighters. Use a cinematic martial-arts movie close-up with dramatic slow motion to showcase the final finishing hit. Emphasize the weapon impact, the winner's motion, the loser being struck back, particles, sparks, and a powerful moment of contact.

Winner ending:
After the final blow, transition into a clear winner showcase like a retro arcade fighting game victory screen. Push the camera in toward the ${winner}, focus on the winner from the waist up or chest up, and show the winner holding a strong victory pose with their weapon visible. The defeated ${loser} should be out of focus, lower in frame, knocked down, or clearly no longer fighting. A large bold golden-orange pixel-art "WINNER" text must appear centered across the screen, layered over the winner with a dramatic translucent red/orange horizontal banner or glow behind it. Hold this winner screen for the final moment so the victory is unmistakable. The WINNER label must indicate the ${winner}, not the defeated fighter.

Important requirements:
- Duration around 8 seconds.
- Use the input image as the first frame.
- Keep the same two fighters.
- Keep the same weapons.
- Keep the same arena.
- Do not create or animate health bars.
- Show the winning fighter clearly victorious in the final shot.
- Show a large centered "WINNER" text overlay in the final shot.
- Preserve left/right identity.
- Mostly fixed side-view fighting game camera during the fight.
- Allow cinematic close-up and camera push-in for the final finishing blow and winner showcase.
- No gore.
- No extra fighters.
- No UI text.
- No logo.
- No watermark.`;
}

module.exports = {
  imageSystemPrompt,
  judgeSystemPrompt,
  buildImagePrompt,
  buildVideoPrompt
};
