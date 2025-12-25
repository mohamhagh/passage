#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Passage Development Environment...${NC}"
echo ""

# Check if dependencies are installed
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed. Running setup...${NC}"
    npm run setup
    echo ""
fi

# Check PostgreSQL (non-blocking, just warn)
echo "Checking PostgreSQL..."
if command -v pg_isready &> /dev/null; then
    if pg_isready -h localhost &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL is running${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL is not running${NC}"
        echo "   Start it with: brew services start postgresql (macOS) or your preferred method"
    fi
else
    echo -e "${YELLOW}⚠️  pg_isready not found. Skipping PostgreSQL check${NC}"
fi

echo ""
echo -e "${GREEN}Starting backend and frontend...${NC}"
echo ""

# Run using npm script which uses concurrently
npm run dev

