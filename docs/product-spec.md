# 双人 AIGC 角色装备擂台战 Web 产品说明文档

## 1. 产品概述

### 1.1 产品名称

双人 AIGC 角色装备擂台战  
英文暂定：AI Arena Duel

### 1.2 产品定位

本产品是一个 Web 端 AIGC 互动对战 Demo。

用户为两位玩家分别选择或生成“角色”和“装备”，系统基于双方参数生成擂台对峙图，再由 AI 裁判判断胜方，最后调用视频生成模型生成一段约 8 秒的横版格斗战斗视频。

核心体验：

```text
配置角色与装备 → 生成擂台对峙图 → AI 判断胜负 → 生成战斗视频 → 播放结果 → 胜者继续守擂
```

### 1.3 产品目标

1. 在一个网页内完整模拟双人联机对战效果，便于 Demo 展示。
2. 串联 AIGC 生图、视觉理解、AI 裁判、视频生成能力。
3. 让用户感受到角色与装备选择会影响最终战斗结果。
4. 通过等待弹窗、倒计时、占位视频、结果弹窗降低生成等待焦虑。
5. 保持逻辑清晰，便于 Codex 快速完成开发。

### 1.4 当前版本边界

当前版本为单页演示版，不需要真实多人联网。

虽然产品表现为“双人联机对战”，但 MVP 阶段只需在同一个网页中同时展示 Player A 和 Player B 的配置区，模拟双人对战流程。

后续可扩展真实房间制联机、在线匹配、排行榜、用户资产库等功能。

---

## 2. 核心体验流程

### 2.1 完整流程

1. 用户进入页面，中央展示空擂台等待视频。
2. 用户分别为 Player A 和 Player B 配置角色与装备。
3. 双方配置完成后，点击 `Start Battle`。
4. 系统调用图片生成模型，生成双方持械站在擂台两端的对峙图。
5. 系统调用 AI 裁判模型，根据对峙图判断胜方。
6. 系统根据胜方结果调用视频生成模型，生成战斗视频。
7. 视频生成完成后返回页面。
8. 用户点击播放战斗视频。
9. 视频播放结束后弹出结果弹窗。
10. 胜方可选择继续守擂，或退出游戏。

### 2.2 体验重点

本产品的重点不是复杂数值战斗，而是：

- AIGC 创造感
- 角色装备组合的趣味性
- AI 裁判带来的悬念
- 横版格斗视频带来的爽感
- “继续守擂”的轻量竞技循环

---

## 3. 页面结构

### 3.1 页面布局

页面采用单页结构，包含三个核心区域：

1. 顶部标题区
2. 中央擂台展示区
3. 底部双人配置区

推荐布局：

```text
------------------------------------------------
| 产品标题 / 副标题 / 简短玩法说明               |
------------------------------------------------
|                                              |
|              中央擂台展示区                   |
|        等待视频 / 对峙图 / 战斗视频            |
|                                              |
------------------------------------------------
| Player A 配置区        |      Player B 配置区 |
| 角色选择 / 自定义输入   |      角色选择 / 自定义输入 |
| 装备选择 / 自定义输入   |      装备选择 / 自定义输入 |
------------------------------------------------
|               Start Battle 按钮               |
------------------------------------------------
```

### 3.2 顶部标题区

建议文案：

```text
AI Arena Duel
Choose your fighter. Pick your weapon. Let AI decide the battle.
```

中文版本：

```text
AI 擂台对决
选择你的角色与装备，让 AI 生成一场专属格斗战。
```

---

## 4. 中央擂台展示区

中央擂台展示区是页面视觉核心，需要承载以下状态。

### 4.1 等待状态

展示已生成好的 5 秒空擂台循环视频。

根据玩家准备情况叠加动态文案：

```text
等待 2 位玩家入局
```

或：

```text
等待 1 位玩家入局
```

说明：

- 文案由前端叠加，不直接生成在视频中。
- 空擂台视频使用已生成assets/static，不再调用 AI。

### 4.2 对峙图生成完成

展示 AI 生成的双方擂台对峙图。

可叠加提示：

```text
Battle image ready. Preparing the final fight...
```

### 4.3 战斗视频生成完成

展示生成后的视频封面和播放按钮。

建议不自动播放，而是显示：

```text
Play Battle
```

用户点击后开始播放。

### 4.4 战斗结束

