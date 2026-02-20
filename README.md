# IIIF Depot

画像をアップロードするだけで IIIF マニフェストを自動生成・公開できるWebサービスです。

## できること

- **画像のアップロード**: JPEG・PNG・TIFFなどの画像ファイルを複数枚まとめてアップロード
- **IIIF自動変換**: アップロードされた画像を自動的に IIIF 対応形式 (Pyramid TIFF) に変換
- **マニフェスト生成**: IIIF Presentation API v3 準拠のマニフェストURLを自動発行
- **ビューアで閲覧**: 登録した画像をブラウザ上の IIIF ビューア (Mirador) で確認
- **公開・非公開設定**: リソースごとに公開範囲を設定可能
- **ストレージ管理**: 使用容量の確認と増量申請

## 使い方

### 1. ログイン

Google アカウントでログインします。

### 2. IIIF画像の作成

「マイIIIF画像」→「新規作成」から:

1. タイトル・説明などのメタデータを入力
2. 画像ファイルを選択（複数可）
3. アップロード後、自動的に変換処理が始まります（数分かかる場合があります）

### 3. マニフェストURLを取得

変換完了後、リソース詳細ページに IIIF マニフェスト URL が表示されます。このURLを他の IIIF 対応ツールやビューアで使用できます。

```
https://your-domain/iiif/manifests/{id}/manifest.json
```

### 4. 公開リソースを閲覧

「公開リソース」ページでは、公開設定されたすべてのリソースを閲覧できます。

---

## セルフホスティング

### 必要なもの

- Docker & Docker Compose
- Google Cloud の OAuth 2.0 クライアント ID・シークレット

### セットアップ

**1. リポジトリをクローン**

```bash
git clone https://github.com/yuta1984/iiif-depot.git
cd iiif-depot
```

**2. 環境変数ファイルを作成**

```bash
cp .env.example .env.prod
```

`.env.prod` を編集して以下の値を設定します:

| 変数名 | 説明 |
|--------|------|
| `BASE_URL` | サービスのURL（例: `https://your-domain.com`） |
| `GOOGLE_CLIENT_ID` | Google Cloud Console で取得した OAuth クライアントID |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console で取得した OAuth クライアントシークレット |
| `GOOGLE_REDIRECT_URI` | `{BASE_URL}/auth/google/callback` |
| `SESSION_SECRET` | ランダムな文字列（セッション暗号化に使用） |
| `ADMIN_EMAILS` | 管理者権限を付与するメールアドレス（カンマ区切り） |
| `CANTALOUPE_PUBLIC_URL` | Cantaloupe の公開URL（画像配信用） |

**Google OAuth の設定**

[Google Cloud Console](https://console.cloud.google.com/) で:
1. 「APIとサービス」→「認証情報」→「OAuth 2.0 クライアント ID」を作成
2. 承認済みリダイレクト URI に `{BASE_URL}/auth/google/callback` を追加

**3. 起動**

```bash
docker compose up -d
```

**4. 動作確認**

ブラウザで `http://localhost:3000` を開きます（または設定した `BASE_URL`）。

---

## 技術構成

- **Backend**: Node.js + TypeScript + [Hono](https://hono.dev/)
- **Database**: SQLite
- **Job Queue**: BullMQ + Redis
- **IIIF Image Server**: [Cantaloupe](https://cantaloupe-project.github.io/)
- **IIIF Viewer**: [Mirador](https://projectmirador.org/)
- **Image Processing**: ImageMagick (Pyramid TIFF 変換)

## ライセンス

MIT
