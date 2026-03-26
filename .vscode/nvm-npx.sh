#!/bin/bash
# Wrapper script to resolve npx via nvm's default node version.
# Used by MCP server configs that need an absolute command path.

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

exec npx "$@"
