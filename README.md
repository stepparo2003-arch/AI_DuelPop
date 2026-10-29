# AI Arena Duel

## Mock Demo

> **Mock video — no real AI models were used for generation. For demonstration purposes only.**

[![AI Arena Duel — full-page mock interface preview](docs/media/ai-arena-full-page.png)](docs/media/ai-arena-mock-demo.mp4)

**[▶ Watch the mock demo (with audio)](docs/media/ai-arena-mock-demo.mp4)** · 63 seconds

A local, two-player arena battle prototype. Choose characters and weapons, run a simulated battle, watch the demo video, and review the result in an asset library.

**Mock mode is the default.** It uses bundled placeholder media and a deterministic scoring system. It does not call real AI models or require accounts, API keys, or provider credits. The video illustrates the interface and interaction flow; it does not demonstrate live generation.

## Quick Start

Install [Node.js 22.12 or newer](https://nodejs.org/), then:

```bash
git clone https://github.com/stepparo2003-arch/ai-arena-duel.git
cd ai-arena-duel
npm run dev
```

Open **http://127.0.0.1:8787**. The app uses Node.js built-ins, so no `npm install` is needed for mock mode. On macOS, you can also run `./start-backend.command` from any location after installing Node.js.

Choose a character and weapon for both players, click **Start Battle**, wait for preparation, then click **Play Battle**. The battle video plays with sound. Waiting-room playback stays muted. Completed battles and analysis are saved to the asset library on this computer.

Optional configuration:

```bash
cp .env.example .env
```

The defaults work without this file. Change `PORT` in `.env` if port 8787 is in use.

## Features and Status

| Feature | Current behavior |
| --- | --- |
| Two-player character and weapon selection | Preset choices and custom prompt inputs |
| Mock battle | Bundled image/video and deterministic winner/analysis |
| Playback | User-initiated battle audio; muted waiting loop |
| Asset library | Local battle history, prompts, and media references |
| Real image generation | Optional PixVerse CLI / Seedream adapter |
| Real judging | Optional Qwen adapter |
| Real video generation | Optional PixVerse CLI / HTTP adapter |

Real integrations require credentials, supported models, and provider credits. They are **not validated by the mock demo or CI**. See [real model setup](docs/real-model-setup.md) for explicit opt-in and limitations.

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
