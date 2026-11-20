#!/usr/bin/env bash
# E2E テスト用のサーバーを起動する（playwright.config.ts の webServer から呼ばれる）。
# 開発用の DB を汚さないよう、専用の SQLite ファイルを作り直してから起動する。
set -euo pipefail
cd "$(dirname "$0")/.."

export DB_CONNECTION=sqlite
export DB_DATABASE="$PWD/database/e2e.sqlite"
export QUEUE_CONNECTION=sync
export MAIL_MAILER=log

rm -f "$DB_DATABASE"
touch "$DB_DATABASE"
php artisan migrate:fresh --force --seed --seeder='Database\Seeders\E2eSeeder' --quiet

exec php artisan serve --host=127.0.0.1 --port="${E2E_PORT:-8123}"
