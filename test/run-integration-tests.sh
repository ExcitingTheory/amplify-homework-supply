#!/bin/bash

# Integration Test Runner Script
# 
# Runs comprehensive API integration tests against Amplify sandbox
# 
# Usage:
#   ./test/run-integration-tests.sh [options]
# 
# Options:
#   --skip-setup    Skip sandbox startup (assumes already running)
#   --coverage      Generate coverage report
#   --watch         Run tests in watch mode
#   --verbose       Enable verbose output

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
SKIP_SETUP=false
COVERAGE=false
WATCH=false
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-setup)
      SKIP_SETUP=true
      shift
      ;;
    --coverage)
      COVERAGE=true
      shift
      ;;
    --watch)
      WATCH=true
      shift
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Amplify Gen 2 Integration Test Suite               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Please install Node.js${NC}"
    exit 1
fi

if ! command -v aws &> /dev/null; then
    echo -e "${YELLOW}⚠️  AWS CLI not found. Some features may not work${NC}"
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Step 2: Start sandbox (if not skipped)
if [ "$SKIP_SETUP" = false ]; then
    echo -e "${YELLOW}🚀 Starting Amplify sandbox...${NC}"
    echo -e "${BLUE}   This will take a few minutes on first run${NC}"
    
    # Start sandbox in background
    npx ampx sandbox --once &
    SANDBOX_PID=$!
    
    echo -e "${GREEN}✅ Sandbox started (PID: $SANDBOX_PID)${NC}"
    echo -e "${BLUE}   Waiting for sandbox to be ready...${NC}"
    
    # Wait for sandbox to be ready (check for amplify_outputs.json)
    MAX_WAIT=300 # 5 minutes
    WAITED=0
    while [ ! -f "amplify_outputs.json" ] && [ $WAITED -lt $MAX_WAIT ]; do
        sleep 5
        WAITED=$((WAITED + 5))
        echo -e "${BLUE}   Waiting... ($WAITED/${MAX_WAIT}s)${NC}"
    done
    
    if [ ! -f "amplify_outputs.json" ]; then
        echo -e "${RED}❌ Sandbox failed to start within timeout${NC}"
        kill $SANDBOX_PID 2>/dev/null || true
        exit 1
    fi
    
    echo -e "${GREEN}✅ Sandbox ready${NC}"
    echo ""
fi

# Step 3: Check for test users
echo -e "${YELLOW}👥 Checking test user configuration...${NC}"
echo -e "${BLUE}   Test users should be created manually in Cognito:${NC}"
echo -e "${BLUE}   - admin@example.com (Admins group)${NC}"
echo -e "${BLUE}   - instructor1@example.com (Instructors group)${NC}"
echo -e "${BLUE}   - instructor2@example.com (Instructors group)${NC}"
echo -e "${BLUE}   - student1@example.com (Learners group)${NC}"
echo -e "${BLUE}   - student2@example.com (Learners group)${NC}"
echo ""

read -p "Have you created test users? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Please create test users before running tests${NC}"
    echo -e "${BLUE}   Run: amplify auth console${NC}"
    [ "$SKIP_SETUP" = false ] && kill $SANDBOX_PID 2>/dev/null || true
    exit 1
fi

# Step 4: Run seed script
echo -e "${YELLOW}🌱 Running seed script...${NC}"
npx ampx sandbox --seed || {
    echo -e "${RED}❌ Seed script failed${NC}"
    [ "$SKIP_SETUP" = false ] && kill $SANDBOX_PID 2>/dev/null || true
    exit 1
}
echo -e "${GREEN}✅ Seed data created${NC}"
echo ""

# Step 5: Run tests
echo -e "${YELLOW}🧪 Running integration tests...${NC}"

TEST_COMMAND="npx jest --config jest.config.ts"

if [ "$COVERAGE" = true ]; then
    TEST_COMMAND="$TEST_COMMAND --coverage"
fi

if [ "$WATCH" = true ]; then
    TEST_COMMAND="$TEST_COMMAND --watch"
fi

if [ "$VERBOSE" = true ]; then
    TEST_COMMAND="$TEST_COMMAND --verbose"
fi

$TEST_COMMAND || {
    echo -e "${RED}❌ Tests failed${NC}"
    [ "$SKIP_SETUP" = false ] && kill $SANDBOX_PID 2>/dev/null || true
    exit 1
}

echo ""
echo -e "${GREEN}✅ All tests passed!${NC}"

# Step 6: Cleanup
if [ "$SKIP_SETUP" = false ] && [ "$WATCH" = false ]; then
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    kill $SANDBOX_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup complete${NC}"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Integration Test Suite Complete ✨                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════╝${NC}"
