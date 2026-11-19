---
name: pr-screenshots
description: 画面（resources/js・resources/css・resources/views）に関わる変更を含むプルリクエストを作成・更新するときに使う。変更前（ベースブランチ）と変更後（作業ブランチ）のスクリーンショットをスマホ幅・PC 幅で撮り、PR 本文の「スクリーンショット」欄に変更前後を並べて載せる。ユーザーから「PR にスクショを付けて」と頼まれたときにも使う。
---

# PR スクリーンショット スキル

画面に関わる PR には、レビューする人が見た目の変化をすぐ確認できるよう、変更前後のスクリーンショットを載せる。PR の作成・命名などのルールは `git-flow-dev` スキルに従い、このスキルはスクリーンショットの撮影と掲載だけを扱う。

## 対象

- PR の差分に `todo-app/resources/js/`・`todo-app/resources/css/`・`todo-app/resources/views/` の変更が含まれるとき
- 差分がテスト・ドキュメント・バックエンドのみなら不要（PR 本文にも書かない）

## 手順

### 1. 撮る画面（シーン）を決める

差分から、見た目や操作が変わった画面を選ぶ。各シーンは原則 **スマホ（iPhone 13 相当）と PC（1280×800）の両方** を撮る。片方の幅にしか関係しない変更（例：スマホだけのボトムシート）は、その幅だけでよい。

シーンはスクラッチ（一時）ディレクトリに CommonJS ファイルで書く。例:

```js
// scenes.cjs
module.exports = [
    { name: 'list-mobile', title: 'タスク一覧（スマホ）', device: 'mobile', path: '/task' },
    { name: 'list-desktop', title: 'タスク一覧（PC）', device: 'desktop', path: '/task' },
    {
        name: 'swipe-mobile',
        title: '左スワイプ中（スマホ）',
        device: 'mobile',
        path: '/task',
        // 撮影前の操作。page は Playwright の Page。swipe / longPress はタッチ操作の再現
        run: async ({ page, swipe }) => {
            await swipe(page.locator('button.min-w-0').nth(1), -120, 0, { release: false });
        },
    },
];
```

- ログイン（デモユーザー）とページ移動はスクリプトが行う。`run` には撮影直前の操作だけを書く。
- 変更前の画面に存在しない操作（新機能のボタンなど）は失敗してもスキップされる。その場合、変更前の欄は「（なし）」にする。
- デモデータは `scripts/seed-demo.php`（長いタイトル・期限切れ・完了・進行中・タグなしなどを含む）。足りなければ `run` の中で画面を操作して作る。

### 2. 撮影する

作業内容をすべてコミットしてから、`todo-app` ディレクトリで実行する。

```bash
bash ../.claude/skills/pr-screenshots/scripts/shoot.sh origin/develop <scenes.cjs> <出力ディレクトリ>
```

- ベース（変更前）と現在のブランチ（変更後）を順にチェックアウトし、ビルド・一時 SQLite へのマイグレーション・デモデータ投入・`php artisan serve`（ポート 8123、`PORT` で変更可）・撮影を行う。終わると元のブランチと依存関係に戻す。
- 出力: `<出力ディレクトリ>/before-<name>.png`・`after-<name>.png`
- 前提: `.env`（`APP_KEY` 設定済み）があること、Node から `playwright` を読み込めること。無い場合は `npm i --no-save playwright && npx playwright install chromium`（`package.json` は変更しない）。Chromium を別の場所に置いている場合は `CHROMIUM_PATH` で指定する。
- 撮った画像は必ず自分で開いて確認する（意図した状態が写っているか、変更前後で同じ場面か）。

### 3. PR に載せる

`gh` で画像を添付できるか確認する。

```bash
gh pr edit --help | grep -q -- '--attach' && gh auth status
```

**添付できる場合**（`--attach` に対応した GitHub CLI（v2.105.0 で確認）でログイン済み。リポジトリへの push 権限が必要）:

1. 出力ディレクトリで、現在の PR 本文を取得して `body.md` に保存する。すでに「## スクリーンショット」欄があれば、その見出しから次の `## ` 見出しの手前（または末尾）までを削除する。
   ```bash
   cd <出力ディレクトリ>
   gh pr view <PR番号> --json body -q .body > body.md
   ```
2. 「## 動作確認」の後ろ（無ければ末尾の署名の前）に、次の形式の欄を入れる。画像はローカルの相対パスで書く。
   ```markdown
   ## スクリーンショット

   ### タスク一覧（スマホ）

   | 変更前 | 変更後 |
   | --- | --- |
   | ![変更前](./before-list-mobile.png) | ![変更後](./after-list-mobile.png) |
   ```
3. 本文で参照したすべての画像を `--attach` に渡して更新する。`gh` が画像をアップロードし、本文のローカルパスをアップロード先の URL に書き換える。
   ```bash
   gh pr edit <PR番号> --body-file body.md --attach ./before-list-mobile.png --attach ./after-list-mobile.png
   ```
4. `gh pr view <PR番号> --json body -q .body` で、画像の URL に置き換わっていることを確認する。

PR を新しく作る場合は、同じ本文を `gh pr create --body-file body.md --attach ...` で渡してもよい。

**添付できない場合**（`gh` が古い・未ログイン・クラウド環境などで `gh` を使えない）:

- 画像をユーザーに送り（ファイル送信の手段があればそれを使う）、手元で実行できる 3. のコマンド一式（`body.md` を含む）を示して、添付を依頼する。
- 画像をリポジトリにコミットして代わりにしない（`develop` に画像がたまるため）。

## 注意

- スクリーンショットに実在の個人情報・秘密情報を写さない（デモデータだけを使う）。
- ベースブランチは PR のマージ先（通常 `origin/develop`）にする。重ねたブランチ（前の PR の変更を含む）の場合は、直前の PR のブランチを変更前にすると差分が分かりやすい。そのときは PR 本文に何と比べたかを書く。
