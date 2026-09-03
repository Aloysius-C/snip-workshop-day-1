# Snip — frontend

The web client for **Snip**, a tiny URL shortener. Angular 19, one standalone
component plus one `HttpClient` service, signals for state.

## Run

```bash
npm install
npx ng serve      # http://localhost:4200
```

The backend must be running at **http://localhost:3000** (the `backend` branch of this
repo: `bun start`). The API origin is set in `src/app/link.service.ts`.

## Build

```bash
npx ng build
```

Output lands in **`dist/snip-frontend/browser`** — that exact path is load-bearing: the
bundle build script on `main` copies it into the release. Don't rename the project.

## What it does

- Paste a URL and shorten it; `http`/`https` is validated client-side before any request
- The new short link appears on success; API and network errors show inline
- A table lists every link: short code (linked to its `shortUrl`), original URL, hit count

## API it consumes

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/links` | `{ url }` | `{ code, url, shortUrl, hits, createdAt }` · `400 { error }` |
| `GET`  | `/api/links` | — | array of those objects |
