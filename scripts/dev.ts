#!/usr/bin/env bun
/**
 * Development script that orchestrates:
 * 1. Starting Anvil (local Ethereum node)
 * 2. Deploying contracts
 * 3. Starting the Bun dev server
 */

import { spawn, type Subprocess } from "bun";

const ANVIL_RPC_URL = "http://localhost:8545";
const CONTRACTS_DIR = "./contracts";
const MAX_ANVIL_WAIT_MS = 10_000;
const ANVIL_POLL_INTERVAL_MS = 100;

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  red: "\x1b[31m",
};

function log(prefix: string, color: string, message: string) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function logAnvil(message: string) {
  log("anvil", colors.magenta, message);
}

function logDeploy(message: string) {
  log("deploy", colors.cyan, message);
}

function logDev(message: string) {
  log("dev", colors.green, message);
}

function logError(message: string) {
  log("error", colors.red, message);
}

/**
 * Check if anvil is already running
 */
async function isAnvilRunning(): Promise<boolean> {
  try {
    const response = await fetch(ANVIL_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_chainId",
        params: [],
        id: 1,
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Wait for anvil to be ready
 */
async function waitForAnvil(): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_ANVIL_WAIT_MS) {
    if (await isAnvilRunning()) {
      return true;
    }
    await Bun.sleep(ANVIL_POLL_INTERVAL_MS);
  }

  return false;
}

/**
 * Start anvil process
 */
function startAnvil(): Subprocess {
  logAnvil("Starting Anvil local chain...");

  const anvil = spawn(["anvil"], {
    stdout: "pipe",
    stderr: "pipe",
  });

  // Stream anvil output with prefix
  (async () => {
    const reader = anvil.stdout.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n").filter(Boolean);
      for (const line of lines) {
        logAnvil(line);
      }
    }
  })();

  (async () => {
    const reader = anvil.stderr.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n").filter(Boolean);
      for (const line of lines) {
        logAnvil(`${colors.dim}${line}${colors.reset}`);
      }
    }
  })();

  return anvil;
}

/**
 * Deploy contracts using forge
 */
async function deployContracts(): Promise<boolean> {
  logDeploy("Deploying contracts...");

  const forge = spawn(
    [
      "forge",
      "script",
      "script/Deploy.s.sol",
      "--rpc-url",
      ANVIL_RPC_URL,
      "--broadcast",
      "--slow",
      "-vvv",
    ],
    {
      cwd: CONTRACTS_DIR,
      stdout: "pipe",
      stderr: "pipe",
    }
  );

  // Stream forge output
  (async () => {
    const reader = forge.stdout.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n").filter(Boolean);
      for (const line of lines) {
        logDeploy(line);
      }
    }
  })();

  (async () => {
    const reader = forge.stderr.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n").filter(Boolean);
      for (const line of lines) {
        logDeploy(`${colors.dim}${line}${colors.reset}`);
      }
    }
  })();

  const exitCode = await forge.exited;
  return exitCode === 0;
}

/**
 * Start bun dev server
 */
function startDevServer(): Subprocess {
  logDev("Starting Bun dev server...");

  const dev = spawn(["bun", "--hot", "src/index.ts"], {
    stdout: "pipe",
    stderr: "pipe",
  });

  // Stream dev server output
  (async () => {
    const reader = dev.stdout.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n").filter(Boolean);
      for (const line of lines) {
        logDev(line);
      }
    }
  })();

  (async () => {
    const reader = dev.stderr.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split("\n").filter(Boolean);
      for (const line of lines) {
        logDev(`${colors.dim}${line}${colors.reset}`);
      }
    }
  })();

  return dev;
}

/**
 * Main function
 */
async function main() {
  console.log(`\n${colors.bright}🏛️  Ancient Protocol Development Environment${colors.reset}\n`);

  const processes: Subprocess[] = [];
  let anvilProcess: Subprocess | null = null;

  // Handle cleanup on exit
  const cleanup = () => {
    console.log(`\n${colors.yellow}Shutting down...${colors.reset}`);
    for (const proc of processes) {
      proc.kill();
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  // Check if anvil is already running
  const anvilAlreadyRunning = await isAnvilRunning();

  if (anvilAlreadyRunning) {
    logAnvil("Anvil is already running on port 8545");
  } else {
    // Start anvil
    anvilProcess = startAnvil();
    processes.push(anvilProcess);

    // Wait for anvil to be ready
    logAnvil("Waiting for Anvil to be ready...");
    const ready = await waitForAnvil();

    if (!ready) {
      logError("Anvil failed to start within timeout");
      cleanup();
      return;
    }

    logAnvil(`${colors.green}Anvil is ready!${colors.reset}`);
  }

  // Deploy contracts
  const deploySuccess = await deployContracts();

  if (!deploySuccess) {
    logError("Contract deployment failed");
    cleanup();
    return;
  }

  logDeploy(`${colors.green}Contracts deployed successfully!${colors.reset}`);

  // Start dev server
  const devServer = startDevServer();
  processes.push(devServer);

  console.log(`\n${colors.bright}${colors.green}✓ Development environment ready!${colors.reset}`);
  console.log(`${colors.dim}  Anvil RPC: ${ANVIL_RPC_URL}${colors.reset}`);
  console.log(`${colors.dim}  Press Ctrl+C to stop${colors.reset}\n`);

  // Wait for dev server to exit
  await devServer.exited;
}

main().catch((error) => {
  logError(error.message);
  process.exit(1);
});
