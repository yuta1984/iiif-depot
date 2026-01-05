# IIIF Depot

IIIFリソースのアップロード・ホスティングWebサービス

## 機能

- **認証**: GoogleのOAuth 2.0のみ
- **一般ユーザー**:
  - プロフィール編集(名前、プロフィール)
  - IIIFリソースのアップロード(メタデータ入力、画像アップロード、自動IIIF化)
  - 変換ジョブタスクの進捗表示
  - アップロード済みIIIFリソースの閲覧・編集・削除
- **管理者**:
  - ユーザー閲覧
  - 容量割当の変更(デフォルトは100MB)
- **IIIF関連**:
  - 新規登録IIIFリソースの一覧ページ
  - 登録済みIIIFリソースのマニフェストファイルの動的生成
  - IIIF Image配信(Cantaloupe)

## 技術スタック

- **Backend**: Node.js + TypeScript + Hono
- **Database**: SQLite (better-sqlite3)
- **Authentication**: Google OAuth 2.0
- **Job Queue**: BullMQ + Redis
- **IIIF Server**: Cantaloupe
- **Image Processing**: ImageMagick
- **Container**: Docker + Docker Compose

## セットアップ

### 前提条件

- Node.js 20+
- Docker & Docker Compose
- ImageMagick (ローカル開発の場合)

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`を`.env`にコピーして、必要な値を設定します:

```bash
cp .env.example .env
```

重要な環境変数:
- `GOOGLE_CLIENT_ID`: Google Cloud ConsoleでOAuth 2.0クライアントIDを取得
- `GOOGLE_CLIENT_SECRET`: Google Cloud ConsoleでOAuth 2.0クライアントシークレットを取得
- `GOOGLE_REDIRECT_URI`: `http://localhost:3000/auth/google/callback`
- `SESSION_SECRET`: ランダムな文字列を生成して設定
- `ADMIN_EMAILS`: 管理者権限を付与するメールアドレス(カンマ区切り)

### 3. データベースの初期化

```bash
npm run init-db
```

これにより、`data/db/iiif-depot.db`にSQLiteデータベースが作成されます。

### 4. 開発サーバーの起動

#### ローカル開発(Dockerなし)

Redisが必要です:

```bash
# Terminal 1: Redis
docker run -p 6379:6379 redis:7-alpine

# Terminal 2: App
npm run dev

# Terminal 3: Worker (画像処理用)
npm run worker
```

#### Docker Compose

```bash
docker-compose up --build
```

これにより以下のサービスが起動します:
- **app**: メインアプリケーション (port 3000)
- **worker**: 画像処理ワーカー
- **redis**: ジョブキュー＆セッションストア (port 6379)
- **cantaloupe**: IIIF Image API サーバー (port 8182)

### 5. アプリケーションにアクセス

ブラウザで http://localhost:3000 を開きます。

## プロジェクト構造

```
iiif-depot/
├── src/
│   ├── index.tsx             # アプリエントリーポイント
│   ├── worker.ts             # ワーカーエントリーポイント
│   ├── config.ts             # 設定
│   ├── types.ts              # TypeScript型定義
│   ├── db/
│   │   ├── schema.ts         # データベーススキーマ
│   │   └── queries.ts        # データベースクエリ
│   ├── middleware/
│   │   ├── auth.ts           # 認証ミドルウェア
│   │   ├── session.ts        # セッション管理
│   │   ├── admin.tsx         # 管理者チェック
│   │   └── error.tsx         # エラーハンドリング
│   ├── routes/
│   │   ├── auth.tsx          # OAuth認証ルート
│   │   ├── profile.tsx       # プロフィールルート
│   │   ├── resources.tsx     # リソースCRUD
│   │   ├── browse.tsx        # 公開リソース閲覧
│   │   ├── iiif.tsx          # IIIFマニフェスト
│   │   ├── api.tsx           # APIエンドポイント
│   │   └── admin.tsx         # 管理者ルート
│   ├── services/
│   │   ├── oauth.ts          # Google OAuth サービス
│   │   ├── storage.ts        # ファイル操作
│   │   └── iiif.ts           # IIIFマニフェストビルダー
│   ├── jobs/
│   │   ├── queue.ts          # BullMQキュー設定
│   │   └── processors.ts     # 画像処理ロジック
│   ├── components/
│   │   ├── flash-message.tsx # フラッシュメッセージ
│   │   └── loading.tsx       # ローディング表示
│   ├── views/
│   │   ├── layout.tsx        # ベースレイアウト
│   │   ├── index.tsx         # ホームページ
│   │   ├── auth/             # 認証関連ビュー
│   │   ├── profile/          # プロフィール関連ビュー
│   │   ├── resources/        # リソース管理ビュー
│   │   ├── browse/           # 公開閲覧ビュー
│   │   ├── admin/            # 管理画面ビュー
│   │   └── errors/           # エラーページ
│   └── utils/
│       ├── logger.ts         # ロギング
│       └── validators.ts     # バリデーション
├── scripts/
│   └── init-db.ts            # DB初期化スクリプト
├── cantaloupe/
│   └── cantaloupe.properties # Cantaloupe設定
├── data/                     # ランタイムデータ(gitignore)
│   ├── db/                   # SQLiteデータベース
│   └── images/
│       ├── original/         # アップロード元画像
│       └── ptiff/            # Pyramid TIFF
├── docker-compose.yml
├── Dockerfile.app
├── Dockerfile.worker
└── README.md
```

