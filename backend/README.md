# Backend

A dependency-free Node.js HTTP server for local demo playback, battle orchestration, and a local asset library. Start from the repository root with `npm run dev` and open http://127.0.0.1:8787.

## Modes

- **Mock (default):** `APP_MODE` is absent or is not `real`. All three steps use mock providers even when provider credentials exist in the environment. No AI accounts or credits are needed.
- **Real (explicit opt-in):** `APP_MODE=real`. See [real model setup](../docs/real-model-setup.md). Strict generation is enabled unless `REQUIRE_REAL_GENERATION=0` is explicitly set. In strict mode, missing or failed image, judge, or video providers fail the job rather than report mock success.

Configuration is read from the root `.env`; existing process environment variables take precedence. `.env.example` provides mock defaults. `.env.real.example` provides real-provider settings without secrets.

## API

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Mode and selected provider configuration; not an authentication/readiness test |
| GET | `/api/prompts` | System prompt templates |
| POST | `/api/battles` | Validate inputs and queue a battle; returns 202 |
| GET | `/api/battles/:id` | Poll progress, result, or failure |
| GET | `/api/library` | Read completed local battle records |
| GET | `/api/library/:id` | Read a specific record |
| DELETE | `/api/library` | Delete records using a JSON `ids` array |
| DELETE | `/api/library/:id` | Delete a specific record |

Example battle request:

```json
{
  "players": {
    "left": {
      "character": {"mode": "preset", "name": "Bounty Hunter", "assetPath": "../../assets/static/赏金猎人.png"},
      "weapon": {"mode": "preset", "name": "Holy Sword", "assetPath": "../../assets/static/圣剑.png"}
    },
    "right": {
      "character": {"mode": "custom", "prompt": "A silver armored frost warrior"},
      "weapon": {"mode": "preset", "name": "Rocket Launcher", "assetPath": "../../assets/static/火箭筒.png"}
    }
  }
}
```

Poll the returned job ID until `status` is `completed` or `failed`. Completed results contain `image`, `judge`, and `video` objects with their provider labels. Mock results reference bundled media. Job polling state is held in memory; completed library records persist in `backend/data/history.json`. Up to 100 completed records are retained.

## Files and Security

Static access is limited to supported frontend files under `frontend/app/` and media files under `assets/static/`, `docs/media/`, and `backend/generated/`. Dotfiles, symlinks escaping those directories, backend source, raw history JSON, and generation prompt text are blocked.

This restriction does not add authentication to the API. Keep the service on loopback. Generated media and library responses may contain personal content; do not expose this server to other users or the internet without a separate authentication and deployment review.
