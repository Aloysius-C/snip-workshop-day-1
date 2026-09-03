#!/usr/bin/env node
'use strict';

// Snip CLI — zero dependencies, CommonJS, global fetch (Node 18+).

const { spawn } = require('child_process');

const API = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/+$/, '');

const USAGE = `snip — a tiny URL shortener CLI

Usage:
  snip add <url>     shorten a URL and print the short link
  snip ls            list every link as a code/hits/url table
  snip open <code>   resolve a short code and open it in your browser
  snip help          show this message

Environment:
  SNIP_API           backend base URL (default http://localhost:3000)
`;

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

/** Turn fetch's opaque network failures into an actionable message. */
async function request(path, options) {
  try {
    return await fetch(`${API}${path}`, options);
  } catch {
    throw new Error(`cannot reach the Snip backend at ${API} — is it running?`);
  }
}

async function readError(res, fallback) {
  try {
    const body = await res.json();
    if (body && body.error) return body.error;
  } catch {
    // Non-JSON error body; fall through to the generic message.
  }
  return fallback;
}

function isHttpUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}

async function add(url) {
  if (!url) fail('usage: snip add <url>');
  if (!isHttpUrl(url)) fail(`not a valid http(s) URL: ${url}`);

  const res = await request('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    fail(await readError(res, `backend returned HTTP ${res.status}`));
  }

  const link = await res.json();
  console.log(link.shortUrl);
}

async function ls() {
  const res = await request('/api/links');
  if (!res.ok) {
    fail(await readError(res, `backend returned HTTP ${res.status}`));
  }

  const links = await res.json();
  if (!Array.isArray(links) || links.length === 0) {
    console.log('No links yet.');
    return;
  }

  const rows = links.map((link) => [link.code, String(link.hits), link.url]);
  const headers = ['CODE', 'HITS', 'URL'];
  const widths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map((row) => row[i].length))
  );

  const line = (cells) =>
    cells
      .map((cell, i) => (i === cells.length - 1 ? cell : cell.padEnd(widths[i])))
      .join('  ');

  console.log(line(headers));
  for (const row of rows) console.log(line(row));
}

function openInBrowser(target) {
  const command =
    process.platform === 'win32'
      ? 'start'
      : process.platform === 'darwin'
        ? 'open'
        : 'xdg-open';

  // `start` is a cmd.exe builtin, so it needs a shell; the others don't.
  const child =
    process.platform === 'win32'
      ? spawn(command, ['""', target], { shell: true, detached: true, stdio: 'ignore' })
      : spawn(command, [target], { detached: true, stdio: 'ignore' });

  child.on('error', () => fail(`could not launch a browser for ${target}`));
  child.unref();
}

async function open(code) {
  if (!code) fail('usage: snip open <code>');

  const res = await request(`/${encodeURIComponent(code)}`, { redirect: 'manual' });

  const location = res.headers.get('location');
  if (!location) {
    if (res.status === 404) fail(`unknown code: ${code}`);
    fail(`expected a redirect for ${code}, got HTTP ${res.status}`);
  }

  console.log(`Opening ${location}`);
  openInBrowser(location);
}

async function main(argv) {
  const [command, ...rest] = argv;

  switch (command) {
    case 'add':
      return add(rest[0]);
    case 'ls':
      return ls();
    case 'open':
      return open(rest[0]);
    case undefined:
    case 'help':
    case '-h':
    case '--help':
      console.log(USAGE);
      return;
    default:
      fail(`unknown command: ${command}\n\n${USAGE}`);
  }
}

main(process.argv.slice(2)).catch((err) => fail(err.message));
