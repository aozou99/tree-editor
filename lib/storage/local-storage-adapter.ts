import type { StorageAdapter, TreeInfo, TreeWithData } from './types';
import type { TreeData, NodeType } from '@/components/tree-editor/types';

const STORAGE_KEY_PREFIX = 'tree_editor_';
const TREES_INDEX_KEY = `${STORAGE_KEY_PREFIX}trees_index`;

export class LocalStorageAdapter implements StorageAdapter {
  readonly type = 'local' as const;

  async getTrees(): Promise<TreeInfo[]> {
    const indexJson = localStorage.getItem(TREES_INDEX_KEY);
    if (!indexJson) return [];
    
    try {
      const index = JSON.parse(indexJson) as TreeInfo[];
      return index.map(tree => ({
        ...tree,
        lastSaved: new Date(tree.lastSaved),
        createdAt: new Date(tree.createdAt),
        updatedAt: new Date(tree.updatedAt),
      }));
    } catch {
      return [];
    }
  }

  async getTree(id: string): Promise<TreeWithData | null> {
    const treeJson = localStorage.getItem(`${STORAGE_KEY_PREFIX}tree_${id}`);
    if (!treeJson) return null;
    
    try {
      const tree = JSON.parse(treeJson);
      // Convert expandedNodes array back to Set
      if (tree.data && Array.isArray(tree.data.expandedNodes)) {
        tree.data.expandedNodes = new Set(tree.data.expandedNodes);
      }
      return {
        ...tree,
        lastSaved: new Date(tree.lastSaved),
        createdAt: new Date(tree.createdAt),
        updatedAt: new Date(tree.updatedAt),
      };
    } catch {
      return null;
    }
  }

  async createTree(tree: Omit<TreeWithData, 'id' | 'createdAt' | 'updatedAt' | 'lastSaved'>): Promise<TreeWithData> {
    const now = new Date();
    const newTree: TreeWithData = {
      ...tree,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      lastSaved: now,
    };

    // Store tree data with expandedNodes as array
    const treeToStore = {
      ...newTree,
      data: {
        ...newTree.data,
        expandedNodes: Array.from(newTree.data.expandedNodes),
      },
    };
    
    localStorage.setItem(`${STORAGE_KEY_PREFIX}tree_${newTree.id}`, JSON.stringify(treeToStore));
    
    // Update index
    const trees = await this.getTrees();
    const { data, nodeTypes, ...info } = newTree;
    trees.push(info);
    localStorage.setItem(TREES_INDEX_KEY, JSON.stringify(trees));
    
    return newTree;
  }

  async updateTree(id: string, updates: Partial<Omit<TreeWithData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TreeWithData> {
    const existing = await this.getTree(id);
    if (!existing) {
      throw new Error('Tree not found');
    }

    const now = new Date();
    const updated: TreeWithData = {
      ...existing,
      ...updates,
      updatedAt: now,
      lastSaved: now,
    };

    // Store tree data with expandedNodes as array
    const treeToStore = {
      ...updated,
      data: {
        ...updated.data,
        expandedNodes: Array.from(updated.data.expandedNodes),
      },
    };
    
    localStorage.setItem(`${STORAGE_KEY_PREFIX}tree_${id}`, JSON.stringify(treeToStore));
    
    // Update index
    const trees = await this.getTrees();
    const index = trees.findIndex(t => t.id === id);
    if (index !== -1) {
      const { data, nodeTypes, ...info } = updated;
      trees[index] = info;
      localStorage.setItem(TREES_INDEX_KEY, JSON.stringify(trees));
    }
    
    return updated;
  }

  async deleteTree(id: string): Promise<void> {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}tree_${id}`);
    
    // Update index
    const trees = await this.getTrees();
    const filtered = trees.filter(t => t.id !== id);
    localStorage.setItem(TREES_INDEX_KEY, JSON.stringify(filtered));
  }
}