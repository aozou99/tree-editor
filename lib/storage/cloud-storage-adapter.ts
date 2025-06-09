import type { StorageAdapter, TreeInfo, TreeWithData } from './types';
import { apiClient } from '@/lib/api-client';
import { compressData, decompressData, logCompressionResult, CompressionStats } from './compression-utils';

interface ApiTreeResponse {
  id: string;
  userId: string;
  name: string;
  description?: string;
  r2Key: string;
  lastSaved: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiTreeWithDataResponse extends ApiTreeResponse {
  data: {
    nodes: any[];
    expandedNodes: string[];
  };
  nodeTypes: any[];
  compressed?: boolean;
}

export class CloudStorageAdapter implements StorageAdapter {
  readonly type = 'cloud' as const;
  private compressionEnabled: boolean;
  private compressionStats: CompressionStats;

  constructor(options: { compressionEnabled?: boolean } = {}) {
    this.compressionEnabled = options.compressionEnabled ?? true;
    this.compressionStats = CompressionStats.getInstance();
  }

  private convertApiResponseToTreeInfo(apiTree: ApiTreeResponse): TreeInfo {
    return {
      id: apiTree.id,
      name: apiTree.name,
      description: apiTree.description,
      lastSaved: new Date(apiTree.lastSaved),
      createdAt: new Date(apiTree.createdAt),
      updatedAt: new Date(apiTree.updatedAt),
    };
  }

  private convertApiResponseToTreeWithData(apiTree: ApiTreeWithDataResponse): TreeWithData {
    // 圧縮されたデータの展開
    let treeData = apiTree.data;
    let nodeTypes = apiTree.nodeTypes;

    if (apiTree.compressed) {
      if (typeof treeData === 'string') {
        treeData = decompressData(treeData, true);
      }
      if (typeof nodeTypes === 'string') {
        nodeTypes = decompressData(nodeTypes, true);
      }
    }

    return {
      id: apiTree.id,
      name: apiTree.name,
      description: apiTree.description,
      data: {
        nodes: treeData.nodes,
        expandedNodes: new Set(treeData.expandedNodes),
      },
      nodeTypes: nodeTypes,
      lastSaved: new Date(apiTree.lastSaved),
      createdAt: new Date(apiTree.createdAt),
      updatedAt: new Date(apiTree.updatedAt),
    };
  }

  async getTrees(): Promise<TreeInfo[]> {
    const response = await apiClient.api.trees.$get();
    if (!response.ok) {
      throw new Error('Failed to fetch trees');
    }
    
    const { trees } = await response.json();
    return trees.map(tree => this.convertApiResponseToTreeInfo(tree));
  }

  async getTree(id: string): Promise<TreeWithData | null> {
    const response = await apiClient.api.trees[':id'].$get({
      param: { id },
    });
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch tree');
    }
    
    const apiTree = await response.json() as ApiTreeWithDataResponse;
    return this.convertApiResponseToTreeWithData(apiTree);
  }

  async createTree(tree: Omit<TreeWithData, 'id' | 'createdAt' | 'updatedAt' | 'lastSaved'>): Promise<TreeWithData> {
    // データの準備
    const treeData = {
      nodes: tree.data.nodes,
      expandedNodes: Array.from(tree.data.expandedNodes),
    };

    // データ圧縮
    const compressedTreeData = this.compressionEnabled 
      ? compressData(treeData, { enabled: true })
      : { data: JSON.stringify(treeData), compressed: false, originalSize: 0, compressedSize: 0, compressionRatio: 1 };
    
    const compressedNodeTypes = this.compressionEnabled 
      ? compressData(tree.nodeTypes, { enabled: true })
      : { data: JSON.stringify(tree.nodeTypes), compressed: false, originalSize: 0, compressedSize: 0, compressionRatio: 1 };

    // 統計記録
    if (this.compressionEnabled) {
      this.compressionStats.recordCompression(compressedTreeData);
      this.compressionStats.recordCompression(compressedNodeTypes);
      logCompressionResult('Create Tree Data', compressedTreeData);
      logCompressionResult('Create NodeTypes', compressedNodeTypes);
    }

    const response = await apiClient.api.trees.$post({
      json: {
        name: tree.name,
        description: tree.description,
        data: compressedTreeData.compressed ? compressedTreeData.data : treeData,
        nodeTypes: compressedNodeTypes.compressed ? compressedNodeTypes.data : tree.nodeTypes,
        compressed: compressedTreeData.compressed || compressedNodeTypes.compressed,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to create tree');
    }
    
    const apiTree = await response.json() as ApiTreeWithDataResponse;
    return this.convertApiResponseToTreeWithData(apiTree);
  }

  async updateTree(id: string, updates: Partial<Omit<TreeWithData, 'id' | 'createdAt' | 'updatedAt'>>): Promise<TreeWithData> {
    const updateData: any = {};
    let hasCompressedData = false;
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    
    if (updates.nodeTypes !== undefined) {
      if (this.compressionEnabled) {
        const compressedNodeTypes = compressData(updates.nodeTypes, { enabled: true });
        this.compressionStats.recordCompression(compressedNodeTypes);
        logCompressionResult('Update NodeTypes', compressedNodeTypes);
        
        if (compressedNodeTypes.compressed) {
          updateData.nodeTypes = compressedNodeTypes.data;
          hasCompressedData = true;
        } else {
          updateData.nodeTypes = updates.nodeTypes;
        }
      } else {
        updateData.nodeTypes = updates.nodeTypes;
      }
    }
    
    if (updates.data !== undefined) {
      const treeData = {
        nodes: updates.data.nodes,
        expandedNodes: Array.from(updates.data.expandedNodes),
      };
      
      if (this.compressionEnabled) {
        const compressedTreeData = compressData(treeData, { enabled: true });
        this.compressionStats.recordCompression(compressedTreeData);
        logCompressionResult('Update Tree Data', compressedTreeData);
        
        if (compressedTreeData.compressed) {
          updateData.data = compressedTreeData.data;
          hasCompressedData = true;
        } else {
          updateData.data = treeData;
        }
      } else {
        updateData.data = treeData;
      }
    }
    
    // 圧縮フラグを設定
    if (this.compressionEnabled) {
      updateData.compressed = hasCompressedData;
    }
    
    const response = await apiClient.api.trees[':id'].$put({
      param: { id },
      json: updateData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to update tree');
    }
    
    const apiTree = await response.json() as ApiTreeWithDataResponse;
    return this.convertApiResponseToTreeWithData(apiTree);
  }

  async deleteTree(id: string): Promise<void> {
    const response = await apiClient.api.trees[':id'].$delete({
      param: { id },
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete tree');
    }
  }

  /**
   * 圧縮統計を取得
   */
  getCompressionStats() {
    return this.compressionStats.getStats();
  }

  /**
   * 圧縮統計をリセット
   */
  resetCompressionStats() {
    this.compressionStats.reset();
  }

  /**
   * 圧縮機能の有効/無効を切り替え
   */
  setCompressionEnabled(enabled: boolean) {
    this.compressionEnabled = enabled;
    console.log(`[CloudStorageAdapter] Compression ${enabled ? 'enabled' : 'disabled'}`);
  }
}