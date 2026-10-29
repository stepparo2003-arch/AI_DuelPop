# Security

AI Arena Duel is a local prototype. Use the default `HOST=127.0.0.1` and mock mode for demonstrations. The API has no authentication, rate limiting, or user isolation and is not intended for a public server.

## Local Secrets and Data

- Keep credentials only in `.env` or your process environment. `.env.example` and `.env.real.example` intentionally contain no credentials.
- Never commit `.env`, private prompts, generated media, or local battle history. These runtime paths are ignored by Git.
- Static routes block private configuration and source files. The library API intentionally supplies local history to the UI; it is not an access-control system.
- Before pushing, review `git diff --cached` and use GitHub secret scanning/push protection where available. Removing a key from the latest version does not remove it from history; revoke any exposed key first.

## Reporting

For a suspected vulnerability, use the repository's private vulnerability reporting feature if available, or contact the maintainer privately through their GitHub profile. Do not include real keys, private prompts, or personal data in a public issue. Private vulnerability reporting and account-level security settings are managed separately from this repository's source files.
