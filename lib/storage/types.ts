import type { TreeData, NodeType } from '@/components/tree-editor/types';

export interface TreeInfo {
  id: string;
  name: string;
  description?: string;
  lastSaved: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TreeWithData extends TreeInfo {
  data: TreeData;
  nodeTypes: NodeType[];
}

export interface StorageAdapter {
  // Tree operations
  getTrees(): Promise<TreeInfo[]>;
  getTree(id: string): Promise<TreeWithData | null>;
  createTree(tree: Omit<TreeWithData, 'id' | 'createdAt' | 'updatedAt' | 'lastSaved'>): Promise<TreeWithData>;
  updateTree(id: string, tree: Partial<Omit<TreeWithData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TreeWithData>;
  deleteTree(id: string): Promise<void>;
  
  // Storage type
  readonly type: 'local' | 'cloud';
}

export interface StorageManager {
  getAdapter(): StorageAdapter;
  isCloudAvailable(): boolean;
  getCurrentStorageType(): 'local' | 'cloud';
  setStorageType(type: 'local' | 'cloud'): void;
}