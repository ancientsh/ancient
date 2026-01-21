#!/bin/bash
set -e

echo "🔨 Starting Anvil..."

# Start Anvil in background with block time for realistic behavior
anvil \
    --host 0.0.0.0 \
    --port 8545 \
    --chain-id 31337 \
    --block-time 2 \
    --accounts 10 \
    --balance 10000 \
    --gas-limit 30000000 \
    --code-size-limit 100000 \
    &

ANVIL_PID=$!

# Wait for Anvil to be ready
echo "⏳ Waiting for Anvil to start..."
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s -X POST http://127.0.0.1:8545 \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
        > /dev/null 2>&1; then
        echo "✅ Anvil is ready!"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    sleep 1
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "❌ Anvil failed to start"
    exit 1
fi

# Deploy contracts
echo "📜 Deploying contracts..."
cd /app/contracts

forge script script/Deploy.s.sol \
    --rpc-url http://127.0.0.1:8545 \
    --broadcast \
    --chain-id 31337 \
    -vvv

echo "✅ Contracts deployed!"

# Start the application
cd /app
echo "🚀 Starting application on port ${PORT:-8080}..."

exec bun run src/index.ts
