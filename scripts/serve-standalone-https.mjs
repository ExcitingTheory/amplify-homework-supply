#!/usr/bin/env node
/**
 * Runs the production (standalone) build locally over HTTPS, with the Yjs
 * collaboration WebSocket server over WSS.
 *
 *   https://localhost:3000  ->  TLS proxy  ->  .next/standalone/server.js (plain HTTP, 127.0.0.1:3010)
 *   wss://localhost:3001    ->  scripts/yjs-dev-server.ts (terminates TLS itself)
 *
 * `next start --experimental-https` does not work with `output: "standalone"`, so
 * the standalone server stays on plain HTTP and this script terminates TLS in front
 * of it. The proxy forwards WebSocket upgrades as well.
 *
 * Usage:
 *   node scripts/serve-standalone-https.mjs [--build] [--no-yjs] [--port 3000]
 *                                           [--app-port 3010] [--yjs-port 3001]
 *
 *   --build   run `next build` (+ serwist) first, with NEXT_PUBLIC_YJS_WS_URL pointed
 *             at the local Yjs server. Needed because NEXT_PUBLIC_* values are inlined
 *             at build time. Deliberately skips scripts/prune-standalone.mjs, which
 *             deletes build tooling from the root node_modules.
 *   --no-yjs  do not start the local Yjs server
 *   --no-quick-login  do not enable the seeded-user quick login card
 *
 * Quick login (/api/dev/quick-login) is enabled by default via
 * NEXT_PUBLIC_DEMO_QUICK_LOGIN=true, which is inlined at build time, so builds made
 * without --build (or with --no-quick-login) will not show the card. It also needs
 * TEST_USER_PASSWORD_SEED (read from .env.local) and a seeded backend.
 */
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, readFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

const { values: args } = parseArgs({
  options: {
    build: { type: "boolean", default: false },
    "no-yjs": { type: "boolean", default: false },
    "no-quick-login": { type: "boolean", default: false },
    port: { type: "string", default: "3000" },
    "app-port": { type: "string", default: "3010" },
    "yjs-port": { type: "string", default: "3001" },
  },
});

const httpsPort = Number(args.port);
const appPort = Number(args["app-port"]);
const yjsPort = Number(args["yjs-port"]);
const useYjs = !args["no-yjs"];
const useQuickLogin = !args["no-quick-login"];
const yjsUrl = `wss://localhost:${yjsPort}`;

dotenv.config({ path: ".env.local", quiet: true });

const certDirs = ["test/certificates", "certificates"];
const certDir = certDirs.find(
  (dir) =>
    existsSync(path.join(dir, "localhost.pem")) &&
    existsSync(path.join(dir, "localhost-key.pem")),
);
if (!certDir) {
  console.error(
    `[serve] No localhost.pem / localhost-key.pem in ${certDirs.join(" or ")}.\n` +
      "[serve] Run `npx next dev --experimental-https` once to generate them.",
  );
  process.exit(1);
}
const tls = {
  key: readFileSync(path.join(certDir, "localhost-key.pem")),
  cert: readFileSync(path.join(certDir, "localhost.pem")),
};

const bin = (name) => path.join(root, "node_modules", ".bin", name);

if (args.build) {
  const env = { ...process.env };
  if (useYjs) env.NEXT_PUBLIC_YJS_WS_URL = yjsUrl;
  if (useQuickLogin) env.NEXT_PUBLIC_DEMO_QUICK_LOGIN = "true";
  console.log(`[serve] Building (NEXT_PUBLIC_YJS_WS_URL=${env.NEXT_PUBLIC_YJS_WS_URL ?? "<default>"})...`);
  const steps = [[bin("next"), ["build"]]];
  if (existsSync(bin("serwist"))) {
    steps.push([bin("serwist"), ["build", "serwist.config.mjs"]]);
  }
  for (const [cmd, cmdArgs] of steps) {
    const result = spawnSync(cmd, cmdArgs, { stdio: "inherit", env });
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}

const standaloneDir = path.join(root, ".next/standalone");
const serverEntry = path.join(standaloneDir, "server.js");
if (!existsSync(serverEntry)) {
  console.error(
    "[serve] .next/standalone/server.js not found. Run with --build (or `npx next build`) first.",
  );
  process.exit(1);
}

// The standalone output omits static assets and public/; Next expects them next to server.js.
cpSync(path.join(root, ".next/static"), path.join(standaloneDir, ".next/static"), {
  recursive: true,
});
if (existsSync(path.join(root, "public"))) {
  cpSync(path.join(root, "public"), path.join(standaloneDir, "public"), {
    recursive: true,
  });
}

const children = [];
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill("SIGTERM");
  proxy.close();
  setTimeout(() => process.exit(code), 500).unref();
}

