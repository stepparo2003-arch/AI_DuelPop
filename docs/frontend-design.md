# AI Arena Duel 前端设计文档（Google Stitch 生成用）

## 1. 设计目标

本文件用于指导 Google Stitch 生成「双人 AIGC 角色装备擂台战」Web 产品的前端设计代码。

该页面是一个单页 Web Demo，用于展示双人 AIGC 角色装备擂台战的完整视觉与交互流程。  
前端设计重点不是复杂后端逻辑，而是要清晰呈现：

1. 双方玩家选择角色与装备。
2. 中央擂台区域展示等待视频、对峙图或战斗视频。
3. 用户点击开始生成战斗。
4. 生成中有明确等待反馈。
5. 视频结束后展示胜负结果。
6. 胜者可以继续守擂。

整体视觉需要具备高审美、强游戏感、统一风格和清晰交互。

---

## 2. 产品视觉定位

### 2.1 核心视觉关键词

- 90 年代复古街机
- 横版格斗游戏
- 霓虹擂台
- 热血对决
- 科技感 AIGC
- 高对比暗色界面
- 卡片式选择
- 竞技大厅感

### 2.2 整体气质

页面应像一个「AI 格斗游戏启动大厅」，而不是普通工具页面。

用户一进入页面，应立刻感受到：

- 这是一个擂台对战产品。
- 左右双方即将开打。
- 中央视频区域是视觉核心。
- 角色和装备选择会影响最终战斗结果。

### 2.3 风格边界

可以参考复古街机、格斗游戏、霓虹游戏 UI 的感觉，但不要直接复刻任何具体游戏 IP。

避免出现：

- 具体版权游戏角色
- 具体版权 Logo
- 过度写实军事风
- 普通 SaaS 工具风
- 过于儿童化的卡通风
- 过度复杂导致信息混乱的界面

---

## 3. 页面信息架构

页面为单页应用结构，由上到下分为四个区域：

1. 顶部标题与玩法说明区
2. 中央擂台展示区
3. 双玩家配置区
4. 底部主操作区

推荐页面结构：

```text
┌──────────────────────────────────────────────┐
│ 顶部标题区                                    │
│ AI Arena Duel / 玩法副标题                    │
├──────────────────────────────────────────────┤
│                                              │
│              中央擂台展示区                   │
│      等待视频 / 对峙图 / 战斗视频 / 状态提示   │
│                                              │
├──────────────────────────────────────────────┤
│ Player A 配置区              Player B 配置区  │
│ 角色选择 + 自定义输入        角色选择 + 自定义输入 │
│ 装备选择 + 自定义输入        装备选择 + 自定义输入 │
├──────────────────────────────────────────────┤
│              Start Battle 主按钮              │
└──────────────────────────────────────────────┘
```

---

## 4. 设计规格

### 4.1 画布与布局

桌面端优先设计，适配移动端。

推荐桌面端宽度：

- 页面最大宽度：1440px
- 内容安全宽度：1200px - 1320px
- 页面最小高度：100vh

整体布局：

- 背景全屏暗色
- 主内容居中
- 顶部标题区紧凑
- 中央擂台展示区占据最大视觉权重
- 双玩家配置区左右对称
- 主操作按钮固定在配置区下方

### 4.2 背景设计

页面背景建议使用深色竞技场风格。

推荐背景特征：

- 深黑 / 深蓝 / 暗紫渐变
- 局部红蓝霓虹光晕
- 微弱网格纹理或像素噪点
- 中央区域有轻微聚光效果
- 不要让背景影响卡片和文本可读性

推荐背景描述：

```text
dark arcade arena background, deep navy and black gradient, red and blue neon glow, subtle pixel noise, soft spotlight in the center, high contrast, immersive fighting game lobby atmosphere
```

### 4.3 色彩系统

推荐主色：

- 背景黑：#07080F
- 深蓝黑：#0D1020
- 卡片底色：#141827
- 卡片描边：#2A3045
- 主红色：#FF3B3B
- 主蓝色：#2F7BFF
- 霓虹黄：#FFD166
- 成功绿：#30D158
- 文本白：#F5F7FA
- 次级文本灰：#A7ADBF

使用规则：

- Player A 使用红色系强调。
- Player B 使用蓝色系强调。
- 主按钮使用红橙渐变或红蓝对撞渐变。
- Ready / Champion 状态使用绿色或金色。
- 错误状态使用红色。
- AI 生成中状态使用霓虹黄或紫色。

### 4.4 字体风格

推荐使用现代无衬线字体。

