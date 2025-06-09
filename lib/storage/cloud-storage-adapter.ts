import type { StorageAdapter, TreeInfo, TreeWithData } from './types';
import { apiClient } from '@/lib/api-client';

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
}

export class CloudStorageAdapter implements StorageAdapter {
  readonly type = 'cloud' as const;

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
    return {
      id: apiTree.id,
      name: apiTree.name,
      description: apiTree.description,
      data: {
        nodes: apiTree.data.nodes,
        expandedNodes: new Set(apiTree.data.expandedNodes),
      },
      nodeTypes: apiTree.nodeTypes,
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
    const response = await apiClient.api.trees.$post({
      json: {
        name: tree.name,
        description: tree.description,
        data: {
          nodes: tree.data.nodes,
          expandedNodes: Array.from(tree.data.expandedNodes),
        },
        nodeTypes: tree.nodeTypes,
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
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.nodeTypes !== undefined) updateData.nodeTypes = updates.nodeTypes;
    if (updates.data !== undefined) {
      updateData.data = {
        nodes: updates.data.nodes,
        expandedNodes: Array.from(updates.data.expandedNodes),
      };
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
}