# Hackathon Team Workspace

## Backend MVP

Cloudflare Workers + D1 backend for the RPG-style task manager MVP.

### Run

```bash
npm install
npm run db:migrate:local
npm start
```

Default server:
- `http://localhost:8787`

Main endpoints:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/complete`
- `GET /api/progress`
- `GET /api/rpg-state`

### Test

```bash
npm test
```

### D1 setup

- Create a D1 database: `wrangler d1 create hackathon-sokuseki-team1-db`
- Copy the returned `database_id` into [wrangler.toml](/C:/Users/paramaster/Desktop/hackathon/hackathon-sokuseki-team1/wrangler.toml)
- Apply local migrations: `npm run db:migrate:local`
- Apply remote migrations: `npm run db:migrate:remote`

## この文書で一番大事なこと
- 作業は必ず個別ブランチで行い、`main` へ直接 push しない。
- タスクは GitHub Issues に起票してから着手する。
- 進捗は GitHub Projects の `Todo / In Progress / Review / Done` で管理する。
- 秘密情報は `.env`、接続先は `config/endpoints.local.json` に置き、Git 管理しない。
- 決定事項は Discord だけで終わらせず、repo 内の文書に残す。

## 用語
- Issue: やることを管理するチケット
- Project: Issue や PR の進み具合を見るボード
- PR: 変更を `main` に入れる前のレビュー依頼

## フォルダ構成
- `planning/`: 企画、要件、アイデア整理
- `design/`: UI、画面案、素材方針
- `dev/`: 実装コード、技術検証、開発メモ
- `demo/`: 発表資料、デモ手順、提出物
- `docs/meeting-notes/`: 会議要約
- `docs/operations/`: 開発ルールと運用手順
- `docs/templates/`: 議事録、タスク、開発用テンプレート
- `docs/checklists/`: 作業時の確認表
- `assets/`: 共有素材
- `archive/`: 保管用
- `config/`: 設定サンプル

## 進め方
1. まず Issue を作る。未確定なら調査・設計・決定用 Issue に分ける。
2. GitHub Project の列は `Todo / In Progress / Review / Done` を使う。
3. 作業ブランチを切る。例: `feature/login-page`, `docs/meeting-rule`
4. 実装または文書更新を行い、必要ならテストや確認手順を追加する。
5. PR を作って 1 人以上の確認を受けてから `main` にマージする。

## ブランチとレビュー
- 個別ブランチ間の途中マージは許可する。
- `main` への反映は `PR 必須 + 1 承認必須`。
- `main` への direct push はしない。
- PR には `変更内容 / 確認方法 / 未解決事項` を書く。

## 会議と情報共有
- 会議は当面 Discord VC を使う。
- 決定事項の正本は repo 内に残す。
- 会議後は `docs/meeting-notes/` に要約を追加する。
- Discord 連携通知は使わず、進捗の正本は GitHub に置く。

## 設定とセキュリティ
- API キー、トークン、認証情報はコードに直書きしない。
- エンドポイントや URL もコードへ直書きしない。
- 機密情報は `.env` に保存する。
- 接続先は `config/endpoints.local.json` に保存する。
- 共有用サンプルは `.env.example` と `config/endpoints.example.json` を使う。

## AI エージェント利用
- AI に依頼する作業も Issue か明文化タスクに紐づける。
- AI への依頼には `目的 / 完了条件 / 制約 / 変更可否範囲` を書く。
- AI の変更は個別ブランチ上ではレビュー不要とし、`main` に入れる時だけ人がレビューする。
- 詳細は [docs/operations/ai-agent-rules.md](/C:/Users/s141142/Desktop/myenv/hackthon/docs/operations/ai-agent-rules.md) を参照。