视频播放完成后弹出结果弹窗。

中央展示区可停留在视频最后一帧，或保留视频播放器。

---

## 5. 玩家配置区

### 5.1 玩家定义

页面同时展示两个玩家：

- Player A：默认代表左侧角色
- Player B：默认代表右侧角色

每位玩家需要配置：

1. 角色
2. 装备

每个配置项支持两种方式：

1. 选择预置卡片
2. 自定义输入提示词 / 上传参考图

---

### 5.2 角色输入区

每位玩家的角色输入区包含：

- 角色卡片横向列表
- 自定义角色提示词输入框
- 角色参考图上传入口
- 当前选中 / 上传预览
- 清空按钮

### 5.3 装备输入区

每位玩家的装备输入区包含：

- 装备卡片横向列表
- 自定义装备提示词输入框
- 装备参考图上传入口
- 当前选中 / 上传预览
- 清空按钮

---

## 6. 输入规则

### 6.1 预置卡片模式

当用户选择某张预置卡片后：

- 当前输入项进入“预置模式”
- 卡片高亮
- 系统记录该卡片的图片、名称和描述
- 本轮生成使用该卡片作为参考

### 6.2 自定义模式

当用户输入提示词或上传参考图后：

- 当前输入项进入“自定义模式”
- 已选中的预置卡片取消高亮
- 系统使用提示词和 / 或参考图作为生成参考

### 6.3 提示词与参考图同时存在

当用户同时输入提示词并上传参考图时：

- 参考图用于控制视觉主体
- 提示词用于补充职业、材质、风格、能力、装备特征等信息

### 6.4 准备完成判断

角色或装备满足以下任一条件，即视为该项已完成：

1. 选择了预置卡片
2. 输入了有效提示词
3. 上传了参考图

每位玩家必须同时完成角色和装备，才视为该玩家准备完成。

双方玩家都准备完成后，`Start Battle` 按钮变为可点击。

---

## 7. 游戏状态与交互逻辑

### 7.1 核心状态

页面至少需要包含以下状态：

1. 初始等待
2. 单方已准备
3. 双方已准备
4. 图片生成中
5. AI 裁判判断中
6. 视频生成中
7. 视频已生成
8. 视频播放中
9. 战斗结束
10. 生成失败

### 7.2 初始等待

页面首次进入时：

- 中央展示空擂台循环视频
- 文案显示“等待 2 位玩家入局”
- `Start Battle` 不可点击
- 双方配置区可操作

### 7.3 单方已准备

当只有一位玩家完成角色和装备配置时：

- 中央继续播放等待视频
- 文案显示“等待 1 位玩家入局”
- 已准备玩家区域显示 `Ready`
- `Start Battle` 仍不可点击

### 7.4 双方已准备

当 Player A 和 Player B 均完成配置后：

- `Start Battle` 可点击
- 点击后锁定双方输入
- 进入 AI 生成流程

### 7.5 生成中

点击 `Start Battle` 后：

- 打开等待弹窗
- 禁止修改角色和装备
- 依次执行图片生成、AI 裁判、视频生成

### 7.6 视频已生成

视频生成完成后：

- 关闭等待弹窗
- 中央展示视频播放器
- 显示 `Play Battle`
- 配置区仍保持锁定

### 7.7 视频播放中

用户点击播放后：

- 视频开始播放
- 禁止再次点击 `Start Battle`
- 禁止修改配置
- 等待视频播放结束后弹出结果

### 7.8 战斗结束

视频播放完成后弹出结果弹窗，显示胜方，并提供：

```text
继续守擂
退出游戏
```

---

## 8. 继续守擂与退出逻辑

### 8.1 结果弹窗

结果弹窗显示：

```text
左侧玩家获胜
```

或：

```text
右侧玩家获胜
```

可附带 AI 裁判原因，例如：

```text
原因：左侧装备攻击范围更广，压制力更强。
```

弹窗按钮：

```text
继续守擂
退出游戏
```

### 8.2 继续守擂

当用户点击“继续守擂”：

- 保留胜方角色与装备参数
- 清空败方角色与装备参数
- 胜方保持原位置不变
- 胜方区域显示“守擂中”
- 中央展示区回到空擂台等待视频
- 文案显示“等待 1 位玩家入局”
- 新玩家补充空缺位置后，可开始下一轮

