# Git Workflow

## この文書で一番大事なこと
- `main` へ直接 push しない。
- 作業前に Issue を確認し、個別ブランチを切る。
- `main` へ入れる時は PR を作り、1 人以上の確認を受ける。

## 基本ルール
- ブランチ名の例:
  - `feature/...`
  - `fix/...`
  - `docs/...`
  - `chore/...`
- 個別ブランチ同士の途中マージは許可する。
- `main` は安定状態を保つ。

## 推奨フロー
1. Issue を作る、または担当を確認する。
2. `main` から個別ブランチを切る。
3. 実装、文書更新、テスト追加を行う。
4. コミット前にチェックリストを確認する。
5. PR を作る。
6. 1 人以上のレビュー後に `main` へマージする。

## PR に必ず書くこと
- 変更内容
- 確認方法
- 未解決事項

## GitHub Project
- Project の列は `Todo / In Progress / Review / Done`
- Issue 起票時は `Todo`
- 着手時は `In Progress`
- PR 作成時は `Review`
- マージ完了で `Done`
