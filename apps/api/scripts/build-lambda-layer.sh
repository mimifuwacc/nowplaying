#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🐳 Dockerを使ってLambda用のネイティブアドオンをビルドします..."
echo "📁 作業ディレクトリ: $APP_DIR"

cd "$APP_DIR"

# Dockerイメージをビルド（AMD64プラットフォームを指定）
docker build --platform linux/amd64 -f Dockerfile.lambda -t nowplaying-lambda-build .

# ビルド結果をホストマシンにコピー
rm -rf "$APP_DIR/lambda-build"
mkdir -p "$APP_DIR/lambda-build"

# satoriと@resvg/resvg-jsのみを含むLayerを作成
docker run --platform linux/amd64 --rm -v "$APP_DIR/lambda-build:/output" nowplaying-lambda-build \
  bash -c "
    cd /build

    echo '🔍 Creating minimal layer with satori and @resvg...'

    mkdir -p /tmp/layer/nodejs/node_modules

    # pnpmの仮想ストアから全てのパッケージをコピー
    echo '📦 Copying all node_modules from pnpm store...'

    # シンプルにrsyncを使って全てをコピー（シンボリックリンクをたどる）
    rsync -av --copy-links --exclude='.pnpm' node_modules/ /tmp/layer/nodejs/node_modules/

    # .pnpm内のパッケージもコピー
    rsync -av --copy-links node_modules/.pnpm/*/node_modules/ /tmp/layer/nodejs/node_modules/ 2>/dev/null || true

    echo '✅ All node_modules copied'

    # sharpのネイティブモジュールを確認
    echo '🔍 Verifying sharp installation:'
    if [ -d /tmp/layer/nodejs/node_modules/sharp ]; then
      echo '✅ sharp found in layer'
      ls -la /tmp/layer/nodejs/node_modules/sharp/ | head -10
    else
      echo '❌ sharp not found in layer!'
    fi

    # 確認
    echo '📁 Layer modules:'
    ls -la /tmp/layer/nodejs/node_modules/ | head -30
    echo ''
    echo '🔍 Verifying linebreak directory:'
    ls -la /tmp/layer/nodejs/node_modules/linebreak/ || echo '❌ linebreak directory not found!'
    echo ''
    echo '📦 Layer size (before zip):'
    du -sh /tmp/layer

    # zipファイルを作成
    cd /tmp/layer
    zip -qr /output/nodejs-modules.zip nodejs

    echo '📦 Layer size (after zip):'
    du -sh /output/nodejs-modules.zip
  "

echo "✅ ビルド完了！ lambda-build/nodejs-modules.zip が作成されました"
echo "📦 サイズ: $(du -sh "$APP_DIR/lambda-build/nodejs-modules.zip" | cut -f1)"