标题可使用更有游戏感的粗体风格：

- 英文标题：粗体、大写、字间距略大
- 正文：清晰易读
- 按钮：粗体、短文案

设计建议：

- 标题不宜太花，避免牺牲可读性。
- 可以在标题或标签上使用轻微发光效果。
- 不建议全站使用像素字体，容易影响阅读。

---

## 5. 顶部标题区设计

### 5.1 内容

顶部标题区包含：

1. 产品名
2. 简短副标题
3. 可选状态标签

建议文案：

```text
AI Arena Duel
Choose your fighter. Pick your weapon. Let AI decide the battle.
```

中文可选：

```text
AI 擂台对决
选择你的角色与装备，让 AI 生成一场专属格斗战。
```

### 5.2 视觉要求

标题区应紧凑、有冲击力，不要占据过多高度。

建议设计：

- 产品名居中或左上方
- 标题使用白色 + 轻微霓虹描边
- 副标题使用灰白色
- 可在标题旁加入小标签：`AIGC Battle Demo`

### 5.3 示例布局

```text
AI ARENA DUEL        [AIGC Battle Demo]
Choose your fighter. Pick your weapon. Let AI decide the battle.
```

---

## 6. 中央擂台展示区设计

### 6.1 设计目标

中央擂台展示区是页面视觉中心，应最先吸引用户注意。

该区域用于展示：

1. 等待玩家入局视频
2. AI 生成的擂台对峙图
3. AI 生成的战斗视频
4. 当前生成状态提示
5. 播放按钮

### 6.2 容器规格

推荐比例：

- 16:9
- 桌面端宽度占页面主体 70% - 85%
- 圆角：20px - 28px
- 外层使用霓虹边框或光晕
- 容器内部保持黑色底

建议视觉：

- 容器边框可使用红蓝渐变
- 左侧偏红光，右侧偏蓝光
- 外层有轻微 box-shadow
- 视频 / 图片必须完整填充，不要裁切关键内容

### 6.3 等待状态

等待状态展示已生成好的空擂台循环视频。

中央叠加文案：

```text
等待 2 位玩家入局
```

或：

```text
等待 1 位玩家入局
```

视觉要求：

- 文案位于中央或下三分之一处
- 使用半透明深色遮罩增强可读性
- 文案有轻微发光
- 可增加小型 loading pulse 动效

建议补充提示：

```text
Configure both fighters to start the AI battle.
```

### 6.4 对峙图状态

当 AI 对峙图生成完成后，展示生成图。

可叠加小状态条：

```text
Battle image ready. Preparing the final fight...
```

状态条建议位于画面顶部或底部，样式为半透明胶囊标签。

### 6.5 视频就绪状态

视频生成完成后，中央展示视频封面和播放按钮。

播放按钮要求：

- 大而清晰
- 居中覆盖在视频上
- 使用三角播放图标
- 按钮可带红蓝渐变发光
- 文案：`Play Battle`

### 6.6 视频播放状态

视频播放时：

- 隐藏大播放按钮
- 可保留小型状态标签：`Battle Playing`
- 禁止其他区域输入编辑
- 视频播放结束后自动触发结果弹窗

---

## 7. 双玩家配置区设计

### 7.1 区域结构

双玩家配置区采用左右两栏：

- 左侧：Player A / Left Side
- 右侧：Player B / Right Side

桌面端左右并排。  
移动端上下堆叠。

每个玩家配置面板包含：

1. 玩家标题栏
2. Ready / Champion 状态标签
3. 角色选择模块
4. 角色自定义输入模块
5. 装备选择模块
6. 装备自定义输入模块

### 7.2 Player A / Player B 视觉区分

Player A：

- 主色：红色
- 标签：`Player A · Left Side`
- 边框或角标使用红色光效

Player B：

- 主色：蓝色
- 标签：`Player B · Right Side`
- 边框或角标使用蓝色光效

### 7.3 玩家面板样式

推荐样式：

- 深色半透明卡片
- 圆角：20px
- 边框：1px 半透明亮色
- 内部间距：16px - 24px
- 背景略带毛玻璃效果
- Hover 时边框微亮

### 7.4 玩家标题栏

标题栏内容：

```text
Player A · Left Side
```

或：

```text
Player B · Right Side
```

状态标签：

- `Not Ready`
- `Ready`
- `Champion`

状态颜色：

- Not Ready：灰色
- Ready：绿色
- Champion：金色

---

## 8. 角色卡片选择模块

### 8.1 模块结构

角色模块包含：

