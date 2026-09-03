# Snip — bundle (generated output)

> **Do not hand-edit this branch.** Everything here is generated and will be
> overwritten without warning.

This is the **release branch** for [Snip](https://github.com/Aloysius-C/snip-workshop-day-1)
— the same spirit as `gh-pages`. It holds the whole app assembled into one runnable
folder: the Bun API server, the built Angular UI, and the Node CLI.

It is produced by `scripts/build-bundle.mjs` on the `main` branch, which copies from
the `backend`, `frontend`, and `cli` branches. To change anything here, **edit the
source branch** and re-run the build:

```bash
node scripts/build-bundle.mjs --push
```

Contents once built:

| Path | Comes from |
|------|-----------|
| `server.js` | `backend` branch, copied as-is |
| `cli.js` | `cli` branch, copied as-is |
| `public/` | `frontend` branch, `ng build` output |
| `.env` | generated — sets `PUBLIC_DIR=./public` so one process serves API + UI |
| `package.json`, `Dockerfile`, `.dockerignore`, `railway.json` | generated |

## Run it

```bash
bun start                      # http://localhost:3000 — API, redirects, and the web UI
docker build -t snip . && docker run --rm -p 3000:3000 snip
```