## 実装状況

### ✅ 完了
- Phase 1: Project Setup & Infrastructure
- Phase 2: Database & Core Services
- Phase 3: Authentication (Google OAuth)
- Phase 4: User Profile Management
- Phase 5: IIIF Resource Upload & Management
- Phase 6: Image Processing Worker
- Phase 7: Job Progress Display
- Phase 8: IIIF Manifest Generation
- Phase 9: Public Resource Browsing
- Phase 10: Admin Features
- Phase 11: Cantaloupe Integration
- Phase 12: Frontend Polish & Error Handling

**進捗: 12/13フェーズ完了 (92%)**

すべてのコア機能が実装され、動作確認可能です!

### 🚧 残りの実装

#### Phase 13: Testing & Documentation (オプション)
- ユニットテスト
- 統合テスト
- APIドキュメント(OpenAPI/Swagger)
- デプロイガイド

## データベーススキーマ

### users
- Google OAuthユーザー情報
- ストレージクォータ管理
- 管理者フラグ

### iiif_resources
- IIIFリソースメタデータ
- ステータス(processing/ready/failed)
- 公開設定(public/private)

### images
- アップロードされた画像情報
- 元ファイルとPyramid TIFFのパス
- 処理ステータス
- ジョブID

### job_status
- BullMQジョブの進捗状況
- エラーメッセージ

## API エンドポイント

### 認証
- `GET /auth/login` - ログインページ
- `GET /auth/google` - Google OAuth開始
- `GET /auth/google/callback` - OAuth コールバック
- `POST /auth/logout` - ログアウト

### プロフィール
- `GET /profile` - プロフィール表示
- `GET /profile/edit` - プロフィール編集フォーム
- `POST /profile/edit` - プロフィール更新

### リソース管理
- `GET /resources` - 自分のリソース一覧
- `GET /resources/new` - アップロードフォーム
- `POST /resources` - リソース作成(ファイルアップロード)
- `GET /resources/:id` - リソース詳細
- `GET /resources/:id/progress` - アップロード進捗表示
- `GET /resources/:id/edit` - リソース編集フォーム
- `POST /resources/:id` - リソース更新
- `POST /resources/:id/delete` - リソース削除

### IIIF
- `GET /iiif/manifests/:id/manifest.json` - IIIF Presentation API v3 マニフェスト

### 公開リソース
- `GET /browse` - 公開リソース一覧(ページネーション付き)
- `GET /browse/:id` - 公開リソース詳細(Miradorビューアー埋め込み)

### 管理者
- `GET /admin/users` - ユーザー一覧
- `GET /admin/users/:id` - ユーザー詳細・編集
- `POST /admin/users/:id/quota` - ストレージクォータ変更
- `POST /admin/users/:id/admin` - 管理者権限トグル

### 内部API
- `GET /api/resources/:id/status` - リソースのジョブステータス取得

## 開発ガイド

### 画像処理フロー

1. ユーザーが画像をアップロード
2. ファイルを`data/images/original/`に保存
3. BullMQジョブをエンキュー
4. ワーカーがジョブを処理:
   - ImageMagickで Pyramid TIFF に変換
   - `data/images/ptiff/`に保存
   - 画像メタデータ(幅・高さ)を抽出
   - データベース更新
5. Cantaloupeが`data/images/ptiff/`から画像を配信

### ImageMagick コマンド例

```bash
# Pyramid TIFF変換
convert input.jpg \
  -define tiff:tile-geometry=256x256 \
  -compress lzw \
  'ptif:output.tif'

# 画像情報取得
identify -format "%w %h" input.jpg
```

## トラブルシューティング

### Google OAuth エラー
- Google Cloud Consoleで以下を確認:
  - OAuth 2.0クライアントIDが作成されているか
  - リダイレクトURIが正しく設定されているか
  - APIが有効になっているか(Google+ API)

### Redis接続エラー
- Redisが起動しているか確認: `docker ps | grep redis`
- 接続情報が正しいか確認: `REDIS_HOST`, `REDIS_PORT`

### Cantaloupe 起動エラー
- ボリュームマウントが正しいか確認
- Javaメモリ設定を確認(必要に応じて調整)

## ライセンス

MIT

## 開発者向けメモ

このプロジェクトは13のフェーズに分けて計画されています。現在Phase 1-4が完了しています。

残りのフェーズを実装する際は:
1. 実装計画 (`/Users/yuta/.claude/plans/mellow-skipping-kahn.md`) を参照
2. 各フェーズごとに実装・テスト
3. フェーズ間の依存関係に注意(特にPhase 5-7は連携が必要)

既存の`iiif_authoring`プロジェクトも参考になります:
- 画像処理ロジック
- IIIF manifest生成
- ファイルアップロード処理
