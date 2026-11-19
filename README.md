# todo

Laravel 12 + Inertia.js + React (TypeScript) で作ったタスク管理アプリです。

アプリ本体は [`todo-app/`](todo-app/) にあります。機能、セットアップ方法、API などは [`todo-app/README.md`](todo-app/README.md) を見てください。

## クイックスタート

```bash
cd todo-app
composer install && npm install
cp .env.example .env && php artisan key:generate
touch database/database.sqlite && php artisan migrate
composer run dev   # http://localhost:8000
```
