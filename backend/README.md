# AI Arena Duel Backend

这是当前 MVP 的后端编排层。它先用 mock provider 跑通完整业务链路，并已预留 PixVerse CLI、Qwen 视觉裁判和 PixVerse v6 视频适配器。

当前链路：

- 图片生成：优先使用 PixVerse CLI 调 seedream 4.5；未配置命令或调用失败时自动回退 mock
- AI 裁判：优先使用 Qwen 视觉模型；未配置 key 或调用失败时自动回退 mock
- 视频生成：优先使用 PixVerse CLI 调 v6；未配置命令时再尝试 PixVerse HTTP API；失败时自动回退 mock

PixVerse CLI 适配器位于：

```text
backend/providers/pixverseCliProvider.js
```

Qwen 裁判适配器位于：

```text
backend/providers/qwenJudgeProvider.js
```

PixVerse v6 视频适配器位于：

```text
backend/providers/pixverseVideoProvider.js
```

## 启动

在项目根目录执行：

```bash
npm run dev
```

默认地址：

```text
http://127.0.0.1:8787
```

## Qwen 裁判配置

复制 `.env.example` 为 `.env`，或直接在启动命令前设置环境变量：

```bash
DASHSCOPE_API_KEY=sk-your-bailian-api-key QWEN_JUDGE_MODEL=qwen3.6-plus npm run dev
```

当前默认值：

```text
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_JUDGE_MODEL=qwen3.6-plus
```

如果百炼控制台实际模型 ID 是 `qwen-3.6-plus`，可直接覆盖：

```bash
QWEN_JUDGE_MODEL=qwen-3.6-plus
```

注意：云端视觉模型通常无法访问 `127.0.0.1` 图片地址。接入真实生图后，应优先把公开可访问的生图 URL 传给 Qwen；如果模型支持 base64 图片输入，也可以后续把本地图片转为 base64 data URL。

## PixVerse v6 视频配置

```bash
PIXVERSE_API_KEY=your-pixverse-api-key PIXVERSE_VIDEO_MODEL=v6 npm run dev
```

当前默认值：

```text
PIXVERSE_BASE_URL=https://app-api.pixverse.ai
PIXVERSE_VIDEO_MODEL=v6
PIXVERSE_VIDEO_DURATION=8
PIXVERSE_VIDEO_QUALITY=720p
```

当前适配器流程：

1. 上传对峙图到 PixVerse：`POST /openapi/v2/image/upload`
2. 创建 Image-to-Video 任务：`POST /openapi/v2/video/img/generate`
3. 轮询视频结果：`GET /openapi/v2/video/result/{video_id}`

PixVerse v6 可做视频生成；文档里还提供 `Upload Image` 和 `Image template generation`，但我没有看到通用文本生图/对峙图生成 API。因此当前产品的“擂台对峙图生成”仍建议使用后续你准备接入的生图模型。

## PixVerse CLI 模式

当前产品默认启用 PixVerse CLI 模式，直接按 PixVerse 官方文档中的命令生成图片和视频。

首次使用前先安装并登录：

```bash
npm install -g pixverse
pixverse auth login
pixverse account info
```

如果服务启动环境找不到 `pixverse`，先运行：

```bash
command -v pixverse
```

然后把返回的完整路径写入 `.env`：

```bash
PIXVERSE_CLI_BIN=/absolute/path/to/pixverse
```

默认图片命令：

```bash
{pixverse} create image \
  --prompt "{prompt}" \
  --model seedream-4.5 \
  --quality 2160p \
  --aspect-ratio 16:9 \
  --json
```

默认视频命令：

```bash
{pixverse} create video \
  --prompt "{prompt}" \
  --image "{inputImage}" \
  --model v6 \
  --quality 1080p \
  --duration 8 \
  --json
```

如果要覆盖默认命令，可在 `.env` 里配置：

```bash
PIXVERSE_CLI_IMAGE_COMMAND="{pixverse} create image --prompt {prompt} --model seedream-4.5 --quality 2160p --aspect-ratio 16:9 --json"
PIXVERSE_CLI_VIDEO_COMMAND="{pixverse} create video --prompt {prompt} --image {inputImage} --model v6 --quality 1080p --duration 8 --json"
PIXVERSE_CLI_TIMEOUT_MS=1200000
```

命令模板支持这些占位符，后端会自动加 shell 引号：

```text
{pixverse}     PixVerse CLI 可执行文件路径
{promptFile}   图片/视频 prompt 文件路径
{prompt}       图片/视频 prompt 文本
{outputDir}    本次任务输出目录
{outputImage}  建议图片输出路径，通常是 battle-standoff.png
{arenaImage}   固定擂台背景底图路径
{inputImage}   视频生成输入图路径
{outputVideo}  建议视频输出路径，通常是 battle-video.mp4
{winnerSide}   left 或 right
```

推荐命令让 CLI 输出到 `{outputImage}` 和 `{outputVideo}`。如果你的 CLI 只能输出 JSON，也可以在 stdout 返回：

```json
{ "imagePath": "/absolute/path/to/image.png" }
```

或：

```json
{ "videoPath": "/absolute/path/to/video.mp4" }
```

如果没有指定固定文件名，后端会在 `{outputDir}` 下自动寻找最新的图片或视频文件。

如果想临时关闭 CLI，改用 mock/API 兜底：

```bash
PIXVERSE_CLI_DISABLED=1
```

验收测试建议保持：

```bash
REQUIRE_REAL_GENERATION=1
```

开启后，如果 seedream 4.5 生图或 PixVerse v6 生视频失败，后端会直接让任务失败并把错误展示给前端，不会使用 mock 结果冒充成功。

前端入口：

```text
http://127.0.0.1:8787/frontend/app/index.html
```

## 当前接口

### GET /api/health

服务健康检查。

### POST /api/battles

创建一场生成任务。请求体：

```json
{
  "players": {
    "left": {
      "character": {
        "mode": "preset",
        "name": "Bounty Hunter",
        "description": "A masked gun-for-hire with tactical armor.",
        "assetPath": "../../assets/static/赏金猎人.png"
      },
      "weapon": {
        "mode": "preset",
        "name": "Holy Sword",
        "description": "A balanced melee weapon with clean reach.",
        "assetPath": "../../assets/static/圣剑.png"
      }
    },
    "right": {
      "character": {
        "mode": "custom",
        "prompt": "A silver armored frost warrior"
      },
      "weapon": {
        "mode": "preset",
        "name": "Rocket Launcher",
        "description": "A destructive heavy weapon with area pressure.",
        "assetPath": "../../assets/static/火箭筒.png"
      }
    }
  }
}
```

返回 `202`，包含任务 id、状态和进度。

### GET /api/battles/:id

查询任务状态。任务完成后返回：

```json
{
  "status": "completed",
  "stage": "completed",
  "progress": 100,
  "result": {
    "image": {
      "imageUrl": "http://127.0.0.1:8787/assets/static/格斗占位图.png"
    },
    "judge": {
      "winnerSide": "left",
      "confidence": 0.67,
      "reason": "..."
    },
    "video": {
      "videoUrl": "http://127.0.0.1:8787/assets/static/默认格斗视频.mp4"
    }
  }
}
```

## 后续需要你补充

- Qwen 视觉裁判模型 API Key，以及最终确认的模型 ID
- 是否需要服务端保存生成结果，还是只透传模型返回 URL
- 生成任务最大等待时间、失败重试策略、并发限制
