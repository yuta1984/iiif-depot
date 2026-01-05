# IIIF Depot クイックスタートガイド

## 🚀 5分で始める

### 1. Google OAuth設定 (必須)

1. https://console.cloud.google.com/ にアクセス
2. 新しいプロジェクト作成
3. 「APIとサービス」→「認証情報」→「+ 認証情報を作成」→「OAuth 2.0 クライアント ID」
4. アプリケーションの種類: **Webアプリケーション**
5. 承認済みのリダイレクトURI: `http://localhost:3000/auth/google/callback`
6. 作成後、クライアントIDとシークレットをコピー

### 2. 環境変数設定

`.env`ファイルを編集:

```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
SESSION_SECRET=any-random-string-here
ADMIN_EMAILS=your-email@gmail.com
```

### 3. 起動

#### 方法A: ローカル開発 (推奨)

```bash
# Terminal 1: Redis
docker run -p 6379:6379 redis:7-alpine

# Terminal 2: アプリ
npm run dev

# Terminal 3: ワーカー
npm run worker
```

#### 方法B: Docker Compose

```bash
docker-compose up --build
```

### 4. アクセス

http://localhost:3000

## 📸 使い方

### 初めてのアップロード

1. **ログイン**
   - 「ログイン」ボタンをクリック
   - Googleアカウントで認証

2. **アップロード**
   - ナビゲーションバーの「アップロード」をクリック
   - タイトルを入力 (例: "桜の写真集")
   - 説明を入力 (オプション)
   - 画像ファイルを選択 (JPEG/PNG/TIFF)
   - 「アップロード」ボタンをクリック

3. **進捗確認**
   - 自動的に進捗ページに移動
   - 画像処理が完了するまで待つ (数秒〜数十秒)
   - ページは3秒ごとに自動リロード

4. **閲覧**
   - 処理完了後、「リソースページへ戻る」をクリック
   - IIIFマニフェストURLをコピー
   - Mirador Viewerで表示

### 公開リソースを見る

1. ナビゲーションバーの「公開リソース」をクリック
2. 任意のリソースをクリック
3. 埋め込まれたMirador Viewerで画像を閲覧

## 🔍 トラブルシューティング

### ログインできない

- Google OAuthの設定を確認
- リダイレクトURIが正しいか確認
- ブラウザのコンソールでエラーを確認

### 画像処理が進まない

- ワーカーが起動しているか確認 (Terminal 3)
- ImageMagickがインストールされているか確認: `convert --version`
- Redisが起動しているか確認: `docker ps | grep redis`

### 画像が表示されない

- Cantaloupeが起動しているか確認 (Docker Composeの場合)
- ファイルが正しく変換されているか確認: `ls -la data/images/ptiff/`

## 📊 ストレージ管理

- デフォルト容量: 100MB
- 使用状況: プロフィールページで確認
- 容量超過: アップロード時にエラー表示

## 🎯 次のステップ

1. **プロフィール編集**
   - ナビゲーションバーの自分の名前をクリック
   - 「プロフィール」→「編集」

2. **リソース編集**
   - 「マイリソース」から任意のリソースを選択
   - 「編集」ボタンをクリック
   - タイトル、説明、公開設定を変更

3. **リソース削除**
   - リソース詳細ページで「削除」ボタンをクリック
   - 確認ダイアログで「削除する」をクリック

## 💡 ヒント

- **複数画像アップロード**: ファイル選択時に複数選択可能
- **非公開設定**: アップロード時に「非公開」を選択
- **IIIF URL**: マニフェストURLを他のIIIFビューアーで使用可能
- **管理者権限**: ADMIN_EMAILSに登録したメールアドレスで管理者に

## 🆘 ヘルプ

- README.md - 詳細な説明
- IMPLEMENTATION_STATUS.md - 実装状況
- COMPLETION_REPORT.md - 完了レポート

---

楽しんでください! 🎉
