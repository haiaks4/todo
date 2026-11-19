# Todo App

Laravel 12 + Inertia.js + React (TypeScript) で作ったタスク管理アプリです。

## 主な機能

- **認証**：ユーザー登録・ログイン・パスワードリセット・プロフィール編集・アカウント削除（Laravel Breeze ベース）
- **タスク管理**
  - タスクの作成・編集・削除・複製
  - タイトル、説明、期限、優先度（高・中・低）、ステータス（未着手・進行中・完了）、タグを設定できる
  - キーワード検索と、ステータス・優先度・タグでの絞り込み
  - 左端の丸ボタンをタップするだけで完了／未完了を切り替え
  - ドラッグ&ドロップでの並び替え（絞り込み中でも、表示されていないタスクの順序は保たれる）
  - 複数のタスクを選択して、まとめて完了・削除
  - 削除した直後なら、通知の「元に戻す」で取り消せる
  - 期限を過ぎた未完了タスクを強調表示
- **スマホ向けの操作**
  - 右にスワイプで完了、左にスワイプで削除
  - 長押し（または「選択」ボタン）で選択モードに入り、画面下のバーからまとめて操作
  - 並び替えは「並び替え」ボタンでモードを切り替えてから、つまみをドラッグ
  - タスクの作成は右下の「＋」ボタンから。作成・編集・詳細の画面は下から出るシートで表示
- **タグ管理**：ユーザーごとにタグを作成・名前変更・削除できる。削除するとタスクからタグが外れる
- **ダッシュボード**：ステータス別の件数と完了率をグラフで表示
- **リマインドメール**：プロフィール画面で有効にすると、毎朝 8:00 に「期限が明日の未完了タスク」をメールで通知する

## 技術スタック

