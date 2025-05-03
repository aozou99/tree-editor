# TreeEditorアプリ移行アクションプラン

このドキュメントは、TreeEditorアプリをNext.jsからCloudflare Workers + Honoへ移行するための具体的なアクションプランを提供します。各ステップは独立して実行可能であり、優先順位順に記載されています。

## フェーズ1: 開発環境のセットアップ

### Action 1: Cloudflareプロジェクトの初期化
**目標**: Cloudflare Workersプロジェクト基盤の作成

1. Cloudflareアカウントのセットアップ（既存アカウントがある場合はスキップ）
2. Wranglerのインストール
   ```bash
   pnpm add -g wrangler
   ```
3. Wranglerでプロジェクト初期化
   ```bash
   wrangler init tree-editor-api
   ```
4. 必要なCloudflareサービスを有効化
   - R2バケットの作成: `wrangler r2 bucket create tree-editor-data`
   - D1データベースの作成: `wrangler d1 create tree-editor-db`

### Action 2: 開発依存関係のセットアップ
**目標**: プロジェクトの主要な依存関係をインストール

```bash
cd tree-editor-api
pnpm add hono @hono/zod-validator zod
pnpm add -D typescript @types/node @cloudflare/workers-types
```

### Action 3: プロジェクト構成の設定
**目標**: 基本的なファイル構造とTypeScript設定

1. TypeScript設定ファイル作成
   ```bash
   touch tsconfig.json
   ```
2. 推奨フォルダ構造の作成
   ```bash
   mkdir -p src/{routes/{api,pages},middleware,models,services,utils}
   ```

## フェーズ2: API実装 - 基盤構築

### Action 4: APIの基本構造作成
**目標**: Honoを使用した基本APIルーティング構造の作成

1. エントリーポイントの作成 (`src/index.ts`):
   ```typescript
   import { Hono } from 'hono';
   import { cors } from 'hono/cors';
   import { apiRoutes } from './routes/api';
   import { pageRoutes } from './routes/pages';

   type Bindings = {
     TREE_EDITOR_DB: D1Database;
     TREE_EDITOR_DATA: R2Bucket;
   };

   const app = new Hono<{ Bindings: Bindings }>();

   // CORSの設定
   app.use('*', cors({
     origin: ['http://localhost:3000', 'https://tree-editor.your-domain.com'],
     allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allowHeaders: ['Content-Type', 'Authorization'],
     credentials: true,
   }));

   // APIルートのマウント
   app.route('/api', apiRoutes);

   // ページルートのマウント (SPAサポート)
   app.route('/', pageRoutes);

   export default app;
   ```

2. APIルートの基本構造 (`src/routes/api/index.ts`):
   ```typescript
   import { Hono } from 'hono';
   import { treeRoutes } from './trees';
   import { userRoutes } from './users';
   import { authRoutes } from './auth';

   export const apiRoutes = new Hono();

   apiRoutes.route('/trees', treeRoutes);
   apiRoutes.route('/users', userRoutes);
   apiRoutes.route('/auth', authRoutes);

   // ヘルスチェックエンドポイント
   apiRoutes.get('/health', (c) => c.json({ status: 'ok' }));
   ```

### Action 5: 認証ミドルウェアの実装
**目標**: JWT認証の基本的な実装

1. 認証用の依存関係を追加
   ```bash
   pnpm add hono @hono/jwt-auth
   ```

2. 認証ミドルウェアの作成 (`src/middleware/auth.ts`):
   ```typescript
   import { Context, Next } from 'hono';
   import { verify } from 'hono/jwt';

   export const authMiddleware = async (c: Context, next: Next) => {
     const authHeader = c.req.header('Authorization');
     if (!authHeader || !authHeader.startsWith('Bearer ')) {
       return c.json({ error: 'Unauthorized' }, 401);
     }

     const token = authHeader.split(' ')[1];
     try {
       const secret = c.env.JWT_SECRET;
       const payload = await verify(token, secret);
       c.set('user', payload);
       await next();
     } catch (err) {
       return c.json({ error: 'Invalid token' }, 401);
     }
   };
   ```

### Action 6: データモデルの定義
**目標**: アプリケーションの基本データモデルを定義

