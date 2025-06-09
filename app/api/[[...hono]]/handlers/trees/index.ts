import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq, and } from 'drizzle-orm';
import { trees, type NewTree } from '@/db/schema';
import { getAuthUser } from '@/app/api/[[...hono]]/helpers/auth';
import { initOidcAuthEnv } from '@/app/api/[[...hono]]/middleware/initOidcAuthEnv';
import pako from 'pako';

// Validation schemas
const createTreeSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  data: z.union([
    z.object({
      nodes: z.array(z.any()),
      expandedNodes: z.array(z.string()),
    }),
    z.string(), // 圧縮された文字列データ
  ]),
  nodeTypes: z.union([
    z.array(z.any()),
    z.string(), // 圧縮された文字列データ
  ]),
  compressed: z.boolean().optional(),
});

const updateTreeSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  data: z
    .union([
      z.object({
        nodes: z.array(z.any()),
        expandedNodes: z.array(z.string()),
      }),
      z.string(), // 圧縮された文字列データ
    ])
    .optional(),
  nodeTypes: z.union([
    z.array(z.any()),
    z.string(), // 圧縮された文字列データ
  ]).optional(),
  compressed: z.boolean().optional(),
});

// Helper function to generate R2 key
const generateR2Key = (userId: string, treeId: string) => {
  return `trees/${userId}/${treeId}.json`;
};

// Helper function to decompress data
const decompressData = (compressedData: string): any => {
  try {
    const compressed = new Uint8Array(
      atob(compressedData).split('').map(c => c.charCodeAt(0))
    );
    const decompressed = pako.ungzip(compressed, { to: 'string' });
    return JSON.parse(decompressed);
  } catch (error) {
    console.warn('Decompression failed, trying as uncompressed data:', error);
    try {
      return JSON.parse(compressedData);
    } catch (parseError) {
      console.error('Failed to parse data as JSON:', parseError);
      throw new Error('Data decompression and parsing failed');
    }
  }
};

// Helper function to process potentially compressed data
const processCompressedInput = (data: any, isCompressed: boolean = false) => {
  if (!isCompressed || typeof data !== 'string') {
    return data;
  }
  return decompressData(data);
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

// GET /api/trees - Get all trees for the authenticated user
app.get('/', async c => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const db = c.var.DB;
  const userTrees = await db.select().from(trees).where(eq(trees.userId, user.id));

  // Return only metadata, not the actual data
  return c.json({
    trees: userTrees,
  });
});

// GET /api/trees/:id - Get a specific tree with data from R2
app.get('/:id', async c => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const treeId = c.req.param('id');
  const db = c.var.DB;
  const r2 = c.var.env.R2_BUCKET;

  // Get tree metadata from D1
  const [tree] = await db
    .select()
    .from(trees)
    .where(and(eq(trees.id, treeId), eq(trees.userId, user.id)));

  if (!tree) {
    return c.json({ error: 'Tree not found' }, 404);
  }

  // Get tree data from R2
  const object = await r2.get(tree.r2Key);
  if (!object) {
    return c.json({ error: 'Tree data not found' }, 404);
  }

  const treeData: TreeDataJson = await object.json();

  return c.json({
    ...tree,
    data: treeData.data,
    nodeTypes: treeData.nodeTypes,
  });
});

