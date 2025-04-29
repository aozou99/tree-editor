import { TreeNode, NodeType } from '@/components/tree-editor/types';

// ローカルストレージのキー
const STORAGE_KEYS = {
    TREE_DATA: 'tree-editor-data',
    TREE_TYPES: 'tree-editor-types',
    TREE_TITLE: 'tree-editor-title',
    LAST_SAVED: 'tree-editor-last-saved',
};

// 保存するデータの型
export interface StoredTreeData {
    tree: TreeNode[];
    nodeTypes: NodeType[];
    treeTitle: string;
    lastSaved: string;
}

// ツリーデータをローカルストレージに保存
export function saveTreeDataToStorage(tree: TreeNode[], nodeTypes: NodeType[], treeTitle: string): void {
    try {
        const data: StoredTreeData = {
            tree,
            nodeTypes,
            treeTitle,
            lastSaved: new Date().toISOString(),
        };

        localStorage.setItem(STORAGE_KEYS.TREE_DATA, JSON.stringify(data.tree));
        localStorage.setItem(STORAGE_KEYS.TREE_TYPES, JSON.stringify(data.nodeTypes));
        localStorage.setItem(STORAGE_KEYS.TREE_TITLE, data.treeTitle);
        localStorage.setItem(STORAGE_KEYS.LAST_SAVED, data.lastSaved);

        console.log('ツリーデータを保存しました:', new Date().toLocaleTimeString());
    } catch (error) {
        console.error('ツリーデータの保存に失敗しました:', error);
    }
}

// ローカルストレージからツリーデータを読み込む
export function loadTreeDataFromStorage(): StoredTreeData | null {
    try {
        const treeJson = localStorage.getItem(STORAGE_KEYS.TREE_DATA);
        const nodeTypesJson = localStorage.getItem(STORAGE_KEYS.TREE_TYPES);
        const treeTitle = localStorage.getItem(STORAGE_KEYS.TREE_TITLE);
        const lastSaved = localStorage.getItem(STORAGE_KEYS.LAST_SAVED);

        // 必要なデータがすべて存在するか確認
        if (!treeJson || !nodeTypesJson || !treeTitle || !lastSaved) {
            return null;
        }

        return {
            tree: JSON.parse(treeJson),
            nodeTypes: JSON.parse(nodeTypesJson),
            treeTitle,
            lastSaved,
        };
    } catch (error) {
        console.error('ツリーデータの読み込みに失敗しました:', error);
        return null;
    }
}

// ローカルストレージからツリーデータを削除（リセット用）
export function clearTreeDataFromStorage(): void {
    try {
        localStorage.removeItem(STORAGE_KEYS.TREE_DATA);
        localStorage.removeItem(STORAGE_KEYS.TREE_TYPES);
        localStorage.removeItem(STORAGE_KEYS.TREE_TITLE);
        localStorage.removeItem(STORAGE_KEYS.LAST_SAVED);
        console.log('ツリーデータをリセットしました');
    } catch (error) {
        console.error('ツリーデータのリセットに失敗しました:', error);
    }
}

// デバウンス関数（頻繁な保存を防ぐ）
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            func(...args);
            timeout = null;
        }, wait);
    };
}
