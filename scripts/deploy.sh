#!/bin/bash
# Deployment script for Ancient Protocol to Fly.io
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Ancient Protocol Deployment${NC}"
echo "=================================="

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ flyctl is not installed${NC}"
    echo "Install it with: curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Check if logged in
if ! flyctl auth whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Fly.io${NC}"
    echo "Running: flyctl auth login"
    flyctl auth login
fi

# Check if app exists, create if not
APP_NAME="ancient-protocol"
if ! flyctl apps list | grep -q "$APP_NAME"; then
    echo -e "${YELLOW}📦 Creating new Fly.io app: $APP_NAME${NC}"
    flyctl apps create "$APP_NAME" --machines
fi

# Deploy
echo -e "${GREEN}🔄 Deploying to Fly.io...${NC}"
flyctl deploy --ha=false

# Show status
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
flyctl status

# Get URL
APP_URL=$(flyctl info --json 2>/dev/null | jq -r '.Hostname // empty' || echo "")
if [ -n "$APP_URL" ]; then
    echo ""
    echo -e "${GREEN}🌐 App URL: https://$APP_URL${NC}"
fi