MVP 建议胜方保持原位置，不做左右换位，避免逻辑复杂化。

### 8.3 退出游戏

当用户点击“退出游戏”：

- 清空双方角色与装备参数
- 清空上一局对峙图、视频和裁判结果
- 中央展示区回到空擂台等待视频
- 文案显示“等待 2 位玩家入局”
- 页面回到初始状态

---

## 9. AI 模型调用总流程

### 9.1 模型链路

本产品涉及三个 AI 环节：

| 环节 | 模型 |
|---|---|
| 图片生成 | seedream 4.5 |
| 胜负判断 | deepseek-v4-flash |
| 视频生成 | pixverse v5.6 |

调用顺序：

```text
用户点击 Start Battle
        ↓
整理双方角色与装备输入
        ↓
调用图片生成模型
        ↓
返回擂台对峙图
        ↓
调用 AI 裁判模型
        ↓
返回 winnerSide
        ↓
根据 winnerSide 生成视频提示词
        ↓
调用视频生成模型
        ↓
返回战斗视频
        ↓
用户播放视频
        ↓
展示结果弹窗
```

### 9.2 接入说明

具体 API 参数由 Codex 根据官方文档完成接入。  
本文档只定义业务流程、输入输出关系、交互逻辑和提示词要求。

---

## 10. 图片生成环节

### 10.1 生成目标

图片生成模型需要输出一张 16:9 擂台对峙图。

图中必须清晰展示：

- 左侧玩家角色
- 左侧玩家装备
- 右侧玩家角色
- 右侧玩家装备
- 格斗擂台背景
- 双方站在擂台两端并面对彼此

### 10.2 输入内容

图片生成环节需要整合：

- 左侧角色参考图或角色提示词
- 左侧装备参考图或装备提示词
- 右侧角色参考图或角色提示词
- 右侧装备参考图或装备提示词
- 已生成好的格斗擂台背景底图

### 10.3 结果要求

生成图必须满足：

1. 16:9 比例
2. 横版格斗游戏视角
3. 左右双方位置明确
4. 双方完整出现在画面中
5. 双方装备清晰可见
6. 保持角色和装备的核心视觉特征
7. 不出现额外角色
8. 不出现 UI、文字、Logo、水印
9. 不改变擂台背景主体布局
10. 整体风格与assets/static一致

### 10.4 图片生成系统提示词

```text
You are an expert visual generation director for a web-based AI arena fighting game.

Your task is to generate a single 16:9 battle standoff image based on:
1. the provided arena background,
2. the left player's character reference,
3. the left player's weapon reference,
4. the right player's character reference,
5. the right player's weapon reference.

The image must look like a 90s retro arcade side-scrolling fighting game.

Core composition requirements:
- Use the provided arena background as the main environment.
- Keep a fixed side-view fighting game camera angle.
- Place the left player on the left side of the ring.
- Place the right player on the right side of the ring.
- Both fighters must face each other.
- Both fighters must be full-body and clearly visible.
- Each fighter must visibly hold or carry their own selected weapon.
- Keep the weapon scale natural and readable.
- Do not make weapons extremely oversized or too tiny.
- Do not add extra fighters.
- Do not add spectators inside the ring.
- Do not add UI elements.
- Do not add text, logo, watermark, health bars, names, or menus.

Style requirements:
- 90s retro arcade side-scrolling fighting game style.
- High-quality pixel-inspired illustration.
- Bold black outlines.
- Dramatic high-contrast shadows.
- Saturated arcade colors.
- Energetic fighting atmosphere.
- Original non-copyrighted character and weapon design.

Identity preservation requirements:
- Preserve the main visual traits of each character reference.
- Preserve the main shape, material, and combat characteristics of each weapon reference.
- The left player's character and weapon must not be mixed with the right player's.
- The right player's character and weapon must not be mixed with the left player's.

Output requirements:
- One final 16:9 image only.
- No text.
- No logo.
- No watermark.
- No copyrighted characters.
- No existing game characters.
```

### 10.5 图片生成用户提示词模板

