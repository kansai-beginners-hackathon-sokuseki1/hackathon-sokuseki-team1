# クエストマネージャー

RPG 風 UI のタスク管理アプリです。フロントエンドは React + Vite、バックエンドは Cloudflare Workers + D1 を使っています。

## 前提

- Node.js 18 以上
- npm

## セットアップ

### 1. リポジトリ取得

```bash
git clone <repository-url>
cd hackathon-sokuseki-team1
git checkout mock
```

### 2. フロントエンド依存関係

```bash
npm install
```

### 3. バックエンド依存関係

```bash
cd backend
npm install
```

### 4. ローカル DB マイグレーション

```bash
cd backend
npm run db:migrate:local
```

### 4.1 外部公開先 / リモート D1 への反映

外部アクセス時や `workers.dev` 上の API を使う場合は、リモート D1 にも同じマイグレーションを適用します。

```bash
cd backend
npm run db:migrate:remote
```

### 4.2 migration を有効化する手順

ローカル開発だけなら次を実行します。

```bash
cd backend
npm run db:migrate:local
```

外部公開中の API や `workers.dev` を使う場合は、続けて次も実行します。

```bash
cd backend
npm run db:migrate:remote
```

`D1_Error` や `no such table` が出る場合は、対象環境の migration が未反映の可能性があります。ローカルは `npm run db:migrate:local`、リモートは `npm run db:migrate:remote` を再実行してください。

### 5. サーバー起動

バックエンド:

```bash
cd backend
npm run dev
```

フロントエンド:

```bash
npm run dev
```

ブラウザで `http://localhost:5173/hackathon-sokuseki-team1/` を開きます。

## 主なコマンド

### フロントエンド

- `npm run dev`: Vite 開発サーバー
- `npm run build`: 本番ビルド
- `npm run preview`: ビルド結果の確認
- `npm run lint`: ESLint

### バックエンド

- `npm run dev`: `wrangler dev`
- `npm run deploy`: Cloudflare Workers へデプロイ
- `npm run db:migrate:local`: ローカル D1 へマイグレーション
- `npm run db:migrate:remote`: リモート D1 へマイグレーション

外部向け API で `D1_Error` が出る場合は、リモート D1 へのマイグレーション未反映を疑って `npm run db:migrate:remote` を実行してください。

## 技術スタック

- フロントエンド: React 19, Vite 7, lucide-react
- バックエンド: Cloudflare Workers, D1
- 認証: PBKDF2 ベースのパスワードハッシュ + Bearer トークン

## 現在の仕様メモ

- タスク完了時は、中央の完了ウィンドウを最前面に表示します。
- レベルアップが発生した場合は、レベルアップ演出のあとに NPC メッセージを表示します。
- NPC メッセージも中央の別ウィンドウとして表示します。
- 進行度フィルタはマルチセレクト方式です。
- 進行度フィルタの初期状態は `未着手` と `進行中` のみで、`完了` は初期表示しません。
- 完了タスクの経験値は、同じ完了操作の多重送信で重複加算されないよう制御しています。
