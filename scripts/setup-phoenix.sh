#!/bin/bash

##
# Phoenix Instrumentation Setup Script
# Installs required OpenTelemetry packages for all Lambda functions
##

set -e  # Exit on error

echo "🔍 Setting up Arize Phoenix instrumentation for Lambda functions..."

# Phoenix packages to install
PACKAGES=(
  "@arizeai/openinference-instrumentation-openai"
  "@opentelemetry/api"  
  "@opentelemetry/sdk-trace-node"
  "@opentelemetry/exporter-trace-otlp-http"
  "@opentelemetry/instrumentation"
  "@opentelemetry/resources"
  "@opentelemetry/semantic-conventions"
  "@opentelemetry/sdk-trace-base"
)

# Lambda functions to instrument
FUNCTIONS=(
  "ai"
  "openai"
  "documentAnalysis"
  "embeddings"
  "contentCompletionStream"
  "suggestBlocksStream"
)

echo ""
echo "📦 Packages to install:"
for pkg in "${PACKAGES[@]}"; do
  echo "  - $pkg"
done

echo ""
echo "🔧 Functions to update:"
for func in "${FUNCTIONS[@]}"; do
  echo "  - $func"
done
echo ""

# Install packages for each function
for func in "${FUNCTIONS[@]}"; do
  FUNC_PATH="amplify/functions/$func"
  
  if [ ! -d "$FUNC_PATH" ]; then
    echo "⚠️  Skipping $func (directory not found)"
    continue
  fi
  
  echo "📍 Installing packages in $func..."
  
  cd "$FUNC_PATH"
  
  # Install all packages
  npm install --save "${PACKAGES[@]}"
  
  if [ $? -eq 0 ]; then
    echo "✅ $func: Packages installed successfully"
  else
    echo "❌ $func: Failed to install packages"
    cd - > /dev/null
    exit 1
  fi
  
  cd - > /dev/null
  echo ""
done

echo "✨ All packages installed successfully!"
echo ""
echo "📝 Next steps:"
echo "  1. Set Phoenix endpoint secret:"
echo "     npx ampx sandbox secret set PHOENIX_COLLECTOR_ENDPOINT"
echo ""
echo "  2. Start Phoenix server (if running locally):"
echo "     docker run -p 6006:6006 -p 4317:4317 arizephoenix/phoenix:latest"
echo ""
echo "  3. Deploy Lambda functions:"
echo "     npx ampx sandbox"
echo ""
echo "  4. Access Phoenix UI:"
echo "     http://localhost:6006"
echo ""
echo "📚 See docs/PHOENIX_INSTRUMENTATION.md for complete guide"
