# クエストマネージャー (Task Manager App)

RPG風UIのタスク管理アプリ。フロントエンドは React + Vite、バックエンドは Cloudflare Workers + D1。

## 前提条件

- Node.js (v18 以上)
- npm

## 環境構築

### 1. リポジトリのクローンとブランチ切り替え

```bash
git clone <repository-url>
cd hackathon-sokuseki-team1
git checkout mock
```

### 2. フロントエンドのセットアップ

```bash
npm install
```

### 3. バックエンドのセットアップ

```bash
cd backend
npm install
```

### 4. ローカルDBのマイグレーション

```bash
cd backend
npm run db:migrate:local
```

確認プロンプトが出たら `Y` で進めてください（ローカルDBのみ影響）。

### 5. マスターアカウントのシード投入

マイグレーションではテーブル定義のみ作成されます。ログイン用のマスターアカウントは `seed.js` で投入します。

```bash
cd backend
SQL=$(node seed.js) && npx wrangler d1 execute hackathon-sokuseki-team1-db --local --command "$SQL"
```

これで以下のアカウントが作成されます:
- メール: `master@example.com`
- パスワード: `password123`

### 6. 開発サーバーの起動

**ターミナル1 — バックエンド (port 8787)**
```bash
cd backend
npm run dev
```

**ターミナル2 — フロントエンド (port 5173)**
```bash
npm run dev
```

フロントエンドの Vite dev server が `/api/*` へのリクエストを `localhost:8787` にプロキシします。
両方のサーバーを同時に起動する必要があります。

### 7. ブラウザで確認

http://localhost:5173/hackathon-sokuseki-team1/ を開き、マスターアカウントでログインできれば環境構築完了です。

> ポート 5173 が使用中の場合、Vite が自動で別ポート（5174 など）を使います。ターミナルの出力を確認してください。

## スクリプト一覧

### フロントエンド (ルート)

| コマンド | 説明 |
|---|---|
| `npm run dev` | Vite 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run preview` | ビルド結果のプレビュー |
| `npm run lint` | ESLint 実行 |

### バックエンド (`backend/`)

| コマンド | 説明 |
|---|---|
| `npm run dev` | wrangler dev サーバー起動 |
| `npm run deploy` | Cloudflare Workers にデプロイ |
| `npm run db:migrate:local` | ローカルDBにマイグレーション適用 |
| `npm run db:migrate:remote` | リモートDBにマイグレーション適用 |

## 技術スタック

- **フロントエンド**: React 19 + Vite 7 + lucide-react
- **バックエンド**: Cloudflare Workers + D1 (SQLite)
- **認証**: PBKDF2 パスワードハッシュ + Bearer トークン
