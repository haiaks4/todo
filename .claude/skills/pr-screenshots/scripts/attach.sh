#!/usr/bin/env bash
# PR 本文に「## スクリーンショット」欄を入れ、画像を gh の --attach でアップロードする。
# 使い方: bash attach.sh <PR番号> <ディレクトリ>
#   ディレクトリには screenshots.md（欄の中身。画像は ./before-xxx.png のような相対パスで参照）と画像を置く。
#   すでに「## スクリーンショット」欄があれば置き換える。欄は「## 関連 issue」の前（無ければ末尾）に入れる。
set -euo pipefail

PR=$1
cd "$2"

if ! gh pr edit --help 2>/dev/null | grep -q -- '--attach'; then
    echo "この gh は --attach に対応していません。gh を最新にしてください（例: brew upgrade gh）。" >&2
    exit 1
fi

gh pr view "$PR" --json body -q .body > body.orig.md

# 既存の「## スクリーンショット」欄を取り除く
awk '/^## スクリーンショット/ { skip = 1; next } /^## / { skip = 0 } !skip' body.orig.md > body.clean.md

awk -v sec=screenshots.md '
    /^## 関連 issue/ && !done { while ((getline line < sec) > 0) print line; print ""; done = 1 }
    { print }
    END { if (!done) { print ""; while ((getline line < sec) > 0) print line } }
' body.clean.md > body.md

args=()
for f in $(grep -o '\./[A-Za-z0-9._-]*\.png' screenshots.md | sort -u); do
    args+=(--attach "$f")
done

gh pr edit "$PR" --body-file body.md "${args[@]}"
echo "PR #$PR にスクリーンショットを載せました。"
