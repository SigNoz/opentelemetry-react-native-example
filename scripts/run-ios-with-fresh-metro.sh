#!/usr/bin/env bash
set -euo pipefail

PORT="${RCT_METRO_PORT:-8081}"
METRO_LOG="${TMPDIR:-/tmp}/react-native-metro.log"

# Stop Metro for this project so env-inlined values are rebuilt.
pkill -f "$PWD/node_modules/react-native/cli.js start" >/dev/null 2>&1 || true

if command -v watchman >/dev/null 2>&1; then
  watchman watch-del-all >/dev/null 2>&1 || true
fi

# Start a fresh Metro with cache reset.
nohup react-native start --reset-cache --port "$PORT" >"$METRO_LOG" 2>&1 &

for _ in $(seq 1 30); do
  if nc -z localhost "$PORT" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! nc -z localhost "$PORT" >/dev/null 2>&1; then
  echo "Metro did not start on port $PORT. Check $METRO_LOG"
  exit 1
fi

react-native run-ios --no-packager --port "$PORT" "$@"