function run(label, cmd, cmdArgs, env) {
  const child = spawn(cmd, cmdArgs, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...env },
  });
  const prefix = (stream, out) =>
    stream.on("data", (chunk) => {
      for (const line of chunk.toString().split("\n")) {
        if (line.trim()) out.write(`[${label}] ${line}\n`);
      }
    });
  prefix(child.stdout, process.stdout);
  prefix(child.stderr, process.stderr);
  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    console.error(`[serve] ${label} exited (${signal ?? code}); shutting down.`);
    shutdown(code ?? 1);
  });
  children.push(child);
}

// Next builds absolute URLs (redirects, middleware rewrites) from its own listen
// address, `<x-forwarded-proto>://<HOSTNAME>:<app-port>`. A middleware rewrite whose
// origin differs from that address is fetched as an external proxy request, which
// re-runs middleware and loops (ERR_TOO_MANY_REDIRECTS). So the app listens on
// `localhost` (matching the origin it puts in request.url), `x-forwarded-proto` is
// omitted (https would make that fetch use TLS against the plain-HTTP port), and
// absolute redirect targets are mapped back to the public origin.
const internalOrigin = new RegExp(
  `^https?://(localhost|127\\.0\\.0\\.1):${appPort}(?=/|$)`,
);
const publicOrigin = `https://localhost:${httpsPort}`;

// TLS-terminating reverse proxy: HTTPS requests and WebSocket upgrades -> plain HTTP app.
const proxy = https.createServer(tls, (req, res) => {
  const upstream = http.request(
    {
      host: "localhost",
      port: appPort,
      method: req.method,
      path: req.url,
      headers: {
        ...req.headers,
        host: `localhost:${appPort}`,
        "x-forwarded-host": req.headers.host ?? `localhost:${httpsPort}`,
      },
    },
    (upstreamRes) => {
      const headers = { ...upstreamRes.headers };
      if (typeof headers.location === "string") {
        headers.location = headers.location.replace(internalOrigin, publicOrigin);
      }
      res.writeHead(upstreamRes.statusCode ?? 502, headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on("error", (error) => {
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain" });
    res.end(`Bad gateway: ${error.message}`);
  });
  req.pipe(upstream);
});

proxy.on("upgrade", (req, clientSocket, head) => {
  const upstream = net.connect(appPort, "localhost", () => {
    const headers = Object.entries({ ...req.headers, host: `localhost:${appPort}` })
      .map(([name, value]) => `${name}: ${value}`)
      .join("\r\n");
    upstream.write(
      `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n${headers}\r\n\r\n`,
    );
    if (head?.length) upstream.write(head);
    upstream.pipe(clientSocket);
    clientSocket.pipe(upstream);
  });
  const destroyBoth = () => {
    upstream.destroy();
    clientSocket.destroy();
  };
  upstream.on("error", destroyBoth);
  clientSocket.on("error", destroyBoth);
});

if (useQuickLogin && !process.env.TEST_USER_PASSWORD_SEED) {
  console.warn(
    "[serve] TEST_USER_PASSWORD_SEED is not set (.env.local); quick login will return an error.",
  );
}

run("next", process.execPath, [serverEntry], {
  ...(useQuickLogin ? { NEXT_PUBLIC_DEMO_QUICK_LOGIN: "true" } : {}),
  PORT: String(appPort),
  HOSTNAME: "localhost",
  NODE_ENV: "production",
});

if (useYjs) {
  run("yjs", bin("tsx"), ["scripts/yjs-dev-server.ts"], {
    YJS_PORT: String(yjsPort),
  });
}

proxy.listen(httpsPort, () => {
  console.log(`[serve] https://localhost:${httpsPort}  (app on http://localhost:${appPort})`);
  if (useYjs) console.log(`[serve] ${yjsUrl}  (Yjs collaboration)`);
  console.log(`[serve] Using certs from ${certDir}/`);
  if (useYjs) {
    console.log(
      `[serve] If collaboration doesn't connect, open https://localhost:${yjsPort} once and accept the certificate.`,
    );
  }
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
