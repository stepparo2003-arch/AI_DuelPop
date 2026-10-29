# AI DuelPop

**English** | [简体中文](README.zh-CN.md)

## Mock Demo

> **Mock video — no real AI models were used for generation. For demonstration purposes only.**

[![AI DuelPop — full-page mock interface preview](docs/media/ai-duelpop-full-page.png)](docs/media/ai-duelpop-mock-demo.mp4)

**[▶ Watch the mock demo (with audio)](docs/media/ai-duelpop-mock-demo.mp4)** · 63 seconds

A local, two-player arena battle prototype. Choose characters and weapons, run a simulated battle, watch the demo video, and review the result in an asset library.

**Mock mode is the default.** It uses bundled placeholder media and a deterministic scoring system. It does not call real AI models or require accounts, API keys, or provider credits. The video illustrates the interface and interaction flow; it does not demonstrate live generation.

## Current Version Scope

This version uses a fixed pipeline, primarily to validate the workflow and test its effects. It is intended as a foundation for future livestream AI arena battle interactions. Switching to other image/video model providers or resources is not supported; image and video model calls are made only through PixVerse CLI. Qwen is used separately for judging. The default mock mode makes no real model calls.

## Quick Start

### Run the mock demo

Install [Git](https://git-scm.com/) and [Node.js 22.12 or newer](https://nodejs.org/) (including npm). Verify the installation in a terminal:

```bash
git --version
node --version
npm --version
```

Then clone and start:

```bash
git clone https://github.com/stepparo2003-arch/AI_DuelPop.git ai-duelpop
cd ai-duelpop
npm run dev
```

Open **http://127.0.0.1:8787**. The app uses Node.js built-ins, so no `npm install` is needed for mock mode. Keep the terminal open while using the app; press **Ctrl+C** to stop it. On macOS, you can also run `./start-backend.command` from the repository directory after installing Node.js. If you download a ZIP instead, extract it and open a terminal in the extracted directory before running `npm run dev`.

Choose a character and weapon for both players, click **Start Battle**, wait for preparation, then click **Play Battle**. The battle video plays with sound. Waiting-room playback stays muted. Completed battles and analysis are saved to the asset library on this computer.

To use **Custom Character** or **Custom Weapon**, click the selected preset card again to deselect it, then open the corresponding custom tab and enter a description. A selected preset disables the matching text input; clear custom text before choosing a preset again. In mock mode, custom text affects simulated scoring only and does not generate new media.

Optional configuration:

```bash
cp .env.example .env
```

The defaults work without this file. If port 8787 is in use (`EADDRINUSE`), copy the template, change `PORT=8787` to `PORT=8788` in `.env`, restart, and open **http://127.0.0.1:8788** instead. Existing shell environment variables take precedence over `.env`; remove a previously set `APP_MODE=real` to return to the mock demo.

Check **http://127.0.0.1:8787/api/health** (or your chosen port): default mock mode reports `"mode":"mock"` and `"imageProvider":"mock"`, `"judgeProvider":"mock"`, `"videoProvider":"mock"`.

### Optional real generation

The quick start above verifies the local mock experience only. Real generation additionally needs PixVerse CLI login, provider credits, a compatible Qwen model, and a DashScope/Bailian key. Follow [real model setup](docs/real-model-setup.md). These real integrations have not been verified end to end with paid provider calls, so following the mock quick start does not establish that real generation works.

## Features and Status

| Feature | Current behavior |
| --- | --- |
| Two-player character and weapon selection | Preset choices and custom prompt inputs |
| Mock battle | Bundled image/video and deterministic winner/analysis |
| Playback | User-initiated battle audio; muted waiting loop |
| Asset library | Local battle history, prompts, and media references |
| Real image generation | Optional PixVerse CLI / Seedream adapter |
| Real judging | Optional Qwen adapter |
| Real video generation | Fixed PixVerse CLI / V6 adapter |

Real integrations require credentials, supported models, and provider credits. They are **not validated by the mock demo or CI**. See [real model setup](docs/real-model-setup.md) for explicit opt-in and limitations.

## Implemented Pipeline

In **real mode**, the current implementation follows this sequence:

1. Preset selections supply their names, descriptions, and bundled reference images. Custom character/weapon inputs supply text only.
2. The backend inserts both players' descriptions into a fixed scene template, together with the arena background and available preset reference images. PixVerse CLI calls Seedream 4.5 to generate one standoff image.
3. Qwen receives that image, both players' text configuration, and judging rules. It returns the winning side, a summary, and post-match analysis.
4. The backend inserts only the winning/losing side into a fixed video prompt. PixVerse CLI calls V6 using the standoff image as its input, then the interface plays and archives the result.

Custom inputs are **not** separately rendered into character/weapon images first, and there is no separate LLM prompt-enhancement step. Qwen does **not** generate the video prompt or choreography. Default mock mode replaces the model steps with bundled media and deterministic scoring.

The supported integration path is fixed, but advanced CLI command overrides still exist in `.env`; this is not a hard restriction preventing custom commands. A different provider/model is outside the documented and validated workflow. Keep duration settings in the CLI command and the fixed video prompt consistent if you edit them.

## Project Structure

```text
.github/workflows/    Automated syntax and integration checks
assets/static/       Bundled character, weapon, arena, and demo media
backend/             HTTP server, battle orchestration, prompts, and providers
frontend/app/        Single-page interface
scripts/             Dependency-free development checks
tests/               Mock workflow and static-file security tests
docs/                Setup, design notes, and asset credits
  media/             README demo video and poster
```

Runtime-only directories `backend/data/` and `backend/generated/` are ignored by Git. See [backend documentation](backend/README.md) for API details. Design documents in `docs/` describe the prototype's intent and may include planned features; the status table above describes the current implementation.

## Checks

```bash
npm run check
npm test
```

Checks include backend and inline frontend JavaScript syntax, a complete mock battle, history persistence, video range requests, blocked private files, and strict real-mode failure behavior. GitHub Actions runs them on Node.js 22 and 24.

## Local Use and Limitations

- This is a local prototype. Keep `HOST=127.0.0.1`. It has no authentication, rate limiting, or multi-user isolation; it is not ready for an internet-facing deployment.
- Static serving is restricted to frontend files and supported media. `.env`, backend source, raw history, and generation prompt files are not public static endpoints.
- The library API intentionally exposes this local user's history to the interface. It is not a privacy boundary between users.
- Keep real keys in `.env` only. Do not commit credentials, generated content, or private prompts. See [security guidance](SECURITY.md).
- Fonts load from Google Fonts; restricted or offline networks may use fallback fonts.
- Mock media is fixed: selected characters, the scored winner, and the bundled video may not match visually.

## License and Assets

Original source code and documentation are licensed under [MIT](LICENSE). Images, videos, audio, screenshots, fonts, and other third-party material are excluded from that grant. See [asset sources and credits](docs/assets-and-credits.md) for provenance status and reuse limitations.
