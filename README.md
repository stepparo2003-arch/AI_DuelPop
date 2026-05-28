# AI Arena Duel

AI Arena Duel is a local web prototype for a two-player AIGC arena battle game. Players select or customize characters and weapons, generate a battle standoff image, let an AI judge decide the winner, then generate a cinematic battle video and save the result to an asset library.

## Features

- Two-player character and weapon selection
- Custom character and weapon prompts
- AI image generation through PixVerse CLI with Seedream 4.5
- AI battle judging and post-match analysis through Qwen
- AI battle video generation through PixVerse CLI with PixVerse V6
- Asset library for battle videos, generated images, input cards, and post-match analysis
- Local-only runtime history and generated assets

## Project Structure

```text
assets/static/        Fixed character, weapon, arena, medal, and fallback media assets
backend/              Local Node.js backend and AI provider orchestration
docs/                 Product, design, and interaction documents
frontend/app/         Single-page frontend entry
```

## Security Notes

API keys must stay local.

- Put real keys only in `.env`.
- `.env` is ignored by Git and must not be committed.
- `.env.example` contains placeholders only.
- `backend/generated/` and `backend/data/` are ignored because they may contain generated media, prompts, local paths, and battle history.

Before pushing, run:

```bash
rg "sk-|API_KEY=.*[A-Za-z0-9]" -g '!.env' -g '!backend/generated/**' -g '!backend/data/**'
```

## Setup

```bash
cp .env.example .env
npm install
```

Edit `.env` with your local credentials and PixVerse CLI settings.

PixVerse CLI should be installed and logged in before real generation:

```bash
npm install -g pixverse
pixverse auth login
pixverse account info
```

## Run

```bash
npm run dev
```

Open:

```text
http://127.0.0.1:8787/frontend/app/index.html
```

## Checks

```bash
npm run check
```

## GitHub

The repository should be created as private. Recommended GitHub CLI command:

```bash
gh repo create ai-arena-duel --private --source=. --remote=origin --push
```
