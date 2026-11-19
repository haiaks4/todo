---
name: git-flow-dev
description: このリポジトリで開発作業（機能追加・バグ修正・リファクタリング・ドキュメント更新など）を始めるとき、ブランチを作成するとき、コミットするとき、プルリクエストを作成するときに使う。git flow に準じたブランチ運用（最新の develop から作業用ブランチを切り、PR は develop に向ける）とブランチ・コミット・PR の命名規則を定める。
---

# Git Flow 開発スキル

このリポジトリでは git flow に準じたブランチ運用を行う。コードを変更する作業は、必ず以下の手順と命名規則に従うこと。

## ブランチ構成

| ブランチ | 役割 | 直接コミット |
|---|---|---|
| `main` | リリース済み（本番）のコード | 禁止 |
| `develop` | 次回リリースに向けた開発の統合先 | 禁止 |
| `feature/*` などの作業用ブランチ | 個々の作業 | 可 |

- `main` と `develop` には直接コミット・push しない。変更は必ず作業用ブランチから PR 経由で取り込む。
- 1 ブランチ = 1 つの目的。関係のない変更は別ブランチに分ける。

## 作業開始の手順

作業用ブランチは **必ずリモートの最新の `develop` から** 作成する。ローカルの `develop` が古い可能性があるため、作成前に必ず fetch する。

```bash
# 1. 未コミットの変更がないことを確認
git status

# 2. リモートの最新を取得
git fetch origin develop

# 3. 最新の origin/develop から作業用ブランチを作成
git switch -c <prefix>/<branch-name> origin/develop
```

- 他のブランチ（`main` や別の作業用ブランチ）を起点にしない。
- 作業が長引いて `develop` が進んだ場合は、`git fetch origin develop` のあと `git rebase origin/develop` で追従する（すでに他者と共有しているブランチでは rebase ではなく `git merge origin/develop` を使う）。

## ブランチの命名規則

形式: `<prefix>/<short-description>`（必要に応じて `<prefix>/<issue番号>-<short-description>`）

### プレフィックス

| プレフィックス | 用途 | 分岐元 | マージ先 |
|---|---|---|---|
| `feature/` | 新機能の追加・機能改善 | `develop` | `develop` |
| `fix/` | 開発中のバグ修正 | `develop` | `develop` |
| `refactor/` | 振る舞いを変えないコード改善 | `develop` | `develop` |
| `docs/` | ドキュメントのみの変更 | `develop` | `develop` |
| `test/` | テストの追加・修正のみ | `develop` | `develop` |
| `chore/` | ビルド設定・依存関係・CI などの雑務 | `develop` | `develop` |
| `release/` | リリース準備（例: `release/1.2.0`） | `develop` | `main` と `develop` |
| `hotfix/` | 本番の緊急修正 | `main` | `main` と `develop` |

`release/` と `hotfix/` はユーザーから明示的に指示された場合のみ使う。通常の開発作業では `develop` から分岐し `develop` に戻すプレフィックスを使う。

### 名前の付け方

- 英小文字・数字・ハイフンのみ（kebab-case）。スペース・アンダースコア・日本語・大文字は使わない。
- 作業内容が一目でわかる、簡潔な英語にする（目安 2〜5 単語、全体で 50 文字以内）。
- 動詞の原形または名詞句で書く。
- 関連する issue があれば番号を先頭に付ける。

良い例:

- `feature/add-todo-due-date`
- `feature/12-filter-completed-todos`
- `fix/todo-not-saved-on-reload`
- `refactor/extract-todo-storage`
- `docs/update-readme-setup`
- `chore/update-dependencies`

悪い例:

- `feature/test`（内容がわからない）
- `Feature/AddTodo`（大文字・キャメルケース）
- `fix_bug`（プレフィックスの形式違い・内容が曖昧）
- `add-due-date`（プレフィックスなし）
- `feature/期限追加`（日本語）

## コミット

[Conventional Commits](https://www.conventionalcommits.org/ja/) の形式を使う。

```
<type>: <要約>

<必要なら本文：何を・なぜ変更したか>
```

- `type` はブランチのプレフィックスと同じ語彙を使う: `feat` / `fix` / `refactor` / `docs` / `test` / `chore`（`feature/` ブランチでのコミットは `feat`）。
- 要約は 50 文字程度以内で、変更内容を具体的に書く。日本語でよい。
  - 例: `feat: TODO に期限日を設定できるようにする`
  - 例: `fix: リロード時に TODO が保存されない問題を修正`
- 1 コミット = 1 つの論理的な変更。

## プルリクエスト

- **ベースブランチは必ず `develop`**。`main` に向けて PR を出さない（`release/`・`hotfix/` を除く）。
- 作成前に `git fetch origin develop` し、作業ブランチが最新の `develop` に追従していること（コンフリクトがないこと）を確認する。
- リポジトリに PR テンプレート（`.github/pull_request_template.md` など）があればその見出しに従う。
- タイトル: コミットと同じ `<type>: <要約>` 形式。
- 本文に最低限以下を含める:
  - **概要**: 何をなぜ変更したか
  - **変更内容**: 主な変更点の箇条書き
  - **動作確認**: 実施したテスト・確認手順
  - **関連 issue**: あれば `Closes #<番号>`
- PR はユーザーから作成を依頼された場合にのみ作成する。

## チェックリスト

作業開始時:
- [ ] `git fetch origin develop` で最新を取得した
- [ ] `origin/develop` から作業用ブランチを作成した
- [ ] ブランチ名がプレフィックス付きの kebab-case で、内容を表している

PR 作成時:
- [ ] ベースブランチが `develop` になっている
- [ ] 最新の `develop` に追従しており、コンフリクトがない
- [ ] タイトルと本文が上記の形式に沿っている
