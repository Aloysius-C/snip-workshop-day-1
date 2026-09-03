# Snip — CLI

The terminal client for **Snip**, a tiny URL shortener. One file (`cli.js`), **zero
dependencies**, CommonJS, using Node's global `fetch` (Node 18+).

Same backend, same contract as the web app — just a different client.

## Use

```bash
node cli.js add https://example.com/a/very/long/link   # prints the short URL
node cli.js ls                                         # table of every link
node cli.js open <code>                                # opens it in your browser
node cli.js help                                       # usage
```

Or via the wrappers — `./snip` (macOS/Linux), `snip.cmd` / `snip.ps1` (Windows):

```bash
./snip ls
```

Installing it globally (`npm link`) puts `snip` on your PATH via the `bin` entry.

## Commands

| Command | Does |
|---------|------|
| `snip add <url>` | `POST /api/links`, prints the returned `shortUrl` |
| `snip ls` | `GET /api/links`, prints an aligned code/hits/url table (`No links yet.` when empty) |
| `snip open <code>` | `GET /:code` with `redirect: "manual"` — asks for the target without following it, then opens it with `start`/`open`/`xdg-open` |
| `snip help` | usage text (also shown with no arguments) |

Bad input, unknown codes, and an unreachable backend all print to **stderr** and exit
with code **1**.

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `SNIP_API` | `http://localhost:3000` | Backend base URL |

```bash
SNIP_API=https://snip.example.com node cli.js ls
```

## Note

`package.json` deliberately has **no `"type": "module"`** — `cli.js` is CommonJS and a
later build step runs this exact file from a folder that must stay CommonJS.
