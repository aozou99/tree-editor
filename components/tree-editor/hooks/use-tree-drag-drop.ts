'use client';

import { useState } from 'react';
import type { TreeNode } from '../types';

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
            // 子ノードの配列を作成する前に、まず子ノードにターゲットノードが含まれているか確認
            const hasTargetNode = node.children.some((child) => child.id === targetNodeId);

            if (hasTargetNode) {
                // ターゲットノードが直接の子である場合、新しい子ノード配列を作成
                const newChildren: TreeNode[] = [];

                for (const child of node.children) {
                    if (child.id === targetNodeId) {
                        newChildren.push(sourceNode); // 先にソースノードを追加
                        newChildren.push(child); // 次にターゲットノードを追加
                    } else if (child.id !== sourceNode.id) {
                        // ソースノード自体は既に削除されているので、これは必要ない
                        newChildren.push(child);
                    }
                }

                return { ...node, children: newChildren };
            } else {
                // ターゲットノードが直接の子でない場合は、再帰的に子ノードを処理
                return {
                    ...node,
                    children: node.children.map((child) =>
                        processNodeForBeforeInsertion(child, targetNodeId, sourceNode),
                    ),
                };
            }
        }

        return node;
    };

    const processNodeForAfterInsertion = (node: TreeNode, targetNodeId: string, sourceNode: TreeNode): TreeNode => {
        if (node.children.length > 0) {
            // 子ノードの配列を作成する前に、まず子ノードにターゲットノードが含まれているか確認
            const hasTargetNode = node.children.some((child) => child.id === targetNodeId);

            if (hasTargetNode) {
                // ターゲットノードが直接の子である場合、新しい子ノード配列を作成
                const newChildren: TreeNode[] = [];

                for (const child of node.children) {
                    if (child.id === targetNodeId) {
                        newChildren.push(child); // 先にターゲットノードを追加
                        newChildren.push(sourceNode); // 次にソースノードを追加
                    } else if (child.id !== sourceNode.id) {
                        // ソースノード自体は既に削除されているので、これは必要ない
                        newChildren.push(child);
                    }
                }

                return { ...node, children: newChildren };
            } else {
                // ターゲットノードが直接の子でない場合は、再帰的に子ノードを処理
                return {
                    ...node,
                    children: node.children.map((child) =>
                        processNodeForAfterInsertion(child, targetNodeId, sourceNode),
                    ),
                };
            }
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

            // ターゲットノードとその情報を取得
            const { node: targetNode, path: targetPath } = findNode(targetNodeId);
            if (!targetNode) {
                console.error('ターゲットノードが見つかりません');
                return;
            }

            // ターゲットノードが子孫かチェック
            if (targetPath.includes(draggedNodeId)) {
                console.error('子孫ノードへのドロップはできません');
                return;
            }

            // ノードのディープコピーを作成し、確実にソースノードの参照を保持
            const sourceNodeCopy = JSON.parse(JSON.stringify(sourceNode));

            // 新しいツリーを構築する関数
            const buildNewTree = () => {
                // まずツリーのディープコピーを作成
                const newTreeCopy: TreeNode[] = JSON.parse(JSON.stringify(tree));

                // ソースノードを削除
                const removeSourceNode = (nodes: TreeNode[]): TreeNode[] => {
                    return nodes
                        .filter((node) => node.id !== draggedNodeId)
                        .map((node) => ({
                            ...node,
                            children: node.children.length > 0 ? removeSourceNode(node.children) : node.children,
                        }));
                };

                const treeWithoutSource = removeSourceNode(newTreeCopy);

                // ターゲットノードを見つけて操作を適用
                if (dragPosition === 'inside') {
                    // 子ノードとして追加
                    const addAsChild = (nodes: TreeNode[]): TreeNode[] => {
                        return nodes.map((node) => {
                            if (node.id === targetNodeId) {
                                return {
                                    ...node,
                                    isExpanded: true,
                                    children: [...node.children, sourceNodeCopy],
                                };
                            }
                            return {
                                ...node,
                                children: node.children.length > 0 ? addAsChild(node.children) : node.children,
                            };
                        });
                    };

                    return addAsChild(treeWithoutSource);
                } else if (dragPosition === 'before') {
                    // ノードの前に追加
                    if (targetPath.length <= 1) {
                        // ルートレベルのノード
                        const result: TreeNode[] = [];
                        for (const node of treeWithoutSource) {
                            if (node.id === targetNodeId) {
                                result.push(sourceNodeCopy);
                                result.push(node);
                            } else {
                                result.push(node);
                            }
                        }
                        return result;
                    } else {
                        // ネストされたノード
                        const insertBefore = (nodes: TreeNode[], pathIndex = 0): TreeNode[] => {
                            return nodes.map((node) => {
                                if (node.id === targetPath[pathIndex]) {
                                    if (pathIndex === targetPath.length - 2) {
                                        // 親ノードに到達
                                        const newChildren: TreeNode[] = [];
                                        for (const child of node.children) {
                                            if (child.id === targetPath[pathIndex + 1]) {
                                                newChildren.push(sourceNodeCopy);
                                                newChildren.push(child);
                                            } else {
                                                newChildren.push(child);
                                            }
                                        }
                                        return { ...node, children: newChildren };
                                    } else {
                                        // まだ到達していない、さらに深く探索
                                        return {
                                            ...node,
                                            children: insertBefore(node.children, pathIndex + 1),
                                        };
                                    }
                                }
                                return node;
                            });
                        };

                        return insertBefore(treeWithoutSource);
                    }
                } else {
                    // after
                    // ノードの後に追加
                    if (targetPath.length <= 1) {
                        // ルートレベルのノード
                        const result: TreeNode[] = [];
                        for (const node of treeWithoutSource) {
                            if (node.id === targetNodeId) {
                                result.push(node);
                                result.push(sourceNodeCopy);
                            } else {
                                result.push(node);
                            }
                        }
                        return result;
                    } else {
                        // ネストされたノード
                        const insertAfter = (nodes: TreeNode[], pathIndex = 0): TreeNode[] => {
                            return nodes.map((node) => {
                                if (node.id === targetPath[pathIndex]) {
                                    if (pathIndex === targetPath.length - 2) {
                                        // 親ノードに到達
                                        const newChildren: TreeNode[] = [];
                                        for (const child of node.children) {
                                            if (child.id === targetPath[pathIndex + 1]) {
                                                newChildren.push(child);
                                                newChildren.push(sourceNodeCopy);
                                            } else {
                                                newChildren.push(child);
                                            }
                                        }
                                        return { ...node, children: newChildren };
                                    } else {
                                        // まだ到達していない、さらに深く探索
                                        return {
                                            ...node,
                                            children: insertAfter(node.children, pathIndex + 1),
                                        };
                                    }
                                }
                                return node;
                            });
                        };

                        return insertAfter(treeWithoutSource);
                    }
                }
            };

            // 新しいツリーを構築して設定
            const newTree = buildNewTree();
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

    // ネストされたツリー内の特定のノードの前に挿入する再帰関数
    const insertBeforeInNestedTree = (node: TreeNode, targetPath: string[], sourceNode: TreeNode): TreeNode => {
        if (targetPath.length === 0) {
            return node;
        }

        // 現在のノードがターゲットパスの一部かどうか確認
        if (node.id === targetPath[0]) {
            if (targetPath.length === 1) {
                // このノードがターゲットノード
                return node;
            }

            // このノードはターゲットの祖先
            const remainingPath = targetPath.slice(1);
            // 最後のパス要素がターゲットノード自体
            if (remainingPath.length === 1) {
                // ターゲットが直接の子である
                const newChildren: TreeNode[] = [];

                for (const child of node.children) {
                    if (child.id === remainingPath[0]) {
                        // ターゲットの前に挿入
                        newChildren.push(sourceNode);
                        newChildren.push(child);
                    } else {
                        newChildren.push(child);
                    }
                }

                return { ...node, children: newChildren };
            } else {
                // さらに階層が深い
                return {
                    ...node,
                    children: node.children.map((child) => insertBeforeInNestedTree(child, remainingPath, sourceNode)),
                };
            }
        }

        return node;
    };

    // ネストされたツリー内の特定のノードの後に挿入する再帰関数
    const insertAfterInNestedTree = (node: TreeNode, targetPath: string[], sourceNode: TreeNode): TreeNode => {
        if (targetPath.length === 0) {
            return node;
        }

        // 現在のノードがターゲットパスの一部かどうか確認
        if (node.id === targetPath[0]) {
            if (targetPath.length === 1) {
                // このノードがターゲットノード
                return node;
            }

            // このノードはターゲットの祖先
            const remainingPath = targetPath.slice(1);
            // 最後のパス要素がターゲットノード自体
            if (remainingPath.length === 1) {
                // ターゲットが直接の子である
                const newChildren: TreeNode[] = [];

                for (const child of node.children) {
                    if (child.id === remainingPath[0]) {
                        // ターゲットの後に挿入
                        newChildren.push(child);
                        newChildren.push(sourceNode);
                    } else {
                        newChildren.push(child);
                    }
                }

                return { ...node, children: newChildren };
            } else {
                // さらに階層が深い
                return {
                    ...node,
                    children: node.children.map((child) => insertAfterInNestedTree(child, remainingPath, sourceNode)),
                };
            }
        }

        return node;
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
