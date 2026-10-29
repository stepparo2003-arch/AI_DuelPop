# Real Model Setup (Optional)

The default demo is entirely mock. Real integrations are optional adapters and were not validated by the showcase video or automated checks. Provider availability, model IDs, commands, region, and pricing may change.

## Prerequisites

- Node.js 22.12 or newer.
- A PixVerse account with model access and credits.
- A DashScope/Bailian API key with access to the configured Qwen model.
- An understanding that prompts and reference media will be sent to those providers and may consume credits.

From the repository root:

```bash
cp .env.real.example .env
npm install --prefix .local-tools pixverse@1.4.16
./.local-tools/node_modules/.bin/pixverse auth login
./.local-tools/node_modules/.bin/pixverse account info
```

Set `PIXVERSE_CLI_BIN` in `.env` to the **absolute path** of `.local-tools/node_modules/.bin/pixverse` (on Windows, use the applicable CLI entry point). Fill `DASHSCOPE_API_KEY` locally. Never paste keys into issues or commits. The pinned CLI version documents the tested command interface, not successful real generation.

The template explicitly sets:

```dotenv
APP_MODE=real
PIXVERSE_CLI_DISABLED=0
REQUIRE_REAL_GENERATION=1
```

Start with `npm run dev`. `/api/health` reports configured providers; it does not verify credentials, account balance, or model availability.

## Provider Settings

- Image: PixVerse CLI `create image`, default model `seedream-4.5`, reference images and 16:9 output.
- Judge: Qwen compatible endpoint, configured using `DASHSCOPE_API_KEY`, `DASHSCOPE_BASE_URL`, and `QWEN_JUDGE_MODEL`.
- Video: PixVerse CLI `create video`, default model `v6`, using the generated image.
- HTTP video adapter: selected when CLI is disabled and `PIXVERSE_API_KEY` is set. Real image generation still requires a CLI image command in the current architecture, so this is not a complete CLI-free workflow.

`PIXVERSE_CLI_IMAGE_COMMAND` and `PIXVERSE_CLI_VIDEO_COMMAND` override command templates. Supported placeholders include `{pixverse}`, `{prompt}`, `{promptFile}`, `{referenceImages}`, `{arenaImage}`, `{inputImage}`, `{outputDir}`, `{outputImage}`, `{outputVideo}`, and `{winnerSide}`. The backend shell-quotes values.

## Known Limits

Cloud judging must receive an accessible image URL or a supported image representation; a `127.0.0.1` URL is not accessible to a remote provider. CLI JSON response formats and generated output locations must also match the adapter. These are integration requirements to validate before describing real generation as working.

Strict real mode reports image, judge, and video errors as failures. Setting `REQUIRE_REAL_GENERATION=0` allows mock fallback; inspect provider labels in results to distinguish it from real output.

## Return to Mock

Stop the server, replace `.env` with `.env.example`, and restart. Remove an externally set `APP_MODE=real` as process environment variables override `.env`. Mock mode does not contact model providers, even if API keys remain in the shell environment.
