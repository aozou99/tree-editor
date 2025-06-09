import { LocalStorageAdapter } from './local-storage-adapter';
import { CloudStorageAdapter } from './cloud-storage-adapter';
import type { TreeWithData } from './types';

export interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errors: string[];
}

export class DataMigration {
  private localAdapter: LocalStorageAdapter;
  private cloudAdapter: CloudStorageAdapter;

  constructor() {
    this.localAdapter = new LocalStorageAdapter();
    this.cloudAdapter = new CloudStorageAdapter();
  }

  /**
   * Migrate all trees from local storage to cloud storage
   */
  async migrateLocalToCloud(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      errors: [],
    };

    try {
      // Get all local trees
      const localTrees = await this.localAdapter.getTrees();
      
      if (localTrees.length === 0) {
        return result; // No trees to migrate
      }

      // Check if cloud trees already exist
      const cloudTrees = await this.cloudAdapter.getTrees();
      
      for (const localTreeInfo of localTrees) {
        try {
          // Get full tree data from local storage
          const localTree = await this.localAdapter.getTree(localTreeInfo.id);
          if (!localTree) {
            result.errors.push(`Failed to load local tree: ${localTreeInfo.name}`);
            continue;
          }

          // Check if tree with same name already exists in cloud
          const existingCloudTree = cloudTrees.find(cloudTree => cloudTree.name === localTree.name);
          
          if (existingCloudTree) {
            result.errors.push(`Tree "${localTree.name}" already exists in cloud storage`);
            continue;
          }

          // Create tree in cloud storage
          await this.cloudAdapter.createTree({
            name: localTree.name,
            description: localTree.description,
            data: localTree.data,
            nodeTypes: localTree.nodeTypes,
          });

          result.migratedCount++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Failed to migrate tree "${localTreeInfo.name}": ${errorMessage}`);
        }
      }

      if (result.errors.length > 0) {
        result.success = false;
      }

    } catch (error) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Migration failed: ${errorMessage}`);
    }

    return result;
  }

  /**
   * Get migration preview without actually migrating
   */
  async getMigrationPreview(): Promise<{
    localTrees: number;
    cloudTrees: number;
    conflicts: string[];
  }> {
    try {
      const localTrees = await this.localAdapter.getTrees();
      const cloudTrees = await this.cloudAdapter.getTrees();
      
      const conflicts: string[] = [];
      
      for (const localTree of localTrees) {
        const conflict = cloudTrees.find(cloudTree => cloudTree.name === localTree.name);
        if (conflict) {
          conflicts.push(localTree.name);
        }
      }

      return {
        localTrees: localTrees.length,
        cloudTrees: cloudTrees.length,
        conflicts,
      };
    } catch (error) {
      throw new Error(`Failed to get migration preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Backup local data to a JSON string
   */
  async backupLocalData(): Promise<string> {
    try {
      const localTrees = await this.localAdapter.getTrees();
      const fullTrees: TreeWithData[] = [];

      for (const treeInfo of localTrees) {
        const tree = await this.localAdapter.getTree(treeInfo.id);
        if (tree) {
          // Convert Set to Array for JSON serialization
          const serializedTree = {
            ...tree,
            data: {
              ...tree.data,
              expandedNodes: Array.from(tree.data.expandedNodes),
            },
          };
          fullTrees.push(serializedTree as TreeWithData);
        }
      }

      return JSON.stringify({
        version: '1.0',
        exportDate: new Date().toISOString(),
        trees: fullTrees,
      }, null, 2);
    } catch (error) {
      throw new Error(`Failed to backup local data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all local trees after successful migration
   */
  async clearLocalData(): Promise<void> {
    try {
      const localTrees = await this.localAdapter.getTrees();
      
      for (const tree of localTrees) {
        await this.localAdapter.deleteTree(tree.id);
      }
    } catch (error) {
      throw new Error(`Failed to clear local data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}