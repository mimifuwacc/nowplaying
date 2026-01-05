#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/build-helpers.sh"

APP_DIR=$(get_project_root)
LAYER_DIR="$APP_DIR/layer/modules"

cd "$APP_DIR"

blue "Building native modules for AWS Lambda"

docker build --platform linux/amd64 -f Dockerfile.lambda -t nowplaying-lambda-build .

rm -rf "$LAYER_DIR"
mkdir -p "$LAYER_DIR"

blue "\nCopying native modules to Lambda layer directory"

docker run --platform linux/amd64 --rm \
  -v "$APP_DIR/layer:/output" \
  -v "$SCRIPT_DIR/docker:/scripts:ro" \
  nowplaying-lambda-build \
  bash /scripts/copy-modules.sh /output

green "\nNative modules built and copied to $LAYER_DIR"