1. 小标题：`Choose Character`
2. 横向滑动卡片列表
3. 6 张角色卡片
4. 选中态高亮

### 8.2 角色卡片规格

所有角色卡片素材已为 3:4 比例。

卡片设计要求：

- 比例保持 3:4
- 不要强行裁切角色
- 图片区域完整展示
- 底部可显示角色名称
- 卡片整体可点击
- 选中后出现高亮边框

### 8.3 角色卡片样式

默认态：

- 深色卡片底
- 1px 暗色边框
- 轻微阴影

Hover 态：

- 卡片轻微上浮
- 边框变亮
- 图片亮度略提升

选中态：

- Player A：红色边框 + 红色光晕
- Player B：蓝色边框 + 蓝色光晕
- 右上角显示 check 图标
- 卡片底部显示 `Selected`

### 8.4 横向滑动规则

桌面端：

- 每行展示 3 - 4 张卡片
- 超出横向滚动
- 滚动条尽量弱化或自定义

移动端：

- 横向滑动
- 每屏展示 1.5 - 2.2 张卡片

---

## 9. 装备卡片选择模块

### 9.1 模块结构

装备模块包含：

1. 小标题：`Choose Weapon`
2. 横向滑动卡片列表
3. 6 张装备卡片
4. 选中态高亮

### 9.2 装备卡片规格

所有装备卡片素材已为 3:4 比例。

卡片设计要求：

- 比例保持 3:4
- 装备完整展示
- 不要裁切装备主体
- 图片留有呼吸空间
- 底部可显示装备名称

### 9.3 装备卡片样式

与角色卡片保持一致，但装备卡片可以略微更紧凑。

默认态、Hover 态、选中态规则同角色卡片。

### 9.4 装备名称建议

可使用以下名称作为 UI 文案：

1. Heavy Machete
2. Holy Greatsword
3. Nunchaku
4. Tactical Rifle
5. Rocket Launcher
6. Quantum Cannon

中文版本：

1. 重型砍刀
2. 圣光大剑
3. 双截棍
4. 战术步枪
5. 火箭筒
6. 量子聚能炮

---

## 10. 自定义输入模块设计

### 10.1 模块目标

自定义输入用于支持用户通过提示词和参考图生成自己的角色或装备。

每个玩家有两个自定义输入模块：

1. Custom Character
2. Custom Weapon

### 10.2 输入区结构

每个自定义输入模块包含：

1. 输入框标题
2. Prompt 文本框
3. 上传参考图按钮
4. 已上传图片预览
5. 清空按钮

### 10.3 输入框样式

Prompt 输入框：

- 深色背景
- 明亮边框
- 圆角 12px
- 高度适中
- Placeholder 清晰
- Focus 时边框发光

角色输入 Placeholder：

```text
Describe your fighter, e.g. a cyber ninja with glowing armor...
```

装备输入 Placeholder：

```text
Describe your weapon, e.g. a plasma hammer with blue energy core...
```

### 10.4 上传按钮样式

上传按钮文案：

```text
Upload Reference
```

或：

```text
上传参考图
```

样式：

- 虚线边框
- 小图标
- Hover 时边框高亮
- 上传后显示缩略图

### 10.5 自定义模式提示

当用户输入 Prompt 或上传图片后，显示标签：

```text
Custom Mode
```

说明当前输入会覆盖已选卡片。

---

## 11. 主操作按钮设计

### 11.1 按钮位置

`Start Battle` 按钮位于双玩家配置区下方，居中展示。

### 11.2 按钮状态

#### 不可点击状态

条件：

- 任一玩家未完成角色或装备配置
- 当前正在生成
- 视频正在播放

文案：

```text
Waiting for Players
```

样式：

- 灰色
- 透明度降低
- 不发光
- 鼠标不可点击

#### 可点击状态

条件：

- 双方角色和装备均已完成
- 当前不在生成或播放中

文案：

```text
Start Battle
```

样式：

- 红蓝渐变
- 强发光
- Hover 时轻微放大
- 点击时有按压反馈

#### 生成中状态

文案：

```text
Generating...
```

样式：

- 禁用
- 显示 loading spinner
- 按钮保持霓虹微光

---

## 12. 等待弹窗设计

### 12.1 触发时机

用户点击 `Start Battle` 后立即出现。

覆盖阶段：

1. 图片生成中
2. AI 裁判判断中
3. 视频生成中

### 12.2 弹窗结构

弹窗内容包括：

1. 标题
2. 副标题
3. 当前阶段
4. 20 秒倒计时
5. 轻量动效
6. 提示文案

### 12.3 推荐文案

