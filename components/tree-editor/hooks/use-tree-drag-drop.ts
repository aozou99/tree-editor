'use client';

import { useState } from 'react';
import type { TreeNode } from '../types';

interface UseTreeDragDropResult {
    draggedNodeId: string | null;
    dragOverNodeId: string | null;
    dragPosition: 'before' | 'after' | 'inside' | null;
    isDraggingOverRoot: boolean;
    handleDragStart: (e: React.DragEvent<HTMLDivElement>, nodeId: string) => void;
    handleDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDragOver: (e: React.DragEvent<HTMLDivElement>, nodeId: string) => void;
    handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLDivElement>, nodeId: string) => void;
    handleRootDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    handleRootDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    handleRootDrop: (e: React.DragEvent<HTMLDivElement>) => void;
}

export function useTreeDragDrop(tree: TreeNode[], setTree: React.Dispatch<React.SetStateAction<TreeNode[]>>) {
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
    const [dragPosition, setDragPosition] = useState<'before' | 'after' | 'inside' | null>(null);
    const [isDraggingOverRoot, setIsDraggingOverRoot] = useState<boolean>(false);

    // ノードを見つける関数
    const findNode = (nodeId: string, nodes: TreeNode[] = tree): { node: TreeNode | null; path: string[] } => {
        const search = (
            currentNodes: TreeNode[],
            currentPath: string[] = [],
        ): { node: TreeNode | null; path: string[] } => {
            for (const node of currentNodes) {
                if (node.id === nodeId) {
                    return { node, path: [...currentPath, node.id] };
                }

                if (node.children.length > 0) {
                    const result = search(node.children, [...currentPath, node.id]);
                    if (result.node) {
                        return result;
                    }
                }
            }

            return { node: null, path: [] };
        };

        return search(nodes);
    };

    // ノードを削除する関数
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

    // ドラッグ開始時の処理
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, nodeId: string) => {
        e.stopPropagation();
        setDraggedNodeId(nodeId);

        // ドラッグ中のノードのデータを設定
        e.dataTransfer.setData('application/json', JSON.stringify({ nodeId }));

        // ドラッグ中のゴーストイメージをカスタマイズ
        const dragImage = document.createElement('div');
        dragImage.className = 'bg-primary/10 border border-primary rounded px-2 py-1 text-sm';

        // ドラッグ中のノードの名前を取得
        const findNodeName = (nodes: TreeNode[], id: string): string => {
            for (const node of nodes) {
                if (node.id === id) return node.name;
                if (node.children.length > 0) {
                    const name = findNodeName(node.children, id);
                    if (name) return name;
                }
            }
            return 'ノード';
        };

        dragImage.textContent = findNodeName(tree, nodeId);
        document.body.appendChild(dragImage);
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        e.dataTransfer.setDragImage(dragImage, 0, 0);

        // クリーンアップ用にタイムアウトを設定
        setTimeout(() => {
            document.body.removeChild(dragImage);
        }, 0);
    };

    // ドラッグ終了時の処理
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setDraggedNodeId(null);
        setDragOverNodeId(null);
        setDragPosition(null);
        setIsDraggingOverRoot(false);
    };

    // ドラッグオーバー時の処理
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, nodeId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (draggedNodeId === nodeId) return; // 自分自身へのドラッグは無視

        // ドラッグ中のノードが対象ノードの子孫かチェック
        const isDescendant = (parentId: string, childId: string): boolean => {
            const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
                for (const node of nodes) {
                    if (node.id === id) return node;
                    if (node.children.length > 0) {
                        const found = findNode(node.children, id);
                        if (found) return found;
                    }
                }
                return null;
            };

            const parent = findNode(tree, parentId);
            if (!parent) return false;

            const checkChildren = (nodes: TreeNode[]): boolean => {
                for (const node of nodes) {
                    if (node.id === childId) return true;
                    if (node.children.length > 0 && checkChildren(node.children)) return true;
                }
                return false;
            };

            return checkChildren(parent.children);
        };

        // 子孫へのドラッグは無視
        if (isDescendant(nodeId, draggedNodeId!)) return;

        setDragOverNodeId(nodeId);
        setIsDraggingOverRoot(false);

        // マウス位置に基づいてドロップ位置を決定
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;

        if (y < rect.height * 0.25) {
            setDragPosition('before');
        } else if (y > rect.height * 0.75) {
            setDragPosition('after');
        } else {
            setDragPosition('inside');
        }
    };

    // ドラッグリーブ時の処理
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverNodeId(null);
        setDragPosition(null);
    };

    // プロセッシング関数
    const processNodeForBeforeInsertion = (node: TreeNode, targetNodeId: string, sourceNode: TreeNode): TreeNode => {
        if (node.children.length > 0) {
            const newChildren = node.children.reduce<TreeNode[]>((acc, child) => {
                if (child.id === targetNodeId) {
                    acc.push(sourceNode, child); // ディープコピーではなく元のノードを使用
                } else {
                    acc.push(processNodeForBeforeInsertion(child, targetNodeId, sourceNode));
                }
                return acc;
            }, []);

            return { ...node, children: newChildren };
        }

        return node;
    };

    const processNodeForAfterInsertion = (node: TreeNode, targetNodeId: string, sourceNode: TreeNode): TreeNode => {
        if (node.children.length > 0) {
            const newChildren = node.children.reduce<TreeNode[]>((acc, child) => {
                if (child.id === targetNodeId) {
                    acc.push(child, sourceNode); // ディープコピーではなく元のノードを使用
                } else {
                    acc.push(processNodeForAfterInsertion(child, targetNodeId, sourceNode));
                }
                return acc;
            }, []);

            return { ...node, children: newChildren };
        }

        return node;
    };

    // ドロップ時の処理
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetNodeId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedNodeId || draggedNodeId === targetNodeId) {
            // ドラッグされていないか、自分自身へのドロップは無視
            return;
        }

        try {
            // ドラッグされたノードを見つける
            const { node: sourceNode, path: sourcePath } = findNode(draggedNodeId);

            if (!sourceNode) {
                console.error('ドラッグされたノードが見つかりません');
                return;
            }

            // ターゲットノードが子孫かチェック
            const { path: targetPath } = findNode(targetNodeId);
            if (targetPath.includes(draggedNodeId)) {
                console.error('子孫ノードへのドロップはできません');
                return;
            }

            // 現在のツリーからソースノードを削除
            const treeWithoutSource = removeNode(draggedNodeId, [...tree]);

            // ドロップ位置に基づいてノードを挿入
            let newTree: TreeNode[];

            if (dragPosition === 'inside') {
                // 子ノードとして追加
                newTree = treeWithoutSource.map((node) => {
                    if (node.id === targetNodeId) {
                        return {
                            ...node,
                            isExpanded: true, // 自動的に展開
                            children: [...node.children, sourceNode], // ディープコピーではなく元のノードを使用
                        };
                    }

                    if (node.children.length > 0) {
                        const newChildren = node.children.map((child) => {
                            if (child.id === targetNodeId) {
                                return {
                                    ...child,
                                    isExpanded: true, // 自動的に展開
                                    children: [...child.children, sourceNode], // ディープコピーではなく元のノードを使用
                                };
                            }
                            return child;
                        });

                        // 子ノードに変更があったかチェック
                        const hasChanges = newChildren.some((child, index) => child !== node.children[index]);

                        if (hasChanges) {
                            return { ...node, children: newChildren };
                        }
                    }

                    return node;
                });
            } else if (dragPosition === 'before') {
                // ターゲットノードの前に挿入
                newTree = [];

                for (const node of treeWithoutSource) {
                    if (node.id === targetNodeId) {
                        // ルートレベルでの前挿入
                        newTree.push(sourceNode); // ディープコピーではなく元のノードを使用
                        newTree.push(node);
                    } else {
                        // 子ノードでの前挿入を処理
                        const processedNode = processNodeForBeforeInsertion(node, targetNodeId, sourceNode); // ディープコピーではなく元のノードを使用
                        newTree.push(processedNode);
                    }
                }
            } else {
                // after
                // ターゲットノードの後に挿入
                newTree = [];

                for (const node of treeWithoutSource) {
                    if (node.id === targetNodeId) {
                        // ルートレベルでの後挿入
                        newTree.push(node);
                        newTree.push(sourceNode); // ディープコピーではなく元のノードを使用
                    } else {
                        // 子ノードでの後挿入を処理
                        const processedNode = processNodeForAfterInsertion(node, targetNodeId, sourceNode); // ディープコピーではなく元のノードを使用
                        newTree.push(processedNode);
                    }
                }
            }

            setTree(newTree);

            // リセット
            setDraggedNodeId(null);
            setDragOverNodeId(null);
            setDragPosition(null);
            setIsDraggingOverRoot(false);
        } catch (error) {
            console.error('ドロップ処理中にエラーが発生しました:', error);
        }
    };

    // ルートレベルへのドラッグオーバー
    const handleRootDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedNodeId) return;

        setIsDraggingOverRoot(true);
        setDragOverNodeId(null);
        setDragPosition(null);
    };

    // ルートエリアからのドラッグリーブ
    const handleRootDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOverRoot(false);
    };

    // ルートレベルへのドロップ処理
    const handleRootDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedNodeId) return;

        try {
            // ドラッグされたノードを見つける
            const { node: sourceNode } = findNode(draggedNodeId);

            if (!sourceNode) {
                console.error('ドラッグされたノードが見つかりません');
                return;
            }

            // 現在のツリーからソースノードを削除
            const treeWithoutSource = removeNode(draggedNodeId, [...tree]);

            // ルートレベルに追加
            setTree([...treeWithoutSource, sourceNode]); // ディープコピーではなく元のノードを使用

            // リセット
            setDraggedNodeId(null);
            setDragOverNodeId(null);
            setDragPosition(null);
            setIsDraggingOverRoot(false);
        } catch (error) {
            console.error('ドロップ処理中にエラーが発生しました:', error);
        }
    };

    return {
        draggedNodeId,
        dragOverNodeId,
        dragPosition,
        isDraggingOverRoot,
        handleDragStart,
        handleDragEnd,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        handleRootDragOver,
        handleRootDragLeave,
        handleRootDrop,
    };
}
