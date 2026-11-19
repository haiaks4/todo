#!/usr/bin/env bash
# 変更前（ベース）と変更後（現在のブランチ）のスクリーンショットを撮る。
# 使い方（todo-app ディレクトリで実行）:
#   bash ../.claude/skills/pr-screenshots/scripts/shoot.sh <base-ref> <scenes-file> <out-dir>
#   例: bash ../.claude/skills/pr-screenshots/scripts/shoot.sh origin/develop /tmp/scenes.cjs /tmp/pr-shots
set -euo pipefail

BASE_REF=$1
SCENES=$(realpath "$2")
OUT=$(mkdir -p "$3" && realpath "$3")
PORT=${PORT:-8123}
# ブランチを切り替えるとこのスクリプト自体が無くなることがあるので、一時ディレクトリに写して使う
SCRIPTS=$(mktemp -d)
cp "$(cd "$(dirname "$0")" && pwd)"/* "$SCRIPTS"/

if [ -n "$(git status --porcelain)" ]; then
    echo "未コミットの変更があります。コミットするか stash してから実行してください。" >&2
    exit 1
fi
HEAD_REF=$(git symbolic-ref --short -q HEAD || git rev-parse HEAD)
DB=$(mktemp -d)/screenshots.sqlite

cleanup() {
    [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null || true
    git checkout -q "$HEAD_REF"
}
trap cleanup EXIT

shoot() {
    local label=$1 ref=$2 lock_before
    lock_before=$(cat composer.lock package-lock.json | md5sum)
    git checkout -q "$ref"
    # 依存関係が変わっていれば入れ直す
    if [ "$lock_before" != "$(cat composer.lock package-lock.json | md5sum)" ] || [ "$label" = before ]; then
        composer install -q --no-interaction
        npm ci --silent
    fi
    npm run build --silent >/dev/null
    rm -f "$DB" && touch "$DB"
    export DB_CONNECTION=sqlite DB_DATABASE=$DB
    php artisan migrate:fresh --force -q
    php artisan tinker --execute="$(tail -n +2 "$SCRIPTS/seed-demo.php")" >/dev/null
    php artisan serve --port="$PORT" >/dev/null 2>&1 &
    SERVER_PID=$!
    for _ in $(seq 30); do curl -s -o /dev/null "http://127.0.0.1:$PORT/login" && break; sleep 0.5; done
    node "$SCRIPTS/capture.cjs" "http://127.0.0.1:$PORT" "$SCENES" "$OUT" "$label"
    kill "$SERVER_PID"; wait "$SERVER_PID" 2>/dev/null || true; SERVER_PID=
}

shoot before "$(git rev-parse "$BASE_REF")"
shoot after "$HEAD_REF"

# 依存関係とビルドを現在のブランチの状態に戻す
composer install -q --no-interaction
npm ci --silent
npm run build --silent >/dev/null
echo "done: $OUT"
