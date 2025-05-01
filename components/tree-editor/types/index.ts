// フィールドタイプの共通型定義
export type FieldType = 'text' | 'textarea' | 'link' | 'youtube' | 'image' | 'audio';

export interface CustomFieldDefinition {
    id: string;
    name: string;
    type: FieldType;
    required: boolean;
}

export interface NodeType {
    id: string;
    name: string;
    icon: string;
    fieldDefinitions: CustomFieldDefinition[];
}

export interface CustomField {
    id: string;
    name: string;
    value: string;
    type: FieldType;
    definitionId?: string;
    fieldId?: string; // フィールド定義のID参照を追加
}

export interface TreeNode {
    id: string;
    name: string;
    children: TreeNode[];
    isExpanded?: boolean;
    icon?: string;
    thumbnail?: string;
    customFields?: CustomField[];
    nodeType?: string; // ノードタイプのID
}