// POST /api/trees - Create a new tree
app.post('/', zValidator('json', createTreeSchema), async c => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const validated = c.req.valid('json');
  const db = c.var.DB;
  const r2 = c.var.env.R2_BUCKET;

  const treeId = crypto.randomUUID();
  const r2Key = generateR2Key(user.id.toString(), treeId);

  // Process potentially compressed data
  const processedData = processCompressedInput(validated.data, validated.compressed);
  const processedNodeTypes = processCompressedInput(validated.nodeTypes, validated.compressed);

  // Prepare tree data for R2
  const treeData: TreeDataJson = {
    data: {
      nodes: processedData.nodes,
      expandedNodes: processedData.expandedNodes,
    },
    nodeTypes: processedNodeTypes,
  };

  // Save tree data to R2
  await r2.put(r2Key, JSON.stringify(treeData), {
    httpMetadata: {
      contentType: 'application/json',
    },
  });

  // Save tree metadata to D1
  const newTree: NewTree = {
    id: treeId,
    userId: user.id,
    name: validated.name,
    description: validated.description,
    r2Key,
    lastSaved: new Date(),
  };

  const [created] = await db.insert(trees).values(newTree).returning();

  return c.json(
    {
      ...created,
      data: treeData.data,
      nodeTypes: treeData.nodeTypes,
    },
    201
  );
});

// PUT /api/trees/:id - Update a tree
app.put('/:id', zValidator('json', updateTreeSchema), async c => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const treeId = c.req.param('id');
  const validated = c.req.valid('json');
  const db = c.var.DB;
  const r2 = c.var.env.R2_BUCKET;

  // Check if tree exists and belongs to user
  const [existingTree] = await db
    .select()
    .from(trees)
    .where(and(eq(trees.id, treeId), eq(trees.userId, user.id)));

  if (!existingTree) {
    return c.json({ error: 'Tree not found' }, 404);
  }

  // If data or nodeTypes are being updated, update R2
  if (validated.data || validated.nodeTypes) {
    // Get current data from R2
    const object = await r2.get(existingTree.r2Key);
    if (!object) {
      return c.json({ error: 'Tree data not found' }, 404);
    }

    const currentData: TreeDataJson = await object.json();

    // Process potentially compressed data
    let processedData = currentData.data;
    let processedNodeTypes = currentData.nodeTypes;

    if (validated.data) {
      processedData = processCompressedInput(validated.data, validated.compressed);
    }
    if (validated.nodeTypes) {
      processedNodeTypes = processCompressedInput(validated.nodeTypes, validated.compressed);
    }

    // Merge updates
    const updatedData: TreeDataJson = {
      data: validated.data
        ? {
            nodes: processedData.nodes,
            expandedNodes: processedData.expandedNodes,
          }
        : currentData.data,
      nodeTypes: processedNodeTypes,
    };

    // Save updated data to R2
    await r2.put(existingTree.r2Key, JSON.stringify(updatedData), {
      httpMetadata: {
        contentType: 'application/json',
      },
    });
  }

  // Update metadata in D1
  const updateData: Partial<typeof trees.$inferSelect> = {
    updatedAt: new Date(),
    lastSaved: new Date(),
  };

  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.description !== undefined) updateData.description = validated.description;

  const [updated] = await db
    .update(trees)
    .set(updateData)
    .where(and(eq(trees.id, treeId), eq(trees.userId, user.id)))
    .returning();

  // Get updated data from R2 if needed
  if (validated.data || validated.nodeTypes) {
    const object = await r2.get(updated.r2Key);
    const treeData: TreeDataJson = await object!.json();

    return c.json({
      ...updated,
      data: treeData.data,
      nodeTypes: treeData.nodeTypes,
    });
  }

  return c.json(updated);
});

// DELETE /api/trees/:id - Delete a tree
app.delete('/:id', async c => {
  const user = await getAuthUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const treeId = c.req.param('id');
  const db = c.var.DB;
  const r2 = c.var.env.R2_BUCKET;

  // Get tree to find R2 key
  const [tree] = await db
    .select()
    .from(trees)
    .where(and(eq(trees.id, treeId), eq(trees.userId, user.id)));

  if (!tree) {
    return c.json({ error: 'Tree not found' }, 404);
  }

  // Delete from R2
  await r2.delete(tree.r2Key);

  // Delete from D1
  await db.delete(trees).where(and(eq(trees.id, treeId), eq(trees.userId, user.id)));

  return c.json({ message: 'Tree deleted successfully' });
});

export default app;
