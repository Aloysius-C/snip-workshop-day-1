// Snip — a tiny URL shortener. Single-file Bun server, zero dependencies.

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = process.env.PUBLIC_DIR || null;

function resolveBaseUrl() {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/+$/, "");
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return `http://localhost:${PORT}`;
}

const BASE_URL = resolveBaseUrl();

/** code -> { code, url, hits, createdAt } */
const links = new Map();

const ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function generateCode() {
  let code;
  do {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    code = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  } while (links.has(code));
  return code;
}

function isValidHttpUrl(value) {
  if (typeof value !== "string" || value.trim() === "") return false;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === "http:" || parsed.protocol === "https:";
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function serialize(link) {
  return {
    code: link.code,
    url: link.url,
    shortUrl: `${BASE_URL}/${link.code}`,
    hits: link.hits,
    createdAt: link.createdAt,
  };
}

async function serveStatic(pathname) {
  if (!PUBLIC_DIR) return null;

  const relative = pathname === "/" ? "/index.html" : pathname;
  // Reject traversal attempts before touching the filesystem.
  if (relative.includes("..")) return null;

  const filePath = `${PUBLIC_DIR.replace(/\/+$/, "")}${relative}`;
  const file = Bun.file(filePath);
  if (!(await file.exists())) return null;

  return new Response(file, { headers: CORS_HEADERS });
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname } = url;

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (pathname === "/api/links") {
      if (req.method === "POST") {
        let body;
        try {
          body = await req.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const target = body?.url;
        if (!isValidHttpUrl(target)) {
          return json({ error: "Provide a valid http(s) URL" }, 400);
        }

        const link = {
          code: generateCode(),
          url: target,
          hits: 0,
          createdAt: new Date().toISOString(),
        };
        links.set(link.code, link);
        return json(serialize(link), 201);
      }

      if (req.method === "GET") {
        return json([...links.values()].map(serialize));
      }

      return json({ error: "Method not allowed" }, 405);
    }

    if (req.method === "GET" || req.method === "HEAD") {
      // An existing static file wins over a same-named short code.
      const staticResponse = await serveStatic(pathname);
      if (staticResponse) return staticResponse;

      const code = pathname.slice(1);
      const link = code && !code.includes("/") ? links.get(code) : undefined;
      if (link) {
        link.hits += 1;
        return new Response(null, {
          status: 302,
          headers: { Location: link.url, ...CORS_HEADERS },
        });
      }
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(`Snip backend (v2) listening on http://localhost:${server.port}`);
console.log(`Short links are issued as ${BASE_URL}/<code>`);
if (PUBLIC_DIR) console.log(`Serving static files from ${PUBLIC_DIR}`);
