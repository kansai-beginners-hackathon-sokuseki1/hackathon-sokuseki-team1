# Git Workflow

## この文書で一番大事なこと
- `main` へ直接 push しない。
- 作業は Issue と個別ブランチに紐づけて進める。
- `main` へ入れる時は PR を作り、1 人以上の確認を受ける。
- この repo の `main` への統合方法は `squash merge` を前提とする。

## 目的
この文書は、小規模チームで次を実現するための Git 運用ルールを定義する。

- 履歴の可読性を保つ
- コンフリクトを減らす
- レビューしやすい変更単位を保つ
- `main` を安定状態で維持する

## 基本方針

### `main` ブランチ
- `main` は安定状態を保つ。
- `main` への直接 push は行わない。
- 変更は PR 経由で統合する。
- `main` へ入る変更は、少なくとも 1 人の確認を受ける。

### 作業ブランチ
- 機能追加、バグ修正、文書更新は個別ブランチで行う。
- ブランチ名の例:
  - `feature/...`
  - `fix/...`
  - `refactor/...`
  - `docs/...`
  - `chore/...`
- 命名は一貫していればよく、細かい記法はチームで揃える。
- 個別ブランチ同士の途中マージは許可する。

## 基本フロー
1. Issue を作る、または担当 Issue を確認する。
2. 最新の `main` から作業ブランチを作る。
3. 実装、文書更新、テスト追加を行う。
4. 必要に応じて `main` の更新を取り込む。
5. コミット前にチェックリストを確認する。
6. PR を作る。
7. 1 人以上のレビュー後に `main` へマージする。

### 例
```bash
git switch main
git pull origin main
git switch -c feature/login
```

## `main` への追従
開発中に `main` が更新された場合、作業ブランチを追従させる。

### 方法 A: rebase
```bash
git fetch origin
git rebase origin/main
```

特徴:
- 履歴が直線になりやすい
- merge commit が増えない
- 個人作業ブランチでは扱いやすい

注意:
- 履歴を書き換える
- 共有ブランチでは使わない
- rebase 後に push する場合は通常 `--force-with-lease` が必要になる

### 方法 B: merge
```bash
git fetch origin
git merge origin/main
```

特徴:
- 履歴を書き換えない
- 複数人が触るブランチで安全
- merge commit が増える

### 推奨判断基準
| 状況 | 推奨 |
| --- | --- |
| 個人作業ブランチ | rebase でも merge でも可 |
| 複数人が同じブランチを触る | merge |

このチームでは、個人作業ブランチに限り `rebase` を使ってよい。迷う場合は `merge` を選ぶ。

## Pull Request
- 1 PR = 1 目的を基本とする。
- レビュー可能なサイズを目指す。
- 変更が大きい場合は PR を分割するか、先に設計・調査 Issue を切る。
- docs のみの更新でも、必要に応じて PR で扱う。

### PR に必ず書くこと
- 変更内容
- 確認方法
- 未解決事項

## `main` への統合方法
GitHub では PR の統合方法として複数の選択肢があるが、この repo では設定上 `squash merge` を採用する。

### squash merge を採用する理由
- `main` の履歴を簡潔に保ちやすい
- 作業中の細かいコミットをまとめられる
- 小規模チームでも追跡しやすい

### 他の方法との位置づけ
- `merge commit`: ブランチ構造を明示的に残したい場合に向くが、この repo では現在無効
- `rebase merge`: 直線的な履歴を保ちやすいが、この repo では現在無効

将来 GitHub 設定を変更する場合は、この文書も合わせて更新する。

## コミットメッセージ
コミットメッセージは簡潔でよい。

例:
```text
add login page
fix auth bug
refactor user service
```

または:
```text
feat: login page
fix: auth bug
docs: update meeting rules
```

## force push
- 基本的に `main` では使わない。
- 個人作業ブランチで履歴整理が必要な場合のみ検討する。
- 実行する場合は `git push --force-with-lease` を使う。

## タグ
リリースやデモ節目でタグを付けてもよい。

例:
```text
v0.1
v0.2
v1.0
```

## GitHub Project との連携
- Project の列は `Todo / In Progress / Review / Done`
- Issue 起票時は `Todo`
- 着手時は `In Progress`
- PR 作成とレビュー依頼時は `Review`
- レビューで修正が必要になったら `In Progress` に戻す
- `main` へマージ完了で `Done`
