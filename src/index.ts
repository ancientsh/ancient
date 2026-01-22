import { serve, file } from "bun";
import { join } from "path";

const isProduction = process.env.NODE_ENV === "production";
const publicDir = join(import.meta.dir, "..", "public");
const distDir = join(import.meta.dir, "..", "dist");

// In production, serve pre-built files from dist; in dev, use Bun's HTML bundling
const index = isProduction ? file(join(distDir, "index.html")) : (await import("./index.html")).default;

// RPC Proxy configuration
const ANVIL_URL = process.env.ANVIL_URL || "http://127.0.0.1:8545";

// CORS headers for RPC requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// RPC Proxy handler
async function handleRpcRequest(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow POST for JSON-RPC
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.text();

    // Forward request to Anvil
    const response = await fetch(ANVIL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const responseText = await response.text();

    return new Response(responseText, {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("RPC Proxy error:", error);
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal error: Failed to connect to Anvil" },
        id: null,
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

const server = serve({
  routes: {
    // RPC Proxy endpoint - forwards JSON-RPC requests to Anvil
    "/rpc": {
      async POST(req) {
        return handleRpcRequest(req);
      },
      async OPTIONS(req) {
        return new Response(null, { status: 204, headers: corsHeaders });
      },
    },

    // RPC health check
    "/rpc/health": async () => {
      try {
        const response = await fetch(ANVIL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", method: "eth_chainId", params: [], id: 1 }),
        });
        const data = await response.json();
        return Response.json({ status: "ok", chainId: data.result, anvil: ANVIL_URL });
      } catch {
        return Response.json({ status: "error", anvil: ANVIL_URL }, { status: 502 });
      }
    },

    // Serve static assets from public folder
    "/public/*": async (req) => {
      const url = new URL(req.url);
      const filePath = join(publicDir, url.pathname.replace("/public/", ""));
      const asset = file(filePath);
      if (await asset.exists()) {
        return new Response(asset);
      }
      return new Response("Not found", { status: 404 });
    },

    // Serve built assets from dist folder (JS chunks, sourcemaps, etc.)
    "/dist/*": async (req) => {
      const url = new URL(req.url);
      const filePath = join(distDir, url.pathname.replace("/dist/", ""));
      const asset = file(filePath);
      if (await asset.exists()) {
        return new Response(asset);
      }
      return new Response("Not found", { status: 404 });
    },

    "/api/hello": {
      async GET(req) {
        return Response.json({
          message: "Hello, world!",
          method: "GET",
        });
      },
      async PUT(req) {
        return Response.json({
          message: "Hello, world!",
          method: "PUT",
        });
      },
    },

    "/api/hello/:name": async req => {
      const name = req.params.name;
      return Response.json({
        message: `Hello, ${name}!`,
      });
    },

    // Serve index.html for all unmatched routes (SPA routing)
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
console.log(`🔗 RPC Proxy forwarding to ${ANVIL_URL}`);
