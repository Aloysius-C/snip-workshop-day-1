# Snip

A tiny URL shortener — and a demonstration of a **branch-per-layer git submodule
architecture**. One repository, one backend, **two very different clients**.

The teaching point: a web app and a terminal app, built with completely different
stacks, consuming the *same* API contract — each living on its own branch, all
assembled into one working checkout by submodules.

```
snip-workshop-day-1 ──┬── backend    Bun API server (zero deps, in-memory Map)
                      ├── frontend   Angular 19 web app
                      ├── cli        zero-dep Node CLI
                      └── main       superproject: .gitmodules + this README
```

## The API contract

Everything speaks this and nothing else. Change it here, change it everywhere.

| Method | Path | Body | Response |
|--------|------|------|----------|
| `POST` | `/api/links` | `{ "url": "https://…" }` | `201` `{ code, url, shortUrl, hits, createdAt }` · `400` on invalid JSON / non-http(s) URL |
| `GET`  | `/api/links` | — | `200` array of all links |
| `GET`  | `/:code` | — | `302` to the original URL (+1 hit) · `404` if unknown |

Codes are 6 random base62 characters. Storage is an in-memory `Map` — **restarts clear
all links, by design.**

## Layout

Each layer lives on its own **orphan branch** — an independent history with files at the
branch *root* (`server.js`, not `backend/server.js`). On `main`, each folder is a
**gitlink**: a `160000` tree entry pinning that path to one exact commit.

| Path | Branch | Stack | What it is |
|------|--------|-------|------------|
| `backend/` | `backend` | Bun, zero deps | The API + redirect server |
| `frontend/` | `frontend` | Angular 19 | The web client |
| `cli/` | `cli` | Node, zero deps | The terminal client |

The folder structure you see here only exists on a `main` checkout — git creates it when
the submodules are mounted.

```bash
git ls-tree main          # see the 160000 gitlink entries
cat .gitmodules           # path -> URL + tracked branch
git submodule status      # which commit each folder is pinned to
```

Submodule URLs are **relative** (`../snip-workshop-day-1.git`), so they resolve against
whatever origin you cloned from — SSH locally, HTTPS in CI, no credentials baked in.

## Clone it

A plain clone leaves the submodule folders **empty** — this trips everyone up at least
once:

```bash
git clone --recurse-submodules git@github.com:Aloysius-C/snip-workshop-day-1.git
```

Already cloned the plain way? Fill them in after the fact:

```bash
git submodule update --init --recursive
```

## Run it

Three terminals from a `main` checkout:

```bash
cd backend  && bun start                 # :3000  — the API
cd frontend && npm install && npx ng serve   # :4200  — the web UI
cd cli      && node cli.js ls            # the same links, from the terminal
```

Shorten a URL in the browser, then run `node cli.js ls` — the CLI sees it. One backend,
two clients, one contract.

The CLI talks to `http://localhost:3000` by default; override with `SNIP_API`.

## The update workflow

The one habit submodules require. A submodule folder is a **full checkout of its
branch**, so you edit and commit *inside* it, then record the new pointer in the
superproject:

```bash
cd backend
# edit … then:
git add -A && git commit -m "..." && git push     # advances origin/backend

cd ..
git submodule update --remote backend             # move the pointer to the branch tip
git add backend
git commit -m "Bump backend submodule"            # commit the pointer, not the files
git push
```

Two separate records — the layer commit and the pointer commit. That's the extra step,
and in exchange `main` is always a **pinned, reproducible snapshot**: every commit here
names the exact commit of every layer.

> **Careful:** submodule checkouts are often in *detached HEAD*. If `git status` inside a
> submodule says so, `git checkout <branch>` before committing, or push explicitly with
> `git push origin HEAD:<branch>`.