标题：

```text
Battle is being generated...
```

副标题：

```text
AI is creating your arena battle. This may take a few seconds.
```

中文版本：

```text
战斗生成中...
AI 正在生成你的专属擂台对决，请稍等片刻。
```

阶段文案：

```text
Creating battle image...
AI judge is analyzing the matchup...
Rendering final battle video...
```

中文：

```text
正在生成擂台对峙图...
AI 裁判正在判断胜负...
正在生成最终战斗视频...
```

### 12.4 倒计时规则

倒计时从 20 秒开始。

如果 20 秒内完成，弹窗关闭。

如果 20 秒结束仍未完成，倒计时文案变为：

```text
Almost there...
```

中文：

```text
即将完成...
```

### 12.5 视觉风格

弹窗风格：

- 深色半透明遮罩
- 中央卡片
- 霓虹边框
- 红蓝流动光效
- 轻微扫描线或像素动效
- 不要过于花哨，避免影响可读性

---

## 13. 结果弹窗设计

### 13.1 触发时机

战斗视频播放结束后自动弹出。

### 13.2 弹窗内容

内容包括：

1. 胜方标题
2. AI 裁判原因
3. 胜方标识
4. 两个按钮

示例：

```text
Left Player Wins!
Reason: The left weapon has longer reach and stronger pressure.
```

中文：

```text
左侧玩家获胜！
原因：左侧装备攻击范围更广，压制力更强。
```

按钮：

```text
继续守擂
退出游戏
```

### 13.3 视觉风格

胜利弹窗应更有仪式感：

- 标题大而醒目
- 可使用金色 / 霓虹黄
- 胜方为左侧时加入红色光晕
- 胜方为右侧时加入蓝色光晕
- 可加入轻微 confetti 或闪光动效
- 不要遮挡过多页面内容

### 13.4 按钮设计

主按钮：继续守擂

- 使用金色或胜方颜色
- 视觉权重更高

次按钮：退出游戏

- 使用深色描边按钮
- 视觉权重较低

---

## 14. 错误弹窗设计

### 14.1 图片生成失败

标题：

```text
Battle Image Failed
```

文案：

```text
角色或装备生成失败了，可能是图片内容不清晰或提示词过于复杂。请调整输入后再试一次。
```

按钮：

```text
Try Again
```

### 14.2 视频生成失败

标题：

```text
Battle Video Failed
```

文案：

```text
战斗视频生成失败了，可能是模型繁忙或首帧信息过于复杂。你可以保留当前角色和装备再次生成。
```

按钮：

```text
Regenerate Video
```

### 14.3 上传失败

标题：

```text
Upload Failed
```

文案：

```text
图片上传失败，请检查图片格式和大小后重新上传。
```

按钮：

```text
OK
```

### 14.4 错误弹窗视觉

错误弹窗保持克制：

- 红色边框
- 清晰说明
- 不要使用过于夸张的失败视觉
- 保留用户输入，不要让用户感到操作成本过高

---

## 15. 状态标签设计

### 15.1 玩家状态

Not Ready：

```text
Not Ready
```

Ready：

```text
Ready
```

Champion：

```text
Champion
```

中文可选：

```text
未准备
已准备
守擂中
```

### 15.2 对战状态

可在中央擂台区或按钮附近展示：

```text
Waiting for players
Ready to battle
Creating battle image
Judging matchup
Rendering battle video
Video ready
Battle finished
```

中文可选：

```text
等待玩家入局
可以开始战斗
正在生成对峙图
AI 裁判判断中
正在生成战斗视频
视频已生成
战斗结束
```

---

## 16. 动效设计

### 16.1 页面动效原则

动效应增强游戏感，但不能影响操作效率。

推荐动效：

- 卡片 hover 轻微上浮
- 选中卡片边框发光
- 主按钮 hover 微放大
- 等待弹窗光效流动
- 视频播放按钮轻微 pulse
- 结果弹窗出现时轻微 scale in

避免：

- 大量闪烁
- 复杂粒子
- 过快动效
- 影响性能的背景动画

### 16.2 过渡动效

状态切换建议使用：

- fade in / fade out
- scale 0.96 → 1
- opacity 0 → 1
- 150ms - 300ms 过渡时间

### 16.3 生成等待动效

可以使用：

- 环形 loading
- 霓虹进度条
- 像素扫描线
- 红蓝能量流动线

---

## 17. 响应式设计

### 17.1 桌面端

桌面端为主设计场景。

布局：

