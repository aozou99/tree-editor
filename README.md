# Tree Editor Next

階層構造データを視覚的に編集・管理するための高機能 Web アプリケーション

![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.1-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat-square&logo=cloudflare)

## 🌟 特徴

- **直感的な操作**: ドラッグ&ドロップで簡単にノードを移動・整理
- **カスタマイズ可能**: ノードタイプとカスタムフィールドで柔軟な構造を作成
- **多言語対応**: 日本語と英語に対応
- **クラウド同期**: Google アカウントでログインしてデータをクラウドに保存
- **共有機能**: 作成したツリーを他のユーザーと共有
- **高速**: Cloudflare Workers によるエッジコンピューティング
- **データ圧縮**: 効率的なストレージ使用

## 🚀 クイックスタート

### 前提条件

- Node.js 18.0 以上
- pnpm 8.0 以上
- Cloudflare アカウント（本番デプロイ用）

### 開発環境のセットアップ

1. リポジトリをクローン

```bash
git clone https://github.com/yourusername/tree-editor-next.git
cd tree-editor-next
```

2. 依存関係をインストール

```bash
pnpm install
```

3. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local`ファイルを編集して必要な環境変数を設定：

```env
# Google OAuth
OIDC_AUTH_ISSUER=https://accounts.google.com
OIDC_AUTH_CLIENT_ID=your-google-client-id
OIDC_AUTH_CLIENT_SECRET=your-google-client-secret
OIDC_AUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback

# アプリケーション設定
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. 開発サーバーを起動

```bash
pnpm dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## 📦 デプロイ

### Cloudflare へのデプロイ

1. Cloudflare の設定を更新

```bash
# wrangler.jsonc を編集してデータベースIDなどを設定
```

2. データベースのマイグレーション

```bash
pnpm db:generate
pnpm db:migrate:local
```

3. ビルドとデプロイ

```bash
pnpm deploy
```

## 🛠️ 開発コマンド

```bash
# 開発
pnpm dev                    # 開発サーバーを起動

# ビルド
pnpm build                  # Next.jsアプリをビルド
pnpm preview               # Cloudflareでプレビュー

# データベース
pnpm db:generate           # Drizzleマイグレーションを生成
pnpm db:migrate:local      # ローカルD1にマイグレーションを適用
pnpm db:studio             # Drizzle Studioを起動

# その他
pnpm lint                  # ESLintでコードをチェック
pnpm cf-typegen           # Cloudflare環境の型を生成
```

## 📚 使い方

### 基本操作

1. **ノードの作成**: 「+」ボタンをクリックするか、右クリックメニューから作成
2. **ノードの編集**: ノードをクリックして詳細を編集
3. **ドラッグ&ドロップ**: ノードをドラッグして階層を変更
4. **検索**: 検索バーでノードを検索（名前、タイプ、フィールド値で検索可能）
5. **共有**: ツリーメニューから「共有」を選択してリンクを生成

### ノードタイプとカスタムフィールド

ノードタイプを定義して、各ノードに独自のフィールドを追加できます：

- テキストフィールド
- テキストエリア（長文）
- リンク（URL）
- YouTube 動画
- 画像
- 音声ファイル

### データの保存

- **未ログイン時**: ローカルストレージに自動保存
- **ログイン時**: クラウドに自動保存（数秒ごと）

## 🏗️ アーキテクチャ

詳細なアーキテクチャについては [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。

### 技術スタック

- **フロントエンド**: Next.js 15, React 19, Tailwind CSS, shadcn/ui
- **バックエンド**: Hono, Cloudflare Workers
- **データベース**: Cloudflare D1 (SQLite), R2 (オブジェクトストレージ)
- **認証**: Google OAuth (OIDC)

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更を行う場合は、まず issue を作成して変更内容について議論してください。

1. プロジェクトをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは MIT ライセンスの下でライセンスされています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🙏 謝辞

- [Next.js](https://nextjs.org/) - React フレームワーク
- [Cloudflare](https://www.cloudflare.com/) - エッジコンピューティングプラットフォーム
- [shadcn/ui](https://ui.shadcn.com/) - UI コンポーネント
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM

## 📞 サポート

質問や問題がある場合は、[Issues](https://github.com/aozou99/tree-editor)でお知らせください。
