import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { shares, trees, type NewShare } from '@/db/schema';
import { getAuthUser } from '@/app/api/[[...hono]]/helpers/auth';
import { initOidcAuthEnv } from '@/app/api/[[...hono]]/middleware/initOidcAuthEnv';

// Validation schemas
const createShareSchema = z.object({
  treeId: z.string().min(1),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  expiresAt: z.string().optional().transform((val) => val ? new Date(val) : null),
});

const updateShareSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().optional().transform((val) => val ? new Date(val) : null),
});

// Helper function to generate share token
const generateShareToken = () => {
  return crypto.randomUUID().replace(/-/g, '');
};

// Type for tree data stored in R2
interface TreeDataJson {
  data: {
    nodes: any[];
    expandedNodes: string[];
  };
  nodeTypes: any[];
}

const app = new Hono().use('*', initOidcAuthEnv);

// GET /api/shares - Get all shares for the authenticated user
app.get('/', async c => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = c.var.DB;
  const userShares = await db.select({
    id: shares.id,
    treeId: shares.treeId,
    shareToken: shares.shareToken,
    title: shares.title,
    description: shares.description,
    isActive: shares.isActive,
    expiresAt: shares.expiresAt,
    createdAt: shares.createdAt,
    updatedAt: shares.updatedAt,
    treeName: trees.name,
  })
  .from(shares)
  .leftJoin(trees, eq(shares.treeId, trees.id))
  .where(eq(shares.userId, user.id));

  return c.json({
    shares: userShares,
  });
});

// GET /api/shares/:token - Get shared tree by token (public endpoint)
app.get('/:token', async c => {
  const shareToken = c.req.param('token');
  const db = c.var.DB;
  const r2 = c.var.env.R2_BUCKET;

  // Get share information
  const [share] = await db
    .select({
      id: shares.id,
      treeId: shares.treeId,
      title: shares.title,
      description: shares.description,
      isActive: shares.isActive,
      expiresAt: shares.expiresAt,
      treeName: trees.name,
      r2Key: trees.r2Key,
    })
    .from(shares)
    .leftJoin(trees, eq(shares.treeId, trees.id))
    .where(eq(shares.shareToken, shareToken));

  if (!share) {
    return c.json({ error: 'Share not found' }, 404);
  }

  // Check if share is active
  if (!share.isActive) {
    return c.json({ error: 'Share is disabled' }, 403);
  }

  // Check if share has expired
  if (share.expiresAt && new Date() > share.expiresAt) {
    return c.json({ error: 'Share has expired' }, 403);
  }

  // Get tree data from R2
  const object = await r2.get(share.r2Key);
  if (!object) {
    return c.json({ error: 'Tree data not found' }, 404);
  }

  const treeData: TreeDataJson = await object.json();

  return c.json({
    share: {
      id: share.id,
      title: share.title,
      description: share.description,
      treeName: share.treeName,
    },
    tree: {
      data: treeData.data,
      nodeTypes: treeData.nodeTypes,
    },
  });
});

// POST /api/shares - Create a new share
app.post('/', zValidator('json', createShareSchema), async c => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const validated = c.req.valid('json');
  const db = c.var.DB;

  // Check if tree exists and belongs to user
  const [tree] = await db
    .select()
    .from(trees)
    .where(and(eq(trees.id, validated.treeId), eq(trees.userId, user.id)));

  if (!tree) {
    return c.json({ error: 'Tree not found' }, 404);
  }

  // Create share
  const shareToken = generateShareToken();
  const newShare: NewShare = {
    treeId: validated.treeId,
    userId: user.id,
    shareToken,
    title: validated.title,
    description: validated.description,
    expiresAt: validated.expiresAt,
  };

  const [created] = await db.insert(shares).values(newShare).returning();

  return c.json(
    {
      ...created,
      shareUrl: `${c.req.header('origin') || 'http://localhost:3000'}/share/${shareToken}`,
    },
    201
  );
});

// PUT /api/shares/:id - Update a share
app.put('/:id', zValidator('json', updateShareSchema), async c => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const shareId = c.req.param('id');
  const validated = c.req.valid('json');
  const db = c.var.DB;

  // Check if share exists and belongs to user
  const [existingShare] = await db
    .select()
    .from(shares)
    .where(and(eq(shares.id, shareId), eq(shares.userId, user.id)));

  if (!existingShare) {
    return c.json({ error: 'Share not found' }, 404);
  }

  // Update share
  const [updated] = await db
    .update(shares)
    .set({
      ...validated,
      updatedAt: new Date(),
    })
    .where(and(eq(shares.id, shareId), eq(shares.userId, user.id)))
    .returning();

  return c.json(updated);
});

// DELETE /api/shares/:id - Delete a share
app.delete('/:id', async c => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const shareId = c.req.param('id');
  const db = c.var.DB;

  // Check if share exists and belongs to user
  const [existingShare] = await db
    .select()
    .from(shares)
    .where(and(eq(shares.id, shareId), eq(shares.userId, user.id)));

  if (!existingShare) {
    return c.json({ error: 'Share not found' }, 404);
  }

  // Delete share
  await db.delete(shares).where(and(eq(shares.id, shareId), eq(shares.userId, user.id)));

  return c.json({ message: 'Share deleted successfully' });
});

export default app;