- 中央擂台区居中，占主要宽度
- Player A 和 Player B 左右并排
- 卡片横向滚动
- 主按钮居中

### 17.2 平板端

平板端可保持左右布局，但需要压缩卡片尺寸。

要求：

- 玩家面板宽度适配
- 字体不要过小
- 输入框保持可用

### 17.3 移动端

移动端改为上下结构：

```text
顶部标题
中央擂台展示区
Player A 配置区
Player B 配置区
Start Battle 按钮
```

移动端要求：

- 擂台展示区仍保持 16:9
- 卡片横向滑动
- 输入框宽度 100%
- 主按钮可固定在底部或显示在配置区下方
- 弹窗宽度适配屏幕

---

## 18. 素材使用规则

### 18.1 已有assets/static

前端需要使用以下已生成素材：

1. 格斗擂台背景底图
2. 等待玩家进入过渡视频
3. 6 张角色卡片图
4. 6 张装备卡片图
5. 默认战斗占位图
6. 默认战斗视频

### 18.2 素材展示要求

角色卡片：

- 保持 3:4 比例
- 全身完整展示
- 不要裁切头部或脚部

装备卡片：

- 保持 3:4 比例
- 装备完整展示
- 不要裁切武器两端

擂台视频 / 图片：

- 保持 16:9 比例
- 不要拉伸变形
- 不要遮挡关键内容

---

## 19. Stitch 输出要求

请 Google Stitch 生成一个高完成度的前端页面原型。

### 19.1 技术输出倾向

生成前端代码时，建议包含：

- React 单页组件结构
- 清晰的组件分区
- 现代 CSS / Tailwind 风格
- 可替换的图片和视频占位资源
- Mock 状态切换
- 弹窗组件
- 卡片选择交互
- 响应式布局

### 19.2 不需要实现的部分

Stitch 阶段不需要完成：

- 真实 AI API 调用
- 后端接口
- 用户登录
- 真实上传到云存储
- 真实多人联机
- 数据库
- 支付系统

### 19.3 需要重点完成的部分

Stitch 阶段重点完成：

1. 页面整体视觉风格
2. 中央擂台展示区
3. 双玩家配置区
4. 角色 / 装备卡片选择效果
5. 自定义输入区
6. Start Battle 按钮状态
7. 等待弹窗样式
8. 结果弹窗样式
9. 错误弹窗样式
10. 响应式布局

---

## 20. Stitch 总提示词

可将以下内容作为 Google Stitch 的主提示词使用：

```text
Create a high-polish responsive web frontend for an AI-powered arena fighting game demo called "AI Arena Duel".

The page should feel like a 90s retro arcade side-scrolling fighting game lobby with a modern AIGC product interface. Use a dark neon visual style with red and blue player accents, bold contrast, glassmorphism cards, glowing borders, and a dramatic central arena display.

The layout should be a single-page web app:
1. Top header with title "AI Arena Duel" and subtitle "Choose your fighter. Pick your weapon. Let AI decide the battle."
2. A large central 16:9 arena display area for waiting video, battle image, or battle video.
3. Two player configuration panels below: Player A / Left Side and Player B / Right Side.
4. Each player panel includes character card selection, custom character prompt input, character reference upload, weapon card selection, custom weapon prompt input, and weapon reference upload.
5. A large centered "Start Battle" button below both player panels.
6. A loading modal with a 20-second countdown and stage text.
7. A result modal showing the winner, reason, "Continue Champion" and "Exit Game" buttons.
8. Error modals for image generation failure, video generation failure, and upload failure.

Visual style:
- Dark arcade arena background.
- Red accent for Player A.
- Blue accent for Player B.
- Neon glow, subtle pixel noise, high contrast.
- Card-based selection UI.
- 3:4 character and weapon cards.
- 16:9 arena display.
- Smooth hover and selection animations.
- Responsive layout for desktop and mobile.

Do not implement real backend or AI API calls. Use mock states and placeholder assets. Focus on frontend layout, visual design, interaction states, and component structure.
```

---

## 21. 设计验收标准

生成结果应满足：

1. 用户一眼能看懂这是一个 AI 格斗擂台产品。
2. 中央擂台区域是视觉焦点。
3. Player A 和 Player B 的左右对抗关系清晰。
4. 角色和装备选择卡片有明确选中态。
5. 自定义输入区不显得杂乱。
6. Start Battle 按钮状态清晰。
7. 生成等待弹窗有强反馈，不像页面卡死。
8. 结果弹窗有胜利仪式感。
9. 整体风格统一，不像普通后台或工具站。
10. 移动端也能完成核心流程。
