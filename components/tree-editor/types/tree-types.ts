import { TreeNode, NodeType } from './index';

// Tree data stored in storage
export interface TreeData {
  nodes: TreeNode[];
  expandedNodes: Set<string>;
}

// Complete tree information
export interface Tree {
  id: string;
  name: string;
  description?: string;
  data: TreeData;
  nodeTypes: NodeType[];
  lastSaved: Date;
  createdAt: Date;
  updatedAt: Date;
}