1. ツリーノードモデルの定義 (`src/models/tree.ts`):
   ```typescript
   import { z } from 'zod';

   // 現在のモデルからの移行
   export const TreeNodeSchema = z.object({
     id: z.string(),
     parentId: z.string().nullable(),
     title: z.string(),
     type: z.string(),
     description: z.string().optional(),
     fields: z.record(z.any()).optional(),
     children: z.array(z.lazy(() => TreeNodeSchema)).optional(),
     collapsed: z.boolean().optional(),
     icon: z.string().optional(),
   });

   export const WorkspaceSchema = z.object({
     id: z.string(),
     name: z.string(),
     createdAt: z.string(),
     updatedAt: z.string(),
     tree: z.array(TreeNodeSchema),
     nodeTypes: z.array(z.object({
       id: z.string(),
       name: z.string(),
       fields: z.array(z.object({
         id: z.string(),
         name: z.string(),
         type: z.string(),
         required: z.boolean().optional(),
       })),
     })),
     treeTitle: z.string(),
     publishSettings: z.object({
       isPublished: z.boolean(),
       publishedAt: z.string().optional(),
       visibility: z.enum(['public', 'unlisted', 'private']),
       accessCode: z.string().optional(),
       shareableLink: z.string().optional(),
       viewCount: z.number(),
     }).optional(),
     ownerId: z.string(),
     collaborators: z.array(z.string()).optional(),
   });

   export type TreeNode = z.infer<typeof TreeNodeSchema>;
   export type Workspace = z.infer<typeof WorkspaceSchema>;
   ```

2. ユーザーモデルの定義 (`src/models/user.ts`):
   ```typescript
   import { z } from 'zod';

   export const UserSchema = z.object({
     id: z.string(),
     name: z.string(),
     email: z.string().email(),
     avatar: z.string().optional(),
     publishedWorkspaces: z.array(z.string()).optional(),
   });

   export type User = z.infer<typeof UserSchema>;
   ```

## フェーズ3: ストレージサービスの実装

### Action 7: R2サービス層の実装
**目標**: ツリーデータをR2に保存するサービスの作成

1. R2サービスの実装 (`src/services/storage.ts`):
   ```typescript
   import { Context } from 'hono';
   import { Workspace, TreeNode } from '../models/tree';

   export class StorageService {
     constructor(private r2: R2Bucket) {}

     async saveWorkspace(workspaceId: string, workspace: Workspace): Promise<void> {
       await this.r2.put(`workspaces/${workspaceId}.json`, JSON.stringify(workspace));
     }

     async getWorkspace(workspaceId: string): Promise<Workspace | null> {
       const object = await this.r2.get(`workspaces/${workspaceId}.json`);
       if (!object) return null;
       
       const data = await object.json();
       return data as Workspace;
     }

     async deleteWorkspace(workspaceId: string): Promise<void> {
       await this.r2.delete(`workspaces/${workspaceId}.json`);
     }

     async saveNode(workspaceId: string, nodeId: string, node: TreeNode): Promise<void> {
       await this.r2.put(`workspaces/${workspaceId}/nodes/${nodeId}.json`, JSON.stringify(node));
     }
     
     // Partial tree retrieval for optimized loading
     async getNodeWithChildren(workspaceId: string, nodeId: string): Promise<TreeNode | null> {
       const object = await this.r2.get(`workspaces/${workspaceId}/nodes/${nodeId}.json`);
       if (!object) return null;
       
       const data = await object.json();
       return data as TreeNode;
     }
   }

   // Contextからサービスインスタンスを取得するヘルパー
   export function getStorageService(c: Context): StorageService {
     return new StorageService(c.env.TREE_EDITOR_DATA);
   }
   ```

### Action 8: D1データベース層の実装
**目標**: メタデータと検索インデックスをD1に保存する機能実装

1. データベースマイグレーションの作成
   ```bash
   mkdir -p migrations
   touch migrations/0000_initial.sql
   ```

