import { readFileSync } from "fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";
import withBundleAnalyzerInit from "@next/bundle-analyzer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withBundleAnalyzer = withBundleAnalyzerInit({
  enabled: process.env.ANALYZE === "true",
});

// Derive WebSocket URL from amplify_outputs.json at build time
function getWebSocketUrl() {
  // Explicit env var takes priority (local dev override)
  if (process.env.NEXT_PUBLIC_YJS_WS_URL) {
    return process.env.NEXT_PUBLIC_YJS_WS_URL;
  }
  try {
    const outputs = JSON.parse(readFileSync("./amplify_outputs.json", "utf-8"));
    const wsConfig = outputs?.custom?.WEBSOCKET_API;
    if (wsConfig?.apiId && wsConfig?.stageName && wsConfig?.region) {
      return `wss://${wsConfig.apiId}.execute-api.${wsConfig.region}.amazonaws.com/${wsConfig.stageName}`;
    }
  } catch {
    // amplify_outputs.json not available (CI, first build, etc.)
  }
  // Use wss:// for local dev since Next.js runs with --experimental-https
  return "wss://localhost:3001";
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mui/x-data-grid"],

  // Disable dev indicators to suppress Turbopack isrManifest HMR warnings
  devIndicators: false,

  // Security headers applied to all routes.
  // CSP is set per-request in middleware.ts (requires a per-request nonce).
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), microphone=(self)",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_YJS_WS_URL: getWebSocketUrl(),
    NEXT_PUBLIC_ENABLE_WORKBOOK_COLLABORATION:
      process.env.NEXT_PUBLIC_ENABLE_WORKBOOK_COLLABORATION || "true",
    // CloudFront CDN domain — populated from amplify_outputs.json during build.
    // Leave empty for local dev; getCachedUrl and cdnImageLoader fall back gracefully.
    NEXT_PUBLIC_CDN_DOMAIN: process.env.NEXT_PUBLIC_CDN_DOMAIN || "",
  },

  // Reduce build output size for Amplify deployment
  productionBrowserSourceMaps: false,

  // Use standalone output for smaller deployments
  output: "standalone",

  // Skip TypeScript type checking during build to avoid OOM
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint during build to avoid OOM; `npm run lint` runs it separately
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimize images via CloudFront CDN + pre-generated WebP variants.
  // Uses a custom loader (src/utils/cdnImageLoader.js) that maps next/image
  // width requests to the nearest pre-generated variant (small/medium/large.webp).
  // Falls back gracefully when NEXT_PUBLIC_CDN_DOMAIN is not set (local dev).
  images: {
    loader: "custom",
    loaderFile: "./src/utils/cdnImageLoader.js",
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "onnxruntime-node": path.resolve(
          __dirname,
          "src/stubs/onnxruntime-node.js",
        ),
      };
    }
    return config;
  },

  // Dev-only alias for the native ONNX addon.
  turbopack: {
    resolveAlias: {
      "onnxruntime-node": "./src/stubs/onnxruntime-node.js",
    },
  },

  // Optimize barrel imports to tree-shake unused exports from large packages
  experimental: {
    reactCompiler: true,
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "react-icons",
      "@dicebear/core",
    ],
  },
};

export default withBundleAnalyzer(withNextIntl(nextConfig));