| 区分 | 使用技術 |
| --- | --- |
| バックエンド | PHP 8.2 以上、Laravel 12、Inertia.js (Laravel)、Ziggy |
| フロントエンド | React 19、TypeScript、Inertia.js (React)、Tailwind CSS 4、Vite 6 |
| UI コンポーネント | [shadcn/ui](https://ui.shadcn.com/)（Radix UI ベース）、lucide-react（アイコン）、sonner（通知） |
| フロントエンドのライブラリ | SWR（データ取得）、react-hook-form（フォーム）、dnd-kit（並び替え）、Recharts（グラフ） |
| DB | SQLite（既定）／ MySQL 8（Laravel Sail 使用時） |
| テスト | PHPUnit 11 |
| Lint・フォーマット | Biome |

## 必要な環境

- PHP 8.2 以上（拡張モジュール `pdo_sqlite`・`mbstring` など Laravel の要件を満たすもの）
- Composer 2
- Node.js 20 以上と npm（shadcn/ui の CLI が Node.js 20.18 以上を必要とするため）

## セットアップ（ローカル・SQLite）

```bash
cd todo-app

# 依存パッケージのインストール
composer install
npm install

# 環境設定
cp .env.example .env
php artisan key:generate

# DB の作成とマイグレーション
touch database/database.sqlite
php artisan migrate
```

### 起動

```bash
composer run dev
```

次の 4 つを同時に起動します。

| 名前 | コマンド | 役割 |
| --- | --- | --- |
| server | `php artisan serve` | アプリ本体（http://localhost:8000） |
| queue | `php artisan queue:listen` | リマインドメールなどのジョブ処理 |
| logs | `php artisan pail` | ログ表示（`pcntl` 拡張が必要） |
| vite | `npm run dev` | フロントエンドの開発サーバー |

ブラウザで http://localhost:8000 を開き、ユーザー登録してから使います。

### リマインドメールを試す

リマインドはスケジューラから実行されるため、開発中は別のターミナルで次を起動します。

```bash
php artisan schedule:work     # スケジューラを常駐させる
php artisan schedule:list     # 登録されているスケジュールの確認
```

既定では `MAIL_MAILER=log` なので、メールは送信されず `storage/logs/laravel.log` に出力されます。

## Laravel Sail（Docker）で動かす場合

`docker-compose.yml` は Sail 用です。MySQL・Redis・Mailpit などのコンテナが起動します。

1. `.env` の DB 設定を MySQL 用に変更します。

   ```dotenv
   DB_CONNECTION=mysql
   DB_HOST=mysql
   DB_PORT=3306
   DB_DATABASE=laravel
   DB_USERNAME=sail
   DB_PASSWORD=password

   MAIL_MAILER=smtp
   MAIL_HOST=mailpit
   MAIL_PORT=1025
   ```

2. コンテナを起動してセットアップします。

   ```bash
   composer install
   ./vendor/bin/sail up -d
   ./vendor/bin/sail artisan key:generate
   ./vendor/bin/sail artisan migrate
   ./vendor/bin/sail npm install
   ./vendor/bin/sail npm run dev
   ```

アプリは http://localhost で、Mailpit（受信メールの確認画面）は http://localhost:8025 で開けます。

## 環境変数のポイント

| 変数 | 既定値 | 説明 |
| --- | --- | --- |
| `APP_LOCALE` | `ja` | 入力エラーやエラーメッセージの言語。翻訳ファイルは `lang/ja` |
| `APP_TIMEZONE` | `Asia/Tokyo` | タスクの期限とリマインドの判定に使うタイムゾーン |
| `QUEUE_CONNECTION` | `database` | リマインドメールはキュー経由で送信される |
| `MAIL_MAILER` | `log` | 本番では SMTP などに変更する |

> **注意**：期限（`due_date`）はタイムゾーンなしの日時として保存し、`APP_TIMEZONE` の時刻として扱います。運用中に `APP_TIMEZONE` を変えると、既存の期限の意味が変わります。

## テスト

```bash
php artisan test
```

テストは SQLite のメモリ上の DB で実行されます（`phpunit.xml` で設定）。MySQL やビルド済みのフロントエンドは必要ありません。

## CI

GitHub Actions（`.github/workflows/ci.yml`）で、プルリクエストと `main`・`develop` への push のたびに次を実行します。

- バックエンド：`php artisan test`
- フロントエンド：型チェック（`tsc --noEmit`）、Biome による Lint・フォーマットのチェック（`biome ci`）、ビルド（`vite build`）

## コード品質

```bash
npm run lint       # Biome で Lint
npm run format     # Biome でフォーマット
npm run check      # Lint・フォーマット・import の並び替えをまとめて実行（自動修正あり）
npx tsc --noEmit   # TypeScript の型チェック
npm run build      # 本番用ビルド（型チェックも含む）
```

Lint とフォーマットには [Biome](https://biomejs.dev/) を使っています（設定は `biome.json`）。React Hooks のルールや import の並び替え、Tailwind CSS のクラスの並び替えも Biome で行います。エディタでは Biome の拡張機能を入れると、保存時に整形できます。

## UI コンポーネント（shadcn/ui）

UI は [shadcn/ui](https://ui.shadcn.com/) で作っています。コンポーネントはライブラリとして読み込むのではなく、`resources/js/Components/ui/` にソースコードとして追加されています。

コンポーネントを追加するときは、`todo-app` で次のコマンドを実行します（設定は `components.json`）。

```bash
npx shadcn@latest add <コンポーネント名>   # 例: npx shadcn@latest add tabs
npm run check                              # 追加したファイルを Biome の書式に整える
```

- テーマの色は `resources/css/app.css` の CSS 変数で定義しています。
- ライト／ダークは OS の設定に合わせて切り替わります（`next-themes`）。
- macOS では大文字小文字を区別しないため、`components.json` の出力先は既存の `Components` に合わせています。

## ディレクトリ構成（主要部分）

```text
todo-app/
├── app/
│   ├── Http/
│   │   ├── Controllers/        # TaskController, TagController, ProfileController
│   │   └── Requests/           # 入力チェック（Task/*, Tag/*）
│   ├── Jobs/                   # SendTaskReminderJob（リマインド送信）
│   ├── Mail/                   # TaskReminderMail
│   ├── Models/                 # User, Task, Tag（いずれも論理削除）
│   ├── Policies/               # TaskPolicy, TagPolicy（本人のデータのみ操作可）
│   └── Repositories/           # DB 操作をまとめたリポジトリ（インターフェースは Contracts/）
├── bootstrap/app.php           # ルーティングと、JSON API 用の例外ハンドリング
├── database/
│   ├── factories/              # User, Task, Tag のファクトリ
│   └── migrations/
├── lang/ja/                    # 日本語の翻訳（入力エラー、エラー、タスク、タグ）
├── resources/
│   ├── js/
│   │   ├── Components/ui/      # shadcn/ui のコンポーネント（CLI で追加したもの）
│   │   ├── Components/Task/    # タスクの一覧項目、作成・編集ダイアログ、詳細ダイアログ
│   │   ├── Components/Tag/     # タグ管理ダイアログ
│   │   ├── Pages/              # Dashboard, Task/Index, Profile, Auth
│   │   ├── lib/api.ts          # API クライアントとエラー処理のヘルパー
│   │   ├── lib/task.ts         # ステータス・優先度の表示名や色などタスク表示の共通処理
│   │   └── types/              # 型定義
│   └── views/emails/           # リマインドメールのテンプレート
├── routes/
│   ├── web.php                 # 画面と JSON API のルート
│   └── console.php             # スケジュール（毎朝 8:00 のリマインド）
└── tests/Feature/              # 認証、プロフィール、タスク・タグ API のテスト
```

## 画面と API

画面は Inertia で描画し、タスクとタグのデータは画面から JSON API を呼んで取得します。API はすべてログインが必要で（セッション認証）、本人のデータしか操作できません。

| 画面 | パス |
| --- | --- |
| ダッシュボード | `/dashboard` |
| タスク管理 | `/task` |
| プロフィール | `/profile` |

| メソッド | パス | 内容 |
| --- | --- | --- |
| GET | `/api/tasks` | タスク一覧（`search`・`status`・`priority`・`tag_id` で絞り込み） |
| POST | `/api/tasks` | タスク作成 |
| GET | `/api/tasks/{task}` | タスク詳細 |
| PATCH | `/api/tasks/{task}` | タスク更新 |
| DELETE | `/api/tasks/{task}` | タスク削除 |
| POST | `/api/tasks/{task}/duplicate` | タスク複製（一覧の末尾に「〇〇 のコピー」として追加） |
| POST | `/api/tasks/bulk-delete` | 一括削除（`ids`: タスク ID の配列） |
| POST | `/api/tasks/bulk-status` | ステータスの一括変更（`ids`、`status`） |
| POST | `/api/tasks/restore` | 削除したタスクを元の位置に戻す（`ids`） |
| POST | `/api/tasks/reorder` | 並び替え（`ids`: 新しい並び順のタスク ID の配列） |
| GET | `/api/tags` | タグ一覧 |
| POST | `/api/tags` | タグ作成 |
| PATCH | `/api/tags/{tag}` | タグ名の変更 |
| DELETE | `/api/tags/{tag}` | タグ削除（関連タスクからタグを外す） |

入力エラーのときは 422 を返し、`errors` にフィールドごとの日本語メッセージが入ります。

## ブランチ運用

git flow に沿って運用します。詳しいルールは [`.claude/skills/git-flow-dev/SKILL.md`](../.claude/skills/git-flow-dev/SKILL.md) にあります。

- `main`（リリース済み）と `develop`（開発の統合先）には直接コミットしません。
- 作業用のブランチは、最新の `origin/develop` から `<プレフィックス>/<英小文字のケバブケース>`（例：`fix/todo-not-saved-on-reload`）の形で作ります。
- プルリクエストは `develop` に向けて作成します。

| プレフィックス | 用途 |
| --- | --- |
| `feature/` | 新機能の追加・機能改善 |
| `fix/` | バグ修正 |
| `refactor/` | 動作を変えないコード整理 |
| `docs/` | ドキュメントだけの変更 |
| `test/` | テストだけの追加・修正 |
| `chore/` | ビルド設定・依存関係・CI など |
| `release/` | リリース準備（`develop` から作り、`main` と `develop` にマージ） |
| `hotfix/` | 本番の緊急修正（`main` から作り、`main` と `develop` にマージ） |

コミットメッセージは Conventional Commits 形式（`<type>: <要約>`、例：`fix: リロード時に TODO が保存されない問題を修正`）で書きます。