2. マイグレーションファイルの内容 (`migrations/0000_initial.sql`):
   ```sql
   -- Users table
   CREATE TABLE users (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     email TEXT UNIQUE NOT NULL,
     avatar_url TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Workspaces table
   CREATE TABLE workspaces (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     owner_id TEXT NOT NULL,
     tree_title TEXT NOT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     r2_path TEXT NOT NULL,
     is_published BOOLEAN DEFAULT FALSE,
     published_at TIMESTAMP,
     visibility TEXT CHECK(visibility IN ('public', 'unlisted', 'private')) DEFAULT 'private',
     access_code TEXT,
     shareable_link TEXT,
     view_count INTEGER DEFAULT 0,
     FOREIGN KEY (owner_id) REFERENCES users(id)
   );

   -- Workspace collaborators
   CREATE TABLE collaborators (
     workspace_id TEXT NOT NULL,
     user_id TEXT NOT NULL,
     role TEXT CHECK(role IN ('viewer', 'editor', 'admin')) DEFAULT 'viewer',
     joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (workspace_id, user_id),
     FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
   );

   -- Search index
   CREATE TABLE search_index (
     id TEXT PRIMARY KEY,
     workspace_id TEXT NOT NULL,
     node_id TEXT NOT NULL,
     title TEXT NOT NULL,
     content TEXT,
     type TEXT,
     tags TEXT,
     FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
   );

   -- Create indexes
   CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);
   CREATE INDEX idx_workspaces_published ON workspaces(is_published, visibility);
   CREATE INDEX idx_search_workspace ON search_index(workspace_id);
   CREATE INDEX idx_search_content ON search_index(title, content);
   ```

