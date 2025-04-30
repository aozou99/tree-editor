import { TreeNode, NodeType, CustomFieldDefinition, CustomField } from '@/components/tree-editor/types';
import { v4 as uuidv4 } from 'uuid';

// エクスポートデータの型定義
export interface TreeExportData {
    tree: TreeNode[];
    nodeTypes: NodeType[];
    treeTitle: string;
    version: string;
    exportDate: string;
}

// エラーキー型定義
export type ImportErrorKey =
    | 'invalidFormat'
    | 'noTreeData'
    | 'noNodeTypes'
    | 'invalidNodeStructure'
    | 'invalidNodeTypeStructure';

// データの検証
export function validateImportData(data: any): { valid: boolean; error?: ImportErrorKey } {
    // 基本構造のチェック
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'invalidFormat' };
    }

    // 必須フィールドのチェック
    if (!data.tree || !Array.isArray(data.tree)) {
        return { valid: false, error: 'noTreeData' };
    }

    if (!data.nodeTypes || !Array.isArray(data.nodeTypes)) {
        return { valid: false, error: 'noNodeTypes' };
    }

    // ツリーノードの構造チェック
    for (const node of data.tree) {
        if (!node.id || !node.name || !Array.isArray(node.children)) {
            return { valid: false, error: 'invalidNodeStructure' };
        }
    }

    // ノードタイプの構造チェック
    for (const type of data.nodeTypes) {
        if (!type.id || !type.name || !Array.isArray(type.fieldDefinitions)) {
            return { valid: false, error: 'invalidNodeTypeStructure' };
        }
    }

    return { valid: true };
}

// インポートデータの修復（必要に応じてIDを再生成など）
export function repairImportData(data: TreeExportData): TreeExportData {
    // IDマッピングを作成（古いID -> 新しいID）
    const nodeTypeIdMap = new Map<string, string>();
    const fieldDefIdMap = new Map<string, string>();

    // ノードタイプのIDを修復
    const repairedNodeTypes = data.nodeTypes.map((type) => {
        const newTypeId = uuidv4();
        nodeTypeIdMap.set(type.id, newTypeId);

        // フィールド定義のIDを修復
        const repairedFieldDefs = type.fieldDefinitions.map((def) => {
            const newDefId = uuidv4();
            fieldDefIdMap.set(def.id, newDefId);
            return { ...def, id: newDefId } as CustomFieldDefinition;
        });

        return {
            ...type,
            id: newTypeId,
            fieldDefinitions: repairedFieldDefs,
        } as NodeType;
    });

    // ツリーノードを再帰的に修復
    const repairNode = (node: TreeNode): TreeNode => {
        // カスタムフィールドの修復
        const repairedFields = node.customFields?.map((field) => {
            const newFieldId = uuidv4();
            // definitionIdがある場合は新しいIDにマッピング
            const newDefId = field.definitionId ? fieldDefIdMap.get(field.definitionId) : undefined;
            return {
                ...field,
                id: newFieldId,
                definitionId: newDefId,
            } as CustomField;
        });

        // ノードタイプIDの修復
        const newNodeTypeId = node.nodeType ? nodeTypeIdMap.get(node.nodeType) : undefined;

        // 子ノードを再帰的に修復
        const repairedChildren = node.children.map(repairNode);

        return {
            ...node,
            id: uuidv4(), // 新しいIDを生成
            nodeType: newNodeTypeId,
            customFields: repairedFields,
            children: repairedChildren,
        } as TreeNode;
    };

    const repairedTree = data.tree.map(repairNode);

    return {
        ...data,
        tree: repairedTree,
        nodeTypes: repairedNodeTypes,
    };
}

// エクスポートデータの作成
export function createExportData(tree: TreeNode[], nodeTypes: NodeType[], treeTitle: string): TreeExportData {
    return {
        tree,
        nodeTypes,
        treeTitle,
        version: '1.0',
        exportDate: new Date().toISOString(),
    };
}
