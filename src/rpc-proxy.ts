// RPC Proxy Server for Anvil
// Proxies JSON-RPC requests to the local Anvil instance

const ANVIL_URL = process.env.ANVIL_URL || "http://127.0.0.1:8545";
const PROXY_PORT = parseInt(process.env.RPC_PROXY_PORT || "8546", 10);

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    const responseText = await response.text();

    return new Response(responseText, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("RPC Proxy error:", error);
    return new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal error: Failed to connect to Anvil",
        },
        id: null,
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// Health check endpoint
function handleHealthCheck(): Response {
  return new Response(JSON.stringify({ status: "ok", anvil: ANVIL_URL }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const server = Bun.serve({
  port: PROXY_PORT,
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return handleHealthCheck();
    }

    return handleRpcRequest(request);
  },
});

console.log(`🔗 RPC Proxy running at http://localhost:${server.port}`);
console.log(`   Forwarding to Anvil at ${ANVIL_URL}`);
