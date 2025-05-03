# Cloudflare Workers向けアーキテクチャ設計

## フレームワーク選択: Hono + React

現在のNext.jsベースの実装からCloudflare Workersに最適化されたアーキテクチャへの移行案です。主要なフレームワークとしてHonoを採用し、UIライブラリとしてReactを継続使用します。

### 選定理由

1. **Honoの利点**
   - Cloudflare Workers向けに設計された超軽量Webフレームワーク
   - 実行時間制限（50ms）に対応する高速な処理
   - JSXサポートによりReactコンポーネントの互換性を維持
   - ミドルウェア、ルーティング、APIハンドラの統合

2. **React継続使用の理由**
   - 既存コンポーネントの大部分を再利用可能
   - 開発者にとって馴染みのある環境を維持
   - 豊富なエコシステムの活用

## アーキテクチャ概要

```
クライアント (React) ←→ Hono (API層) ←→ ストレージ層 (R2/D1)
```

### 主要コンポーネント

1. **フロントエンド (React SPA)**
   - クライアントサイドレンダリング中心
   - ツリーエディタのUIコンポーネント
   - 状態管理（Zustand/Jotai推奨）

2. **API層 (Hono)**
   - RESTful APIエンドポイント
   - JWT認証ミドルウェア
   - エラーハンドリング

3. **データ層**
   - R2: JSONデータ、メディアファイル
   - D1: ユーザー情報、メタデータ、検索インデックス

## ファイル構成案

```
/
├── public/          // 静的アセット
├── src/
│   ├── components/  // Reactコンポーネント（既存のまま）
│   ├── hooks/       // Reactフック（既存のまま）
│   ├── routes/      // Honoのルーティング
│   │   ├── api/     // APIエンドポイント
│   │   └── pages/   // ページルート（HTML返却）
│   ├── middleware/  // 認証など共通ミドルウェア
│   ├── models/      // データモデル定義
│   ├── services/    // R2, D1アクセス層
│   └── utils/       // ユーティリティ関数
└── worker.ts        // エントリーポイント
```

## データフロー設計

### ツリーデータの読み込み

1. **効率的な読み込み戦略**
   ```typescript
   // routes/api/trees/[id].ts
   app.get('/api/trees/:id', async (c) => {
     const { id } = c.req.param();
     const { depth = '1' } = c.req.query();
     
     // R2からツリーデータを取得（最適化: 指定された深さまでのノードのみ取得）
     const treeData = await treeService.getTree(id, parseInt(depth));
     
     return c.json(treeData);
   });
   
   // クライアント側での使用例 (SWRやReact Query)
   const { data: treeData, error } = useSWR(
     `/api/trees/${treeId}?depth=1`, 
     fetcher
   );
   ```

2. **部分的なツリーロード**
   ```typescript
   // routes/api/trees/[id]/nodes/[nodeId].ts
   app.get('/api/trees/:id/nodes/:nodeId', async (c) => {
     const { id, nodeId } = c.req.param();
     
     // 特定のノードとその直接の子のみを取得
     const nodeData = await treeService.getNode(id, nodeId);
     
     return c.json(nodeData);
   });
   ```

### 認証とセキュリティ

```typescript
// middleware/auth.ts
export const authMiddleware = async (c: Context, next: Next) => {
  const token = c.req.header('Authorization')?.split(' ')[1];
  
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const decoded = await verifyJWT(token);
    c.set('user', decoded);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// 使用例
app.use('/api/trees/*', authMiddleware);
app.get('/api/trees', async (c) => {
  const user = c.get('user');
  const trees = await treeService.getTreesByUser(user.id);
  return c.json(trees);
});
```

## パフォーマンス最適化戦略

1. **レンダリング最適化**
   - サーバーは軽量なJSONデータのみを返す
   - クライアントでレンダリング処理を行う
   - 大規模ツリーデータは仮想化リスト技術を採用（react-window/react-virtualized）

2. **キャッシング戦略**
   - 公開ノードはCloudflare CacheでHTTPキャッシュ
   - 頻繁にアクセスされるデータはKVにキャッシュ
   ```typescript
   app.get('/api/public/trees/:id', async (c) => {
     const { id } = c.req.param();
     
     // KVからキャッシュ取得試行
     const cached = await c.env.TREE_CACHE.get(`tree:${id}`);
     if (cached) return c.json(JSON.parse(cached));
     
     // R2から取得
     const tree = await treeService.getPublicTree(id);
     
     // KVにキャッシュ保存（TTL 1時間）
     await c.env.TREE_CACHE.put(`tree:${id}`, JSON.stringify(tree), { expirationTtl: 3600 });
     
     return c.json(tree);
   });
   ```

3. **ストリーミングレスポンス**
   - 大規模ツリーデータはチャンク分割してストリーミング
   ```typescript
   app.get('/api/trees/:id/stream', async (c) => {
     const { id } = c.req.param();
     
     // ストリームレスポンス設定
     c.header('Content-Type', 'text/event-stream');
     c.header('Cache-Control', 'no-cache');
     c.header('Connection', 'keep-alive');
     
     const stream = new TransformStream();
     const writer = stream.writable.getWriter();
     
     // バックグラウンド処理でデータをストリーミング
     treeService.streamTree(id, async (chunk) => {
       await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
     }).finally(() => writer.close());
     
     return c.body(stream.readable);
   });
   ```

## 移行戦略

1. **段階的な移行**
   - 既存のReactコンポーネントを保持
   - まずAPIルートをHonoに移行
   - 次にページルートを移行

2. **デプロイ戦略**
   - Cloudflare Pages + Workersの組み合わせ
   - 静的アセットはPages、APIはWorkersでホスト

## 技術スタック詳細

```json
{
  "dependencies": {
    "hono": "^3.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "swr": "^2.2.0",
    "zod": "^3.21.0",
    "zustand": "^4.3.0",
    "react-window": "^1.8.9",
    "@cloudflare/kv-asset-handler": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^4.4.0",
    "wrangler": "^3.0.0"
  }
}
```

## まとめ

Honoを中心としたアーキテクチャへの移行により、以下のメリットが期待できます:

1. **パフォーマンス向上**: Cloudflare Workersの制限内で最大限のパフォーマンス発揮
2. **コスト効率**: 効率的なリソース利用によるコスト削減
3. **コード再利用**: 既存のReactコンポーネントの多くを再利用可能
4. **スケーラビリティ**: エッジでの分散実行によるグローバルなスケーリング

このアーキテクチャは、特に大規模なツリー構造データを扱うTreeEditorアプリケーションに適しており、MVPフェーズからのスムーズな成長を支えます。