```text
Create a 16:9 battle standoff image.

Arena:
Use the provided fighting arena background as the base scene.

Left Player:
Character reference or description:
{{left_character_input}}

Weapon reference or description:
{{left_weapon_input}}

Right Player:
Character reference or description:
{{right_character_input}}

Weapon reference or description:
{{right_weapon_input}}

Scene:
The left player stands on the left side of the ring.
The right player stands on the right side of the ring.
Both fighters face each other in a tense pre-fight standoff.
Both fighters hold or carry their selected weapons clearly.

Style:
90s retro arcade side-scrolling fighting game style, high-quality pixel-inspired illustration, bold black outlines, dramatic high-contrast shadows, saturated arcade colors, energetic fighting game atmosphere.

Strict requirements:
No text, no logo, no watermark, no UI, no health bar, no extra fighters, no copyrighted characters.
```

---

## 11. AI 裁判胜负判断环节

### 11.1 判断目标

AI 裁判模型需要分析擂台对峙图中左右双方角色和装备的视觉战斗优势，判断哪一方更可能获胜。

判断依据包括：

- 装备类型
- 攻击距离
- 破坏力
- 防御能力
- 角色体型
- 战斗姿态
- 机动性
- 角色与装备适配度
- 综合视觉战斗优势

### 11.2 输入内容

主要输入：

- 上一步生成的擂台对峙图

可选补充：

- 左侧角色名称 / 描述
- 左侧装备名称 / 描述
- 右侧角色名称 / 描述
- 右侧装备名称 / 描述

如果模型支持图片输入，优先基于图片判断；如图片理解受限，可附加文本描述。

### 11.3 输出要求

AI 裁判必须输出结构化 JSON：

```json
{
  "winnerSide": "left",
  "confidence": 0.67,
  "reason": "左侧装备攻击范围更广，压制力更强。"
}
```

要求：

- `winnerSide` 只能是 `left` 或 `right`
- 不允许返回平局
- 不允许返回不确定
- 不输出长篇分析
- 不输出 JSON 以外的任何内容

### 11.4 AI 裁判系统提示词

```text
You are an objective AI battle judge for a web-based arena fighting game.

Your task is to analyze the battle standoff image and decide which fighter is more likely to win if the two fighters start fighting.

You must judge based on visible combat factors, including:
- weapon type,
- attack range,
- destructive power,
- defensive potential,
- fighter body type,
- fighting stance,
- mobility,
- visual combat advantage,
- overall weapon-character compatibility.

Important rules:
1. You must choose exactly one winner.
2. The winner must be either the left-side fighter or the right-side fighter.
3. Do not return a tie.
4. Do not say the result is uncertain.
5. Do not over-explain.
6. Return only valid JSON.
7. Do not include markdown formatting.
8. Do not include any extra text outside the JSON.

Return format:
{
  "winnerSide": "left" or "right",
  "confidence": a number between 0 and 1,
  "reason": "a short reason within one sentence"
}
```

### 11.5 中文备用提示词

```text
你是一名客观理性的 AI 格斗裁判。

你的任务是根据擂台对峙图中左右两名角色的视觉信息，判断如果双方开始战斗，哪一方更可能获胜。

请重点参考以下因素：
1. 装备类型
2. 攻击距离
3. 破坏力
4. 防御能力
5. 角色体型
6. 战斗姿态
7. 机动性
8. 角色与装备的适配程度
9. 视觉上的综合战斗优势

判断规则：
1. 必须选择一方获胜。
2. 只能选择 left 或 right。
3. 不允许返回平局。
4. 不允许返回不确定。
5. 不需要长篇分析。
6. 只返回 JSON。
7. 不要输出 markdown。
8. 不要输出 JSON 以外的任何内容。

返回格式：
{
  "winnerSide": "left" 或 "right",
  "confidence": 0 到 1 之间的小数,
  "reason": "一句简短原因"
}
```

### 11.6 裁判失败兜底

如果出现以下情况：

- API 报错
- 返回内容不是 JSON
- `winnerSide` 缺失
- `winnerSide` 不是 `left` 或 `right`

则系统使用兜底逻辑：

- 随机选择 `left` 或 `right`
- `confidence` 设为 `0.5`
- `reason` 设为：

```text
AI 裁判暂时无法稳定判断，系统随机判定本局胜方。
```

裁判失败不应阻断完整流程，应继续进入视频生成阶段。

---

## 12. 视频生成环节

### 12.1 生成目标

视频生成模型需要基于擂台对峙图生成一段约 8 秒的战斗视频。

视频必须表现：

- 双方开始战斗
- 双方使用各自装备
- 战斗过程有明显攻防
- AI 裁判判定的胜方获胜
- 结尾镜头突出胜者
- 中央出现 `WINNER` 标识

