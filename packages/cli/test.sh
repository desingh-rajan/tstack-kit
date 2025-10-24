#!/bin/bash

# TonyStack CLI Test Script
# Run this after installing Deno to test the CLI

set -e

echo "🧪 Testing TonyStack CLI"
echo "========================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Navigate to CLI directory
cd "$(dirname "$0")"

# Test 1: Help command
echo -e "${BLUE}Test 1: Help command${NC}"
deno run --allow-read --allow-write --allow-env mod.ts --help
echo ""

# Test 2: Version command
echo -e "${BLUE}Test 2: Version command${NC}"
deno run --allow-read --allow-write --allow-env mod.ts --version
echo ""

# Test 3: Scaffold products entity in starter package
echo -e "${BLUE}Test 3: Scaffold products entity${NC}"
deno run --allow-read --allow-write --allow-env mod.ts scaffold products --dir ../starter
echo ""

# Test 4: Scaffold blog-posts entity (test kebab-case)
echo -e "${BLUE}Test 4: Scaffold blog-posts entity${NC}"
deno run --allow-read --allow-write --allow-env mod.ts scaffold blog-posts --dir ../starter
echo ""

# Verify files were created
echo -e "${BLUE}Verification: Check generated files${NC}"
if [ -d "../starter/src/entities/products" ]; then
    echo -e "${GREEN}✓ products entity created${NC}"
    ls -la ../starter/src/entities/products/
else
    echo "✗ products entity NOT found"
fi
echo ""

if [ -d "../starter/src/entities/blogPosts" ]; then
    echo -e "${GREEN}✓ blogPosts entity created${NC}"
    ls -la ../starter/src/entities/blogPosts/
else
    echo "✗ blogPosts entity NOT found"
fi
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Install the CLI globally: deno task install"
echo "2. Use it anywhere: tony scaffold orders"
