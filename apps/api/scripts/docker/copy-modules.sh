#!/bin/bash
set -e

OUTPUT_DIR=${1:-/output}

mkdir -p "$OUTPUT_DIR/modules/nodejs/node_modules"

rsync -a --copy-links --exclude='.pnpm' node_modules/ "$OUTPUT_DIR/modules/nodejs/node_modules/" --quiet
rsync -a --copy-links node_modules/.pnpm/*/node_modules/ "$OUTPUT_DIR/modules/nodejs/node_modules/" 2>/dev/null || true