### 12.2 输入内容

视频生成环节输入：

- 擂台对峙图作为首帧
- AI 裁判输出的 `winnerSide`
- 视频时长：约 8 秒
- 横版格斗固定机位要求
- 统一视觉风格要求

### 12.3 输出要求

视频结果应满足：

1. 16:9 比例
2. 时长约 8 秒
3. 继承首帧角色、装备和擂台
4. 保持横版格斗游戏视角
5. 不使用电影式大幅运镜
6. 不新增无关角色
7. 不出现血腥 gore 内容
8. 胜者与 AI 裁判 `winnerSide` 一致
9. 结尾出现 `WINNER` 字样
10. 视频整体动作清晰可读

### 12.4 视频生成系统提示词

```text
You are an expert AI video director for a web-based retro arcade arena fighting game.

Your task is to generate a short battle video from the provided first-frame image.

The first-frame image shows two fighters standing in a fighting arena:
- one fighter starts on the left side,
- one fighter starts on the right side,
- each fighter has their own weapon.

You must preserve:
- the same two fighters,
- the same weapons,
- the same arena,
- the same left/right identity,
- the same retro arcade fighting game visual style.

Camera rules:
- Keep a fixed side-view fighting game camera.
- Do not use cinematic camera cuts.
- Do not use first-person view.
- Do not use top-down view.
- Do not rotate around the fighters.
- The video should feel like a classic side-scrolling arcade fighting game match.

Action rules:
- The fighters should exchange attacks, blocks, dodges, and weapon-based moves.
- Each fighter should use the visible characteristics of their own weapon.
- The action should be energetic and readable.
- Avoid chaotic motion.
- Avoid gore or excessive violence.
- Do not add extra fighters.

Ending rules:
- The specified winner must clearly win at the end.
- The defeated fighter should be visibly beaten, knocked back, or fall down in a non-graphic way.
- The camera may slightly emphasize the winner while still keeping the side-view style.
- A large "WINNER" text should appear in the center near the end.

Output:
- Around 8 seconds.
- 16:9 aspect ratio.
- Retro arcade side-scrolling fighting game style.
```

### 12.5 左侧获胜视频提示词

当 `winnerSide = left` 时使用：

```text
Use the provided battle standoff image as the first frame.

Create an 8-second battle video in a 90s retro arcade side-scrolling fighting game style.

The two fighters in the ring start an intense battle. The left-side fighter and the right-side fighter exchange fast attacks, blocks, dodges, and weapon strikes. Each fighter must use the unique combat features of their own visible weapon.

The left-side fighter gradually gains the advantage and finally defeats the right-side fighter. The right-side fighter is knocked back or falls down in a non-graphic way.

At the end, the left-side fighter is clearly the winner. The camera slightly emphasizes the left-side winner while still keeping the fixed side-view arcade fighting game angle. A large "WINNER" text appears in the center of the video.

Important requirements:
- Duration around 8 seconds.
- Use the input image as the first frame.
- Keep the same two fighters.
- Keep the same weapons.
- Keep the same arena.
- Preserve left/right identity.
- Fixed side-view fighting game camera.
- No cinematic camera movement.
- No gore.
- No extra fighters.
- No logo.
- No watermark.
```

### 12.6 右侧获胜视频提示词

当 `winnerSide = right` 时使用：

```text
Use the provided battle standoff image as the first frame.

Create an 8-second battle video in a 90s retro arcade side-scrolling fighting game style.

The two fighters in the ring start an intense battle. The left-side fighter and the right-side fighter exchange fast attacks, blocks, dodges, and weapon strikes. Each fighter must use the unique combat features of their own visible weapon.

The right-side fighter gradually gains the advantage and finally defeats the left-side fighter. The left-side fighter is knocked back or falls down in a non-graphic way.

At the end, the right-side fighter is clearly the winner. The camera slightly emphasizes the right-side winner while still keeping the fixed side-view arcade fighting game angle. A large "WINNER" text appears in the center of the video.

Important requirements:
- Duration around 8 seconds.
- Use the input image as the first frame.
- Keep the same two fighters.
- Keep the same weapons.
- Keep the same arena.
- Preserve left/right identity.
- Fixed side-view fighting game camera.
- No cinematic camera movement.
- No gore.
- No extra fighters.
- No logo.
- No watermark.
```

