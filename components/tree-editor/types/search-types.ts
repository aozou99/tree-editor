import type { TreeNode } from '.';

// 検索結果の型定義
export interface SearchResult {
    node: TreeNode;
    path: TreeNode[];
    matchField: string;
    matchValue: string;
}

// 検索クエリの型定義
export interface ParsedQuery {
    text: string;
    type?: string;
    fields: { [key: string]: string };
}
