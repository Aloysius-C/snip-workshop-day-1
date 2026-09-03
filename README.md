# Snip — backend

A tiny URL shortener API. One file (`server.js`), **zero npm dependencies**, running on
[Bun](https://bun.sh). Links live in an in-memory `Map`, so **restarting clears them** —
by design.

## Run

```bash
bun start        # http://localhost:3000
```

## API

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/links` | `{ "url": "https://…" }` | `201 { code, url, shortUrl, hits, createdAt }` · `400` on invalid JSON or non-http(s) URL |
| `GET`  | `/api/links` | — | `200` array of all links (same shape) |
| `GET`  | `/:code` | — | `302` to the original URL, incrementing `hits` · `404` if unknown |

Codes are 6 random base62 characters, `hits` starts at `0`, and `createdAt` is an ISO
timestamp. CORS is fully open (plus `OPTIONS` preflight) so a browser app on another
origin can call it.

```bash
curl -X POST localhost:3000/api/links -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}'
curl localhost:3000/api/links
curl -i localhost:3000/<code>
```

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | Port to listen on |
| `BASE_URL` | `https://$RAILWAY_PUBLIC_DOMAIN` when set, else `http://localhost:$PORT` | Origin used in `shortUrl` values |
| `PUBLIC_DIR` | unset | When set, also serve static files from that folder (`/` → `index.html`); an existing file wins over a same-named short code |

`PUBLIC_DIR` is what turns this same server into the whole-app bundle: API, redirects,
and the built web UI from a single process.