---

## 13. 等待弹窗与生成反馈

### 13.1 触发时机

用户点击 `Start Battle` 后立即弹出等待弹窗。

等待弹窗覆盖：

1. 图片生成中
2. AI 裁判判断中
3. 视频生成中

### 13.2 弹窗文案

英文：

```text
Battle is being generated...
AI is creating your arena battle. This may take a few seconds.
```

中文：

```text
战斗生成中...
AI 正在生成你的专属擂台对决，请稍等片刻。
```

### 13.3 20 秒倒计时

弹窗中显示 20 秒倒计时。

逻辑：

1. 点击 `Start Battle` 后从 20 秒开始倒计时。
2. 如果视频在 20 秒内生成完成，弹窗立即关闭。
3. 如果 20 秒结束但视频仍在生成，不判定失败。
4. 倒计时结束后文案改为：

```text
Almost there...
```

或：

```text
即将完成...
```

5. 只有模型明确返回失败，或等待超过系统最大限制，才进入失败弹窗。

建议最大等待时长：120 秒。

### 13.4 分阶段提示

图片生成阶段：

```text
正在生成擂台对峙图...
```

AI 裁判阶段：

```text
AI 裁判正在判断胜负...
```

视频生成阶段：

```text
正在生成最终战斗视频...
```

---

## 14. 异常处理

### 14.1 图片生成失败

触发条件：

- 图片生成 API 报错
- 返回结果为空
- 返回图片无法访问
- 生成结果明显不符合基础要求

弹窗文案：

```text
Battle Image Failed
角色或装备生成失败了，可能是图片内容不清晰或提示词过于复杂。请调整输入后再试一次。
```

处理方式：

- 保留用户输入
- 允许重新生成
- 不清空已选角色和装备

### 14.2 AI 裁判失败

触发条件：

- AI 裁判 API 报错
- 返回内容不是 JSON
- `winnerSide` 缺失或非法

处理方式：

- 不阻断流程
- 系统随机选择一方作为胜者
- 继续进入视频生成

可选提示：

```text
AI 裁判暂时无法稳定判断，本局将由系统随机判定胜方。
```

### 14.3 视频生成失败

触发条件：

- 视频生成 API 报错
- 任务超时
- 返回视频为空
- 视频 URL 无法访问

弹窗文案：

```text
Battle Video Failed
战斗视频生成失败了，可能是模型繁忙或首帧信息过于复杂。你可以保留当前角色和装备再次生成。
```

处理方式：

- 保留用户输入
- 保留已生成对峙图
- 保留 AI 裁判结果
- 允许重新生成视频
- 不要求重新配置角色和装备

### 14.4 上传图片失败

建议限制：

- 支持 JPG、PNG、WEBP
- 单张图片不超过 10MB

弹窗文案：

```text
Upload Failed
图片上传失败，请检查图片格式和大小后重新上传。
```

---

## 15. assets/static使用说明

assets/static已按计划生成完毕，本文档不再包含assets/static生成提示词。

当前产品需要使用的assets/static包括：

1. 格斗擂台背景底图
2. 等待玩家进入过渡视频
3. 6 张角色卡片图
4. 6 张装备卡片图
5. 默认战斗占位图
6. 默认战斗视频

### 15.1 assets/static使用位置

#### 格斗擂台背景底图

用于：

- 图片生成模型的基础场景参考
- 保持整体场景一致性

#### 等待玩家进入过渡视频

用于：

- 初始等待状态
- 单方守擂等待状态
- 双方参数不足时的占位展示

#### 角色卡片图

用于：

- Player A / Player B 的角色选择区
- 作为图片生成模型的角色参考输入

#### 装备卡片图

用于：

- Player A / Player B 的装备选择区
- 作为图片生成模型的装备参考输入

#### 默认战斗占位图 / 默认战斗视频

用于：

- Mock 流程演示
- API 未接入前的全流程调试
- 模型失败时的备用展示

---

## 16. MVP 功能范围

### 16.1 必须实现

