#!/usr/bin/env bash
# Seeds a deployed Amplify branch backend (default: app amplify-homework-supply,
# branch main, which is the demo deployment) instead of a personal sandbox.
#
# The seed script (amplify/seed/seed.ts) targets whatever backend the repo-root
# amplify_outputs.json describes, and it WIPES every DynamoDB table of that API
# before recreating data. This wrapper therefore:
#   1. backs up amplify_outputs.json,
#   2. generates outputs for the remote branch,
#   3. prints the target,
#   4. runs the seed,
#   5. always restores your original amplify_outputs.json.
#
# Usage:
#   npm run seed:remote
#
# The npm script loads .env.test (like sandbox:seed), so TEST_USER_PASSWORD_SEED
# comes from there and must match the value set on the Amplify branch.
#
# Overrides (environment): AMPLIFY_APP_ID, AMPLIFY_BRANCH, AWS_PROFILE, AWS_REGION,
# plus any seed option such as SEED_THOTH_MODE=live|snapshot|off.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

APP_ID="${AMPLIFY_APP_ID:-djbpx2ijr97fs}"
BRANCH="${AMPLIFY_BRANCH:-main}"

if [[ -z "${TEST_USER_PASSWORD_SEED:-}" ]]; then
  echo "TEST_USER_PASSWORD_SEED is required and must match the value set on the '$BRANCH' branch." >&2
  echo "Add it to .env.test and run via 'npm run seed:remote', or export it before running this script." >&2
  exit 1
fi

OUTPUTS="amplify_outputs.json"
BACKUP="$(mktemp "${TMPDIR:-/tmp}/amplify_outputs.backup.XXXXXX")"
HAD_OUTPUTS=0
if [[ -f "$OUTPUTS" ]]; then
  cp "$OUTPUTS" "$BACKUP"
  HAD_OUTPUTS=1
fi

restore_outputs() {
  if [[ "$HAD_OUTPUTS" -eq 1 ]]; then
    cp "$BACKUP" "$OUTPUTS"
    echo "Restored original $OUTPUTS"
  else
    rm -f "$OUTPUTS"
  fi
  rm -f "$BACKUP"
}
trap restore_outputs EXIT

echo "Generating outputs for app $APP_ID, branch $BRANCH..."
npx ampx generate outputs --app-id "$APP_ID" --branch "$BRANCH" ${AWS_PROFILE:+--profile "$AWS_PROFILE"}

read -r USER_POOL_ID API_URL < <(node -e '
  const o = JSON.parse(require("fs").readFileSync("amplify_outputs.json", "utf8"));
  console.log(o.auth?.user_pool_id ?? "?", o.data?.url ?? "?");
')

echo
echo "Seed target:"
echo "  app id:       $APP_ID"
echo "  branch:       $BRANCH"
echo "  user pool:    $USER_POOL_ID"
echo "  GraphQL API:  $API_URL"
echo
echo "This deletes ALL data in that backend's DynamoDB tables before reseeding."
echo

npx ampx sandbox seed
