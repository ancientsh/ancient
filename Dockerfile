# Dockerfile for Ancient Protocol with Anvil support
# Multi-stage build for optimal image size

# ============================================
# Stage 1: Build
# ============================================
FROM oven/bun:1 AS builder

WORKDIR /app

# Install foundry for contract compilation
RUN apt-get update && apt-get install -y curl git && \
    curl -L https://foundry.paradigm.xyz | bash && \
    /root/.foundry/bin/foundryup && \
    rm -rf /var/lib/apt/lists/*

ENV PATH="/root/.foundry/bin:$PATH"

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build contracts (compile only, we deploy at runtime)
WORKDIR /app/contracts
RUN forge build

# Build frontend
WORKDIR /app
RUN bun run build.ts

# ============================================
# Stage 2: Runtime
# ============================================
FROM oven/bun:1-slim AS runtime

WORKDIR /app

# Install foundry in runtime (needed for Anvil)
# Keep curl installed - needed by entrypoint script and health check
RUN apt-get update && apt-get install -y curl git && \
    curl -L https://foundry.paradigm.xyz | bash && \
    /root/.foundry/bin/foundryup && \
    rm -rf /var/lib/apt/lists/*

ENV PATH="/root/.foundry/bin:$PATH"

# Copy built artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public
COPY --from=builder /app/contracts ./contracts
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/tsconfig.json ./

# Copy startup script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Environment
ENV NODE_ENV=production
ENV ANVIL_URL=http://127.0.0.1:8545
ENV PORT=8080

# Expose ports
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/rpc/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