1. 单页 Web 对战界面
2. Player A / Player B 双玩家配置区
3. 角色卡片选择
4. 装备卡片选择
5. 自定义角色提示词输入
6. 自定义装备提示词输入
7. 角色参考图上传
8. 装备参考图上传
9. 双方准备状态判断
10. `Start Battle` 按钮状态控制
11. 等待玩家占位视频
12. AI 图片生成流程
13. AI 裁判判断流程
14. AI 视频生成流程
15. 20 秒等待倒计时弹窗
16. 生成失败提示
17. 视频播放
18. 结果弹窗
19. 胜者继续守擂
20. 退出游戏重置流程

### 16.2 暂不实现

当前版本不需要实现：

1. 用户登录
2. 真实在线匹配
3. WebSocket 联机
4. 用户资产库
5. 作品保存
6. 视频下载
7. 社媒分享
8. 排行榜
9. 付费系统
10. 复杂战斗数值系统

---

## 17. 产品体验细节

### 17.1 准备状态提示

当某位玩家完成角色和装备配置后，显示：

```text
Ready
```

或：

```text
已准备
```

如果是守擂玩家，显示：

```text
Champion
```

或：

```text
守擂中
```

### 17.2 等待人数提示

中央等待区应根据当前状态动态显示：

```text
等待 2 位玩家入局
```

或：

```text
等待 1 位玩家入局
```

不要只显示“等待中”，否则用户不知道下一步要做什么。

### 17.3 胜负原因展示

AI 裁判的 `reason` 可以展示在结果弹窗中，增强“装备影响胜负”的感知。

示例：

```text
左侧玩家获胜
原因：左侧装备攻击范围更广，压制力更强。
```

### 17.4 控制 AI 分析长度

本产品是娱乐体验，不需要展示长篇战斗分析。

推荐原因文案：

```text
左侧武器攻击范围更广，压制力更强。
```

不推荐：

```text
经过多维度分析，左侧角色在武器结构、体型优势、战斗意图、动作空间等方面综合占优，因此其胜率相对较高。
```

### 17.5 避免生成等待卡死感

生成中必须有明确反馈：

- 等待弹窗
- 倒计时
- 当前阶段提示
- 加载动效

---

## 18. 推荐开发顺序

### 第一阶段：静态界面与assets/static接入

目标：

- 页面可展示
- 角色和装备卡片可选择
- 中央等待视频可播放
- 基础视觉风格统一

### 第二阶段：状态与交互逻辑

目标：

- 双方准备判断
- `Start Battle` 启用 / 禁用
- 继续守擂
- 退出游戏
- 结果弹窗
- 错误弹窗

### 第三阶段：Mock 对战流程

目标：

- 不接真实 AI API
- 点击 `Start Battle` 后模拟生成
- 随机判定胜负
- 返回默认战斗视频
- 跑通完整闭环

建议先完成 Mock 流程，保证产品体验完整，再接入真实模型。

### 第四阶段：接入真实 AI 模型

建议按以下顺序接入：

1. 图片生成模型
2. AI 裁判模型
3. 视频生成模型
4. 视频任务轮询
5. 异常处理与重试

---

## 19. 最终交付效果

完成后，用户应能体验到以下完整流程：

1. 打开网页，看到空擂台等待视频。
2. 为 Player A 选择角色和装备。
3. 为 Player B 选择角色和装备。
4. 点击 `Start Battle`。
5. 看到生成等待弹窗和倒计时。
6. 系统生成双方擂台对峙图。
7. AI 裁判判断哪边更可能获胜。
8. 系统生成战斗视频。
9. 用户点击播放。
10. 视频中双方展开战斗，并由指定一方获胜。
11. 视频结束后弹出结果。
12. 胜者选择继续守擂，等待下一位挑战者。
13. 或选择退出游戏，页面重置。

---

## 20. 给 Codex 的总体开发指导

请根据本文档开发一个 Web 端单页 Demo。

开发重点：

1. 功能流程完整  
   用户从选择角色装备到观看战斗视频，再到继续守擂，必须形成闭环。

2. 状态流转清晰  
   页面必须清楚区分等待、准备完成、生成中、视频可播放、播放中、战斗结束、失败等状态。

3. AI 调用链路稳定  
   图片生成、AI 裁判、视频生成三个环节需要串联顺畅，并具备失败兜底。

4. 视觉体验强  
   页面需要突出复古街机横版格斗氛围，让用户一眼理解这是一个 AI 格斗擂台产品。

开发时可以优先使用 Mock 数据跑通完整体验，再逐步替换为真实模型 API。

本版本不要求真实多人联机，只需要在一个网页内模拟双人对战效果。
