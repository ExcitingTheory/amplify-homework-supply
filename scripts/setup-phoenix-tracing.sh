#!/bin/bash
# Setup Phoenix Tracing for Lambda Functions
# Installs required packages and creates tracer configuration

set -e

echo "🔧 Setting up Phoenix/Arize tracing for Lambda functions..."

# Color output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create shared directory if it doesn't exist
echo -e "${GREEN}✓${NC} Creating shared functions directory..."
mkdir -p amplify/functions/shared

# Install packages for AI SDK streaming functions
echo -e "${GREEN}✓${NC} Installing Phoenix packages for chatStream..."
cd amplify/functions/chatStream
npm install --save \
  @arizeai/openinference-instrumentation-vercel \
  @opentelemetry/api \
  @opentelemetry/sdk-trace-node \
  @opentelemetry/sdk-trace-base \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/resources \
  @opentelemetry/semantic-conventions \
  @opentelemetry/instrumentation

cd ../../..

echo -e "${GREEN}✓${NC} Installing Phoenix packages for contentCompletionStream..."
cd amplify/functions/contentCompletionStream
npm install --save \
  @arizeai/openinference-instrumentation-vercel \
  @opentelemetry/api \
  @opentelemetry/sdk-trace-node \
  @opentelemetry/sdk-trace-base \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/resources \
  @opentelemetry/semantic-conventions \
  @opentelemetry/instrumentation

cd ../../..

# Install packages for OpenAI SDK functions
echo -e "${GREEN}✓${NC} Installing Phoenix packages for ai function..."
cd amplify/functions/ai
npm install --save \
  @arizeai/openinference-instrumentation-openai \
  @opentelemetry/api \
  @opentelemetry/sdk-trace-node \
  @opentelemetry/sdk-trace-base \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/resources \
  @opentelemetry/semantic-conventions \
  @opentelemetry/instrumentation

cd ../../..

# Check if other functions exist
if [ -d "amplify/functions/documentAnalysis" ]; then
  echo -e "${GREEN}✓${NC} Installing Phoenix packages for documentAnalysis..."
  cd amplify/functions/documentAnalysis
  npm install --save \
    @arizeai/openinference-instrumentation-openai \
    @opentelemetry/api \
    @opentelemetry/sdk-trace-node \
    @opentelemetry/sdk-trace-base \
    @opentelemetry/exporter-trace-otlp-http \
    @opentelemetry/resources \
    @opentelemetry/semantic-conventions \
    @opentelemetry/instrumentation
  cd ../../..
fi

if [ -d "amplify/functions/embeddings" ]; then
  echo -e "${GREEN}✓${NC} Installing Phoenix packages for embeddings..."
  cd amplify/functions/embeddings
  npm install --save \
    @arizeai/openinference-instrumentation-openai \
    @opentelemetry/api \
    @opentelemetry/sdk-trace-node \
    @opentelemetry/sdk-trace-base \
    @opentelemetry/exporter-trace-otlp-http \
    @opentelemetry/resources \
    @opentelemetry/semantic-conventions \
    @opentelemetry/instrumentation
  cd ../../..
fi

# Create shared package.json if it doesn't exist
if [ ! -f "amplify/functions/shared/package.json" ]; then
  echo -e "${GREEN}✓${NC} Creating shared package.json..."
  cat > amplify/functions/shared/package.json <<EOF
{
  "name": "@amplify-homework-supply/shared",
  "version": "1.0.0",
  "description": "Shared utilities for Lambda functions",
  "main": "index.js",
  "dependencies": {
    "@arizeai/openinference-instrumentation-vercel": "^0.2.0",
    "@arizeai/openinference-instrumentation-openai": "^0.2.0",
    "@opentelemetry/api": "^1.9.0",
    "@opentelemetry/sdk-trace-node": "^1.28.0",
    "@opentelemetry/sdk-trace-base": "^1.28.0",
    "@opentelemetry/exporter-trace-otlp-http": "^0.54.0",
    "@opentelemetry/resources": "^1.28.0",
    "@opentelemetry/semantic-conventions": "^1.28.0",
    "@opentelemetry/instrumentation": "^0.54.0"
  }
}
EOF
fi

# Create phoenix-tracer.ts (the content is in PHOENIX_TRACING_GUIDE.md)
echo -e "${YELLOW}⚠${NC}  Please copy the phoenix-tracer.ts code from docs/PHOENIX_TRACING_GUIDE.md"
echo "    to amplify/functions/shared/phoenix-tracer.ts"

# Create .env.local template if it doesn't exist
if [ ! -f ".env.local" ]; then
  echo -e "${GREEN}✓${NC} Creating .env.local template..."
  cat > .env.local <<EOF
# Phoenix Tracing Configuration
# Uncomment to enable tracing

# Local Phoenix instance
PHOENIX_ENDPOINT=http://localhost:6006
ENABLE_TRACING=true

# Or use cloud Phoenix
# PHOENIX_ENDPOINT=https://app.phoenix.arize.com
# PHOENIX_API_KEY=your-api-key-here

# Existing OpenAI config
# OPENAI_API_KEY=sk-...
EOF
  echo -e "${YELLOW}⚠${NC}  Created .env.local - please configure your Phoenix endpoint"
fi

echo ""
echo -e "${GREEN}✓✓✓ Phoenix package installation complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Copy phoenix-tracer.ts from docs/PHOENIX_TRACING_GUIDE.md to amplify/functions/shared/"
echo "2. Update handler.ts files to import and initialize tracing"
echo "3. Configure environment variables in .env.local"
echo "4. Start Phoenix: docker run -p 6006:6006 arizephoenix/phoenix:latest"
echo "5. Deploy and test!"
echo ""
echo "See docs/PHOENIX_TRACING_GUIDE.md for detailed instructions."
