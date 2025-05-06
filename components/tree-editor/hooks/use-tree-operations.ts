import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { TreeNode, NodeType } from '@/components/tree-editor/types';
import { useI18n } from '@/utils/i18n/i18n-context';
import { toast } from '@/hooks/use-toast';

export interface UseTreeOperationsProps {
    initialTree: TreeNode[];
    initialNodeTypes: NodeType[];
    initialTreeTitle: string;
}

export function useTreeOperations({ initialTree, initialNodeTypes, initialTreeTitle }: UseTreeOperationsProps) {
    const [tree, setTree] = useState<TreeNode[]>(initialTree);
    const [nodeTypes, setNodeTypes] = useState<NodeType[]>(initialNodeTypes);
    const [treeTitle, setTreeTitle] = useState<string>(initialTreeTitle);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<string>('');

    const { t } = useI18n();

    // ノードの展開/折りたたみを切り替える
    const toggleExpand = useCallback(
        (nodeId: string, e: React.MouseEvent) => {
            e.stopPropagation();
            const updateNode = (nodes: TreeNode[]): TreeNode[] => {
                return nodes.map((node) => {
                    if (node.id === nodeId) {
                        return { ...node, isExpanded: !node.isExpanded };
                    }
                    if (node.children.length > 0) {
                        return { ...node, children: updateNode(node.children) };
                    }
                    return node;
                });
            };
            setTree(updateNode(tree));
        },
        [tree],
    );

    // 新しいノードを追加する
    const addNode = useCallback(
        (newNode: TreeNode, parentId?: string) => {
            if (parentId) {
                // 子ノードとして追加
                const updateNode = (nodes: TreeNode[]): TreeNode[] => {
                    return nodes.map((node) => {
                        if (node.id === parentId) {
                            return {
                                ...node,
                                isExpanded: true, // 親ノードを展開
                                children: [...node.children, newNode],
                            };
                        }
                        if (node.children.length > 0) {
                            return { ...node, children: updateNode(node.children) };
                        }
                        return node;
                    });
                };
                setTree(updateNode(tree));
            } else {
                // ルートノードとして追加
                setTree([...tree, newNode]);
            }
        },
        [tree],
    );

    // ノードを削除
    const deleteNode = useCallback(
        (nodeId: string, e: React.MouseEvent) => {
            e.stopPropagation();

            const removeNode = (nodeId: string, nodes: TreeNode[]): TreeNode[] => {
                // ルートレベルでノードを検索して削除
                const filteredNodes = nodes.filter((node) => node.id !== nodeId);

                // 子ノードを再帰的に検索
                return filteredNodes.map((node) => {
                    if (node.children && node.children.length > 0) {
                        return {
                            ...node,
                            children: removeNode(nodeId, node.children),
                        };
                    }
                    return node;
                });
            };

            setTree(removeNode(nodeId, tree));
        },
        [tree],
    );

    // ノード名の編集を開始
    const startEditing = useCallback((node: TreeNode, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingNodeId(node.id);
        setEditingName(node.name);
    }, []);

    // ノード名の編集を保存
    const saveNodeName = useCallback(
        (e?: React.MouseEvent) => {
            e?.stopPropagation();
            if (!editingNodeId) return;

            const updateNode = (nodes: TreeNode[]): TreeNode[] => {
                return nodes.map((node) => {
                    if (node.id === editingNodeId) {
                        return { ...node, name: editingName };
                    }
                    if (node.children.length > 0) {
                        return { ...node, children: updateNode(node.children) };
                    }
                    return node;
                });
            };
            setTree(updateNode(tree));
            setEditingNodeId(null);
        },
        [editingNodeId, editingName, tree],
    );

    // 編集のキャンセル
    const cancelEditing = useCallback(() => {
        setEditingNodeId(null);
    }, []);

    // ノードの詳細情報を更新
    const updateNodeDetails = useCallback(
        (updatedNode: TreeNode) => {
            const updateNode = (nodes: TreeNode[]): TreeNode[] => {
                return nodes.map((node) => {
                    if (node.id === updatedNode.id) {
                        return updatedNode;
                    }
                    if (node.children.length > 0) {
                        return { ...node, children: updateNode(node.children) };
                    }
                    return node;
                });
            };

            setTree(updateNode(tree));
        },
        [tree],
    );

    // ノードタイプの更新と、それに伴うノードのカスタムフィールド更新
    const updateNodeTypes = useCallback(
        (updatedNodeTypes: NodeType[], fieldChangeInfo?: any) => {
            // ノードタイプの更新
            setNodeTypes(updatedNodeTypes);

            // フィールド変更情報がある場合は既存ノードに変更を反映
            if (fieldChangeInfo) {
                const { nodeTypeId, fieldChanges } = fieldChangeInfo;

                // 対象のノードタイプを持つすべてのノードを特定して更新
                const updateNodeCustomFields = (nodes: TreeNode[]): TreeNode[] => {
                    return nodes.map((node) => {
                        // このノードが対象のノードタイプを持つかチェック
                        const needsUpdate = node.nodeType === nodeTypeId;

                        // 子ノードも再帰的に更新
                        const updatedChildren =
                            node.children.length > 0 ? updateNodeCustomFields(node.children) : node.children;

                        // このノードが対象でない場合は子ノードだけ更新
                        if (!needsUpdate) {
                            return { ...node, children: updatedChildren };
                        }

                        // このノードのカスタムフィールドを更新
                        let updatedCustomFields = node.customFields ? [...node.customFields] : [];

                        // 1. 削除されたフィールドを除去
                        if (fieldChanges.removed.length > 0) {
                            updatedCustomFields = updatedCustomFields.filter(
                                (field) => !fieldChanges.removed.includes(field.fieldId || field.id),
                            );
                        }

                        // 2. 新規追加されたフィールドを追加
                        fieldChanges.added.forEach((newField) => {
                            updatedCustomFields.push({
                                id: uuidv4(),
                                fieldId: newField.id,
                                name: newField.name,
                                type: newField.type,
                                value: '',
                            });
                        });

                        // 3. 名前変更されたフィールドを更新
                        fieldChanges.renamed.forEach((rename) => {
                            const fieldIndex = updatedCustomFields.findIndex((f) => (f.fieldId || f.id) === rename.id);
                            if (fieldIndex !== -1) {
                                updatedCustomFields[fieldIndex] = {
                                    ...updatedCustomFields[fieldIndex],
                                    name: rename.newName,
                                };
                            }
                        });

                        // 4. タイプ変更されたフィールドを更新
                        fieldChanges.typeChanged.forEach((typeChange) => {
                            const fieldIndex = updatedCustomFields.findIndex(
                                (f) => (f.fieldId || f.id) === typeChange.id,
                            );
                            if (fieldIndex !== -1) {
                                updatedCustomFields[fieldIndex] = {
                                    ...updatedCustomFields[fieldIndex],
                                    type: typeChange.newType,
                                    // タイプ変更時は値をリセット
                                    value: '',
                                };
                            }
                        });

                        // 更新されたノードを返す
                        return {
                            ...node,
                            customFields: updatedCustomFields,
                            children: updatedChildren,
                        };
                    });
                };

                // ツリー全体を更新
                setTree(updateNodeCustomFields(tree));
            }
        },
        [tree],
    );

    // サンプルデータでリセット
    const resetTree = useCallback(
        (newTree: TreeNode[], newNodeTypes: NodeType[], newTitle: string) => {
            setTree(newTree);
            setNodeTypes(newNodeTypes);
            setTreeTitle(newTitle);

            toast({
                title: t('toast.dataReset'),
                description: t('toast.dataReset'),
                duration: 3000,
            });
        },
        [t],
    );

    return {
        tree,
        setTree,
        nodeTypes,
        setNodeTypes,
        treeTitle,
        setTreeTitle,
        editingNodeId,
        editingName,
        setEditingName,
        toggleExpand,
        addNode,
        deleteNode,
        startEditing,
        saveNodeName,
        cancelEditing,
        updateNodeDetails,
        updateNodeTypes,
        resetTree,
    };
}
