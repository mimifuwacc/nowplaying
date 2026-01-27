#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/helpers.sh"

APP_DIR=$(get_project_root)
LAYER_DIR="$APP_DIR/layer/modules"

cd "$APP_DIR"

blue "Building native modules for AWS Lambda"

docker build --platform linux/amd64 -f scripts/Dockerfile.lambda -t nowplaying-lambda-build .

rm -rf "$LAYER_DIR"
mkdir -p "$LAYER_DIR"

blue "\nCopying native modules to Lambda layer directory"

docker run --platform linux/amd64 --rm \
  -v "$APP_DIR/layer:/output" \
  nowplaying-lambda-build \
  bash -c "
    mkdir -p /output/modules/nodejs/node_modules
    rsync -a --copy-links --exclude='.pnpm' node_modules/ /output/modules/nodejs/node_modules/
    rsync -a --copy-links node_modules/.pnpm/*/node_modules/ /output/modules/nodejs/node_modules/ 2>/dev/null || true
  "

SIZE=$(du -sh "$LAYER_DIR" | cut -f1)
green "\nNative modules built and copied to $LAYER_DIR ($SIZE)"