3. D1サービスの実装 (`src/services/database.ts`):
   ```typescript
   import { Context } from 'hono';
   import { User } from '../models/user';
   import { Workspace } from '../models/tree';

   export class DatabaseService {
     constructor(private db: D1Database) {}

     // ユーザー管理
     async createUser(user: User): Promise<void> {
       await this.db.prepare(
         `INSERT INTO users (id, name, email, avatar_url) VALUES (?, ?, ?, ?)`
       ).bind(user.id, user.name, user.email, user.avatar || null).run();
     }

     async getUserById(userId: string): Promise<User | null> {
       const result = await this.db.prepare(
         `SELECT id, name, email, avatar_url as avatar FROM users WHERE id = ?`
       ).bind(userId).first();
       
       return result as User | null;
     }

     // ワークスペース管理
     async createWorkspaceMetadata(workspace: Workspace): Promise<void> {
       await this.db.prepare(
         `INSERT INTO workspaces (
           id, name, owner_id, tree_title, r2_path,
           is_published, visibility
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`
       ).bind(
         workspace.id,
         workspace.name,
         workspace.ownerId,
         workspace.treeTitle,
         `workspaces/${workspace.id}.json`,
         workspace.publishSettings?.isPublished || false,
         workspace.publishSettings?.visibility || 'private'
       ).run();
     }

     async listUserWorkspaces(userId: string): Promise<Array<{ id: string, name: string, treeTitle: string, updatedAt: string }>> {
       const results = await this.db.prepare(
         `SELECT id, name, tree_title as treeTitle, updated_at as updatedAt
          FROM workspaces WHERE owner_id = ? ORDER BY updated_at DESC`
       ).bind(userId).all();
       
       return results.results as any[];
     }

     async getPublicWorkspaces(limit = 20, offset = 0): Promise<Array<{ id: string, name: string, treeTitle: string, ownerName: string }>> {
       const results = await this.db.prepare(
         `SELECT w.id, w.name, w.tree_title as treeTitle, u.name as ownerName
          FROM workspaces w
          JOIN users u ON w.owner_id = u.id
          WHERE w.is_published = true AND w.visibility = 'public'
          ORDER BY w.view_count DESC
          LIMIT ? OFFSET ?`
       ).bind(limit, offset).all();
       
       return results.results as any[];
     }

     async incrementViewCount(workspaceId: string): Promise<void> {
       await this.db.prepare(
         `UPDATE workspaces SET view_count = view_count + 1 WHERE id = ?`
       ).bind(workspaceId).run();
     }

     // 検索機能
     async indexNodeForSearch(
       workspaceId: string, 
       nodeId: string, 
       title: string, 
       content: string, 
       type: string, 
       tags?: string
     ): Promise<void> {
       const id = `${workspaceId}_${nodeId}`;
       
       await this.db.prepare(
         `INSERT OR REPLACE INTO search_index (id, workspace_id, node_id, title, content, type, tags)
          VALUES (?, ?, ?, ?, ?, ?, ?)`
       ).bind(id, workspaceId, nodeId, title, content, type, tags || null).run();
     }

     async searchPublicNodes(query: string, limit = 20): Promise<any[]> {
       const results = await this.db.prepare(
         `SELECT si.*, w.name as workspace_name, u.name as owner_name
          FROM search_index si
          JOIN workspaces w ON si.workspace_id = w.id
          JOIN users u ON w.owner_id = u.id
          WHERE w.is_published = true AND w.visibility = 'public'
          AND (si.title LIKE ? OR si.content LIKE ? OR si.tags LIKE ?)
          LIMIT ?`
       ).bind(`%${query}%`, `%${query}%`, `%${query}%`, limit).all();
       
       return results.results;
     }
   }

   // Contextからサービスインスタンスを取得するヘルパー
   export function getDatabaseService(c: Context): DatabaseService {
     return new DatabaseService(c.env.TREE_EDITOR_DB);
   }
   ```

## フェーズ4: APIエンドポイントの実装

### Action 9: ツリー操作APIの実装
**目標**: ツリーデータにアクセスするためのエンドポイント作成

1. ツリールートの実装 (`src/routes/api/trees/index.ts`):
   ```typescript
   import { Hono } from 'hono';
   import { zValidator } from '@hono/zod-validator';
   import { z } from 'zod';
   import { authMiddleware } from '../../../middleware/auth';
   import { getDatabaseService } from '../../../services/database';
   import { getStorageService } from '../../../services/storage';
   import { WorkspaceSchema } from '../../../models/tree';

   export const treeRoutes = new Hono();

   // 認証必須のエンドポイント
   treeRoutes.use('/*', authMiddleware);

   // ユーザーのツリー一覧取得
   treeRoutes.get('/', async (c) => {
     const user = c.get('user');
     const dbService = getDatabaseService(c);
     
     const workspaces = await dbService.listUserWorkspaces(user.id);
     return c.json(workspaces);
   });

   // 新規ワークスペース作成
   const CreateWorkspaceSchema = z.object({
     name: z.string().min(1),
     treeTitle: z.string().min(1),
     tree: z.array(WorkspaceSchema.shape.tree.element)
   });

   treeRoutes.post('/', zValidator('json', CreateWorkspaceSchema), async (c) => {
     const user = c.get('user');
     const data = c.req.valid('json');
     
     const dbService = getDatabaseService(c);
     const storageService = getStorageService(c);
     
     const workspaceId = crypto.randomUUID();
     const workspace = {
       id: workspaceId,
       name: data.name,
       treeTitle: data.treeTitle,
       tree: data.tree,
       nodeTypes: [],
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
       ownerId: user.id,
       publishSettings: {
         isPublished: false,
         visibility: 'private',
         viewCount: 0
       }
     };
     
     // R2とD1に保存
     await storageService.saveWorkspace(workspaceId, workspace);
     await dbService.createWorkspaceMetadata(workspace);
     
     return c.json({ id: workspaceId }, 201);
   });

   // 特定のツリー取得
   treeRoutes.get('/:id', async (c) => {
     const workspaceId = c.req.param('id');
     const user = c.get('user');
     const { depth = '1' } = c.req.query();
     
     const dbService = getDatabaseService(c);
     const storageService = getStorageService(c);
     
     // 権限チェックを実装予定
     
     const workspace = await storageService.getWorkspace(workspaceId);
     if (!workspace) {
       return c.json({ error: 'Workspace not found' }, 404);
     }
     
     return c.json(workspace);
   });

   // ツリー更新
   treeRoutes.put('/:id', zValidator('json', WorkspaceSchema), async (c) => {
     const workspaceId = c.req.param('id');
     const user = c.get('user');
     const data = c.req.valid('json');
     
     // 権限チェックを実装予定
     
     const storageService = getStorageService(c);
     data.updatedAt = new Date().toISOString();
     
     await storageService.saveWorkspace(workspaceId, data);
     
     return c.json({ success: true });
   });

   // 特定のノードとその子ノード取得 (部分的ロード用)
   treeRoutes.get('/:id/nodes/:nodeId', async (c) => {
     const { id, nodeId } = c.req.param();
     
     const storageService = getStorageService(c);
     const node = await storageService.getNodeWithChildren(id, nodeId);
     
     if (!node) {
       return c.json({ error: 'Node not found' }, 404);
     }
     
     return c.json(node);
   });
   ```

### Action 10: 公開・閲覧APIの実装
**目標**: 公開と非公開のツリーを管理するためのエンドポイント実装

1. 公開管理APIの実装 (`src/routes/api/trees/publish.ts`):
   ```typescript
   import { Hono } from 'hono';
   import { zValidator } from '@hono/zod-validator';
   import { z } from 'zod';
   import { authMiddleware } from '../../../middleware/auth';
   import { getDatabaseService } from '../../../services/database';
   import { getStorageService } from '../../../services/storage';

   export const publishRoutes = new Hono();

   // ほとんどのエンドポイントに認証必須
   publishRoutes.use('/*', authMiddleware);

   // ワークスペース公開設定の更新
   const PublishSettingsSchema = z.object({
     isPublished: z.boolean(),
     visibility: z.enum(['public', 'unlisted', 'private']),
     accessCode: z.string().optional()
   });

   publishRoutes.put('/:id/settings', zValidator('json', PublishSettingsSchema), async (c) => {
     const workspaceId = c.req.param('id');
     const settings = c.req.valid('json');
     const user = c.get('user');
     
     const dbService = getDatabaseService(c);
     const storageService = getStorageService(c);
     
     // ワークスペース取得・所有権チェック（実装予定）
     
     const workspace = await storageService.getWorkspace(workspaceId);
     if (!workspace) {
       return c.json({ error: 'Workspace not found' }, 404);
     }
     
     // 公開設定の更新
     workspace.publishSettings = {
       ...workspace.publishSettings,
       ...settings,
       publishedAt: settings.isPublished ? new Date().toISOString() : workspace.publishSettings?.publishedAt,
       viewCount: workspace.publishSettings?.viewCount || 0
     };
     
     // 共有リンクの生成
     if (settings.isPublished) {
       const shareId = crypto.randomUUID().slice(0, 8);
       workspace.publishSettings.shareableLink = `/view/${workspaceId}?s=${shareId}`;
     }
     
     await storageService.saveWorkspace(workspaceId, workspace);
     
     // D1のメタデータも更新
     await c.env.TREE_EDITOR_DB.prepare(
       `UPDATE workspaces SET 
          is_published = ?,
          visibility = ?,
          access_code = ?,
          published_at = ?,
          shareable_link = ?
        WHERE id = ?`
     ).bind(
       settings.isPublished,
       settings.visibility,
       settings.accessCode || null,
       workspace.publishSettings.publishedAt || null,
       workspace.publishSettings.shareableLink || null,
       workspaceId
     ).run();
     
     return c.json({ success: true, shareableLink: workspace.publishSettings.shareableLink });
   });

   // 公開ワークスペース一覧（認証不要）
   publishRoutes.get('/public', async (c) => {
     const { limit = '20', offset = '0' } = c.req.query();
     const dbService = getDatabaseService(c);
     
     const workspaces = await dbService.getPublicWorkspaces(
       parseInt(limit), 
       parseInt(offset)
     );
     
     return c.json(workspaces);
   });

   // 公開ワークスペース閲覧（認証不要・公開設定に応じる）
   publishRoutes.get('/:id/view', async (c) => {
     const workspaceId = c.req.param('id');
     const { code } = c.req.query();
     
     const dbService = getDatabaseService(c);
     const storageService = getStorageService(c);
     
     // 閲覧数インクリメント
     await dbService.incrementViewCount(workspaceId);
     
     // データ取得
     const workspace = await storageService.getWorkspace(workspaceId);
     if (!workspace) {
       return c.json({ error: 'Workspace not found' }, 404);
     }
     
     // 公開設定チェック
     if (!workspace.publishSettings?.isPublished) {
       return c.json({ error: 'This workspace is not published' }, 403);
     }
     
     // アクセスコードチェック
     if (workspace.publishSettings.visibility === 'private') {
       if (workspace.publishSettings.accessCode && workspace.publishSettings.accessCode !== code) {
         return c.json({ error: 'Invalid access code' }, 403);
       }
     }
     
     return c.json(workspace);
   });
   ```

### Action 11: 検索APIの実装
**目標**: ツリーデータの検索エンドポイント実装

1. 検索APIの実装 (`src/routes/api/search.ts`):
   ```typescript
   import { Hono } from 'hono';
   import { getDatabaseService } from '../../services/database';

   export const searchRoutes = new Hono();

   // 公開ノード検索（認証不要）
   searchRoutes.get('/public', async (c) => {
     const { q, limit = '20' } = c.req.query();
     if (!q) return c.json({ results: [] });
     
     const dbService = getDatabaseService(c);
     const results = await dbService.searchPublicNodes(q, parseInt(limit));
     
     return c.json({ results });
   });

   // 認証済みユーザーの検索（実装予定）
   ```

## フェーズ5: フロントエンド連携

### Action 12: SPAサポートの実装
**目標**: Cloudflare Pagesでフロントエンドを提供するための準備

1. SPAサポートのページルートの実装 (`src/routes/pages/index.ts`):
   ```typescript
   import { Hono } from 'hono';
   import { serveStatic } from 'hono/cloudflare-workers';

   export const pageRoutes = new Hono();

   // 静的アセット（CSSやJSファイル）の提供
   pageRoutes.get('/static/*', serveStatic({ root: './' }));

   // SPAのための全てのルートをindex.htmlにリダイレクト
   pageRoutes.get('*', async (c) => {
     return c.html(`
       <!DOCTYPE html>
       <html>
         <head>
           <meta charset="utf-8" />
           <meta name="viewport" content="width=device-width, initial-scale=1.0" />
           <title>Tree Editor</title>
           <link rel="stylesheet" href="/static/index.css" />
         </head>
         <body>
           <div id="app"></div>
           <script type="module" src="/static/index.js"></script>
         </body>
       </html>
     `);
   });
   ```

### Action 13: Cloudflare設定の完了
**目標**: Workers、R2、D1の連携設定

1. Wrangler設定ファイルの作成 (`wrangler.toml`):
   ```toml
   name = "tree-editor-api"
   main = "src/index.ts"
   compatibility_date = "2023-01-01"

   # D1データベース
   [[d1_databases]]
   binding = "TREE_EDITOR_DB"
   database_name = "tree-editor-db"
   database_id = "<YOUR_DATABASE_ID>" # Cloudflareダッシュボードから取得

   # R2ストレージ
   [[r2_buckets]]
   binding = "TREE_EDITOR_DATA"
   bucket_name = "tree-editor-data"

   # 環境変数
   [vars]
   JWT_SECRET = "<YOUR_SECRET_KEY>" # 本番環境ではSecrets管理を推奨

   # 開発環境設定
   [env.dev]
   # ...
   ```

## フェーズ6: クライアントサイド対応

### Action 14: APIクライアントの実装
**目標**: フロントエンドからCloudflare APIを呼び出す機能実装

1. APIクライアントの実装 (クライアントサイドコード):
   ```typescript
   // src/utils/api-client.ts
   import useSWR from 'swr';

   const API_BASE_URL = process.env.NODE_ENV === 'production' 
     ? 'https://api.tree-editor.your-domain.com'
     : 'http://localhost:8787';

   // 認証トークン取得
   const getToken = () => {
     return localStorage.getItem('auth_token');
   };

   // APIリクエスト送信
   export const fetcher = async (url: string) => {
     const token = getToken();
     const headers: Record<string, string> = {
       'Content-Type': 'application/json'
     };
     
     if (token) {
       headers['Authorization'] = `Bearer ${token}`;
     }
     
     const response = await fetch(`${API_BASE_URL}${url}`, { headers });
     
     if (!response.ok) {
       throw new Error('API request failed');
     }
     
     return response.json();
   };

   // データ取得フック
   export function useWorkspaces() {
     return useSWR('/api/trees', fetcher);
   }

   export function useWorkspace(id: string) {
     return useSWR(id ? `/api/trees/${id}` : null, fetcher);
   }

   export function usePublicWorkspaces() {
     return useSWR('/api/trees/publish/public', fetcher);
   }

   // データ更新関数
   export const api = {
     // ワークスペース操作
     createWorkspace: async (data: any) => {
       const token = getToken();
       const response = await fetch(`${API_BASE_URL}/api/trees`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify(data)
       });
       
       if (!response.ok) {
         throw new Error('Failed to create workspace');
       }
       
       return response.json();
     },
     
     updateWorkspace: async (id: string, data: any) => {
       const token = getToken();
       const response = await fetch(`${API_BASE_URL}/api/trees/${id}`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify(data)
       });
       
       if (!response.ok) {
         throw new Error('Failed to update workspace');
       }
       
       return response.json();
     },
     
     // 公開設定
     updatePublishSettings: async (id: string, settings: any) => {
       const token = getToken();
       const response = await fetch(`${API_BASE_URL}/api/trees/publish/${id}/settings`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
         },
         body: JSON.stringify(settings)
       });
       
       if (!response.ok) {
         throw new Error('Failed to update publish settings');
       }
       
       return response.json();
     },
   };
   ```

### Action 15: テスト・デプロイ準備
**目標**: 実装したAPIのテストとデプロイ

1. テスト用スクリプトの作成:
   ```bash
   # テスト用のAPIリクエスト
   touch test-api.http
   ```

2. テストリクエストの例 (`test-api.http`):
   ```http
   ### ヘルスチェック
   GET http://localhost:8787/api/health

   ### 公開ワークスペース一覧取得
   GET http://localhost:8787/api/trees/publish/public

   ### ワークスペース作成 (認証必要)
   POST http://localhost:8787/api/trees
   Content-Type: application/json
   Authorization: Bearer <トークン>

   {
     "name": "テストワークスペース",
     "treeTitle": "テストツリー",
     "tree": [
       {
         "id": "root",
         "parentId": null,
         "title": "ルートノード",
         "type": "default",
         "children": []
       }
     ]
   }
   ```

3. デプロイコマンド:
   ```bash
   # 開発環境での実行
   wrangler dev

   # 本番環境へのデプロイ
   wrangler publish
   ```

## フェーズ7: 移行計画実行

### Action 16: データ移行ツールの作成
**目標**: 既存のLocalStorageデータをCloudflareに移行するツール実装

1. 移行ツールの実装 (クライアントサイドコード):
   ```typescript
   // src/utils/data-migration.ts
   import { api } from './api-client';

   export async function migrateLocalWorkspaces() {
     // LocalStorageからデータ取得
     const workspaceKeys = Object.keys(localStorage).filter(key => key.startsWith('workspace_'));
     
     const results = {
       success: [] as string[],
       failed: [] as string[]
     };
     
     for (const key of workspaceKeys) {
       try {
         const data = JSON.parse(localStorage.getItem(key) || '');
         
         // APIを使ってクラウドに保存
         const result = await api.createWorkspace({
           name: data.name || 'Migrated Workspace',
           treeTitle: data.treeTitle || 'Tree',
           tree: data.tree || []
         });
         
         results.success.push(key);
       } catch (error) {
         console.error(`Failed to migrate ${key}:`, error);
         results.failed.push(key);
       }
     }
     
     return results;
   }
   ```

2. UI上での移行機能の実装（移行ボタンなど）

### Action 17: 段階的なページ移行
**目標**: Next.jsページをHono対応に移行

1. 移行対象の特定と優先順位付け:
   - 高頻度アクセスページ
   - API連携が単純なページから開始
   - 最後に認証周りを移行

2. 移行後の動作検証とパフォーマンス測定

## フェーズ8: 最終調整と本番リリース

### Action 18: パフォーマンス最適化
**目標**: アプリケーション全体のパフォーマンス改善

1. キャッシュ戦略の実装（KV + D1 + CDN）
2. 大規模ツリーのレンダリング最適化

### Action 19: 監視・アナリティクス設定
**目標**: 本番環境でのパフォーマンス監視体制構築

1. Cloudflare Analyticsの設定
2. エラーモニタリングの実装

### Action 20: 本番リリース
**目標**: 移行完了と本番環境への切り替え

1. DNS設定の更新
2. 最終テスト実行
3. 段階的なトラフィック移行（必要に応じて）

## まとめ

このアクションプランに従って実装を進めることで、TreeEditorアプリをCloudflare Workers + Honoアーキテクチャに効率的に移行できます。各アクションは個別に実行可能で、優先順位に従って段階的に進めることができます。特にAPIエンドポイントの実装とストレージ連携を先に行うことで、フロントエンドの変更を最小限に抑えながら移行を進められます。