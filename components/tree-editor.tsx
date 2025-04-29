'use client';

import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import type React from 'react';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Plus,
    Edit,
    Trash,
    Save,
    X,
    Info,
    Search,
    Settings,
    HelpCircle,
    ChevronRight,
    BookTemplate,
    ChevronDown,
    Download,
    Upload,
    RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SearchResults } from './search-results';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// インポート部分
import { validateImportData, createExportData } from '@/utils/tree-data-utils';
import { toast } from '@/components/ui/use-toast';
import { getSampleById, organizationSample, type SampleType, allSamples } from '@/utils/sample-data';
import { WorkspaceManager } from './workspace-manager';
import type { Workspace } from '@/utils/workspace-utils';
import { loadWorkspaceList, loadWorkspace, createWorkspace, saveWorkspace } from '@/utils/workspace-utils';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuGroup } from '@/components/ui/dropdown-menu';

// 追加のインポート
import { useI18n } from '@/utils/i18n/i18n-context';
import { LanguageSwitcher } from './language-switcher';

// モーダルのインポート
import { NodeTypeModal } from './node-type-modal';
import { NodeDetailModal } from './node-detail-modal';
import { NodeCreateModal } from './node-create-modal';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// 検索機能のカスタムフックをインポート
import { useSearch } from './tree-editor/hooks/use-search';
import { isNodeInHighlightedPath, hasHighlightedDescendant, getNodeTypeInfo } from './tree-editor/utils/search-utils';

// 型定義
export interface CustomFieldDefinition {
    id: string;
    name: string;
    type: 'text' | 'textarea' | 'link' | 'youtube' | 'image' | 'audio';
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
    type: 'text' | 'textarea' | 'link' | 'youtube' | 'image' | 'audio';
    definitionId?: string;
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

// 検索結果の型定義
export interface SearchResult {
    node: TreeNode;
    path: TreeNode[];
    matchField: string;
    matchValue: string;
}

// 初期ノードタイプデータと初期ツリーデータは、organizationSampleから取得
const initialNodeTypes = organizationSample.nodeTypes;
const initialTree = organizationSample.tree;

// 画像URLかどうかを判定する関数を修正
export const isImageUrl = (url?: string) => {
    return url?.startsWith && url?.startsWith('http');
};

// Base64画像かどうかを判定する関数
export const isBase64Image = (str?: string) => {
    return (
        str?.startsWith &&
        (str?.startsWith('data:image/') || str?.match(/^data:image\/(jpeg|png|gif|webp|svg\+xml);base64,/))
    );
};

// Base64音声かどうかを判定する関数
export const isBase64Audio = (str?: string) => {
    return str?.startsWith && str?.startsWith('data:audio/');
};

function TreeEditor() {
    const [tree, setTree] = useState<TreeNode[]>(initialTree);
    const [nodeTypes, setNodeTypes] = useState<NodeType[]>(initialNodeTypes);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<string>('');
    const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
    const [treeTitle, setTreeTitle] = useState<string>(organizationSample.treeTitle);
    const [isSearchHelpOpen, setIsSearchHelpOpen] = useState<boolean>(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false);
    const [currentSampleId, setCurrentSampleId] = useState<SampleType>('organization');

    // ワークスペース管理関連の状態
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
    const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);

    // TreeEditor関数内で、stateの宣言部分の後に以下を追加
    const [isImportDialogOpen, setIsImportDialogOpen] = useState<boolean>(false);
    const [importData, setImportData] = useState<string>('');
    const [importError, setImportError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 詳細モーダル用の状態
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

    // ノードタイプモーダル用の状態
    const [isNodeTypeModalOpen, setIsNodeTypeModalOpen] = useState<boolean>(false);
    const [selectedNodeType, setSelectedNodeType] = useState<NodeType | null>(null);

    // ノード作成モーダル用の状態
    const [isNodeCreateModalOpen, setIsNodeCreateModalOpen] = useState<boolean>(false);
    const [addingToParentId, setAddingToParentId] = useState<string | undefined>(undefined);

    // ドラッグ＆ドロップ用の状態
    const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
    const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
    const [dragPosition, setDragPosition] = useState<'before' | 'after' | 'inside' | null>(null);
    const [isDraggingOverRoot, setIsDraggingOverRoot] = useState<boolean>(false);

    const [isSampleSelectorOpen, setIsSampleSelectorOpen] = useState<boolean>(false);

    // i18n
    const { t } = useI18n();

    // 検索機能のカスタムフックを使用
    const {
        searchQuery,
        setSearchQuery,
        searchResults,
        selectedResultIndex,
        highlightedPath,
        focusMode,
        searchInputRef,
        searchResultsRef,
        searchResultsHeight,
        isSearchFocused,
        setIsSearchFocused,
        handleSelectSearchResult,
        handleOpenDetailModal: openDetailFromSearch,
        handleSearchKeyDown,
    } = useSearch({ tree, nodeTypes });

    // 自動保存のためのデバウンス関数
    const debouncedSaveWorkspace = useCallback((workspace: Workspace) => {
        saveWorkspace(workspace);
        setLastSaved(new Date().toISOString());
    }, []);

    // 現在のワークスペースデータを保存する関数
    const saveCurrentWorkspace = useCallback(() => {
        if (!activeWorkspaceId) return;

        const workspace: Workspace = {
            id: activeWorkspaceId,
            name: loadWorkspace(activeWorkspaceId)?.name || '無題のワークスペース',
            createdAt: loadWorkspace(activeWorkspaceId)?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tree,
            nodeTypes,
            treeTitle,
        };

        debouncedSaveWorkspace(workspace);
    }, [activeWorkspaceId, tree, nodeTypes, treeTitle, debouncedSaveWorkspace]);

    // ワークスペースを切り替える関数
    const handleWorkspaceChange = (workspace: Workspace) => {
        setTree(workspace.tree);
        setNodeTypes(workspace.nodeTypes);
        setTreeTitle(workspace.treeTitle);
        setActiveWorkspaceId(workspace.id);
        setLastSaved(workspace.updatedAt);
    };

    // 新しいワークスペースを作成する関数
    const handleCreateWorkspace = (name: string) => {
        // サンプルデータを初期値として使用
        const sample = getSampleById(currentSampleId) || organizationSample;

        // 新しいワークスペースを作成
        const newWorkspace = createWorkspace(name, {
            tree: sample.tree,
            nodeTypes: sample.nodeTypes,
            treeTitle: `${name}のツリー`,
        });

        // 作成したワークスペースを表示
        handleWorkspaceChange(newWorkspace);

        toast({
            title: t('toast.workspaceCreated'),
            description: `「${name}」を作成しました`,
            duration: 3000,
        });
    };

    // 初期化時にワークスペース情報を読み込む
    useEffect(() => {
        setIsWorkspaceLoading(true);

        const { activeWorkspaceId: storedWorkspaceId, workspaces } = loadWorkspaceList();

        // ワークスペースが存在しない場合は初期ワークスペースを作成
        if (workspaces.length === 0) {
            const sample = getSampleById('organization') || organizationSample;
            const newWorkspace = createWorkspace('デフォルトワークスペース', {
                tree: sample.tree,
                nodeTypes: sample.nodeTypes,
                treeTitle: '組織図',
            });

            handleWorkspaceChange(newWorkspace);
        } else if (storedWorkspaceId) {
            // アクティブなワークスペースを読み込む
            const workspace = loadWorkspace(storedWorkspaceId);
            if (workspace) {
                handleWorkspaceChange(workspace);
            }
        } else if (workspaces.length > 0) {
            // アクティブでない場合は最初のワークスペースを表示
            const workspace = loadWorkspace(workspaces[0].id);
            if (workspace) {
                handleWorkspaceChange(workspace);
            }
        }

        setIsWorkspaceLoading(false);
    }, []);

    // ツリーデータが変更されたときに自動保存
    useEffect(() => {
        if (!isWorkspaceLoading && activeWorkspaceId) {
            saveCurrentWorkspace();
        }
    }, [tree, nodeTypes, treeTitle, activeWorkspaceId, isWorkspaceLoading, saveCurrentWorkspace]);

    // サンプルを変更する関数
    const handleSelectSample = (sampleId: SampleType) => {
        const sample = getSampleById(sampleId);
        if (!sample) return;

        setTree(sample.tree);
        setNodeTypes(sample.nodeTypes);
        setTreeTitle(sample.treeTitle);
        setCurrentSampleId(sampleId);

        // アクティブなワークスペースがある場合は更新
        if (activeWorkspaceId) {
            saveCurrentWorkspace();
        }

        toast({
            title: 'サンプルを変更しました',
            description: `「${sample.name}」を読み込みました`,
            duration: 3000,
        });
    };

    // データをリセット
    const resetTreeData = () => {
        if (activeWorkspaceId) {
            const workspace = loadWorkspace(activeWorkspaceId);
            if (workspace) {
                // サンプルデータで現在のワークスペースをリセット
                const sample = getSampleById(currentSampleId) || organizationSample;

                setTree(sample.tree);
                setNodeTypes(sample.nodeTypes);
                setTreeTitle(sample.treeTitle);

                // 更新したデータを保存
                saveCurrentWorkspace();
            }
        } else {
            // ワークスペースがない場合は単にサンプルデータをセット
            const sample = getSampleById(currentSampleId) || organizationSample;
            setTree(sample.tree);
            setNodeTypes(sample.nodeTypes);
            setTreeTitle(sample.treeTitle);
        }

        setIsResetDialogOpen(false);

        toast({
            title: 'データをリセットしました',
            description: '初期状態に戻しました',
            duration: 3000,
        });
    };

    // ツリーデータをJSONとしてエクスポート
    const exportTreeData = () => {
        try {
            // エクスポートするデータを準備
            const exportData = createExportData(tree, nodeTypes, treeTitle);

            // JSONに変換
            const jsonData = JSON.stringify(exportData, null, 2);

            // ダウンロードリンクを作成
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${treeTitle.replace(/\s+/g, '-').toLowerCase()}-${
                new Date().toISOString().split('T')[0]
            }.json`;
            document.body.appendChild(link);
            link.click();

            // クリーンアップ
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({
                title: 'エクスポート完了',
                description: 'ツリーデータをJSONファイルとして保存しました',
                duration: 3000,
            });
        } catch (error) {
            console.error('エクスポート中にエラーが発生しました:', error);
            toast({
                title: 'エクスポートエラー',
                description: 'エクスポートに失敗しました',
                variant: 'destructive',
                duration: 5000,
            });
        }
    };

    // ファイル選択ダイアログを開く
    const openFileSelector = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // 選択されたファイルを読み込む
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                setImportData(content);
                setImportError(null);
                setIsImportDialogOpen(true);
            } catch (error) {
                console.error('ファイルの読み込みに失敗しました:', error);
                setImportError('ファイルの読み込みに失敗しました');
                toast({
                    title: 'インポートエラー',
                    description: 'ファイルの読み込みに失敗しました',
                    variant: 'destructive',
                    duration: 5000,
                });
            }
        };
        reader.onerror = () => {
            setImportError('ファイルの読み込みに失敗しました');
            toast({
                title: 'インポートエラー',
                description: 'ファイルの読み込みに失敗しました',
                variant: 'destructive',
                duration: 5000,
            });
        };
        reader.readAsText(file);

        // ファイル選択をリセット
        if (e.target) {
            e.target.value = '';
        }
    };

    // インポートを実行
    const executeImport = () => {
        try {
            if (!importData) {
                setImportError('インポートするデータがありません');
                return;
            }

            const parsedData = JSON.parse(importData);

            // データの検証
            const validation = validateImportData(parsedData);
            if (!validation.valid) {
                setImportError(validation.error || '無効なデータ形式です');
                return;
            }

            // データをインポート
            setTree(parsedData.tree);
            setNodeTypes(parsedData.nodeTypes);

            // タイトルがあれば設定
            if (parsedData.treeTitle) {
                setTreeTitle(parsedData.treeTitle);
            }

            // ワークスペースにデータを保存
            if (activeWorkspaceId) {
                saveCurrentWorkspace();
            }

            setIsImportDialogOpen(false);
            setImportData('');

            toast({
                title: 'インポート完了',
                description: 'ツリーデータを正常にインポートしました',
                duration: 3000,
            });
        } catch (error) {
            console.error('インポート中にエラーが発生しました:', error);
            setImportError('インポートに失敗しました。JSONの形式が正しくありません。');
            toast({
                title: 'インポートエラー',
                description: 'JSONの形式が正しくありません',
                variant: 'destructive',
                duration: 5000,
            });
        }
    };

    // 必要な関数を定義
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

    // ノードの展開/折りたたみを切り替える
    const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
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
    };

    // 子ノード追加モーダルを開く
    const openAddChildModal = (parentId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setAddingToParentId(parentId);
        setIsNodeCreateModalOpen(true);
    };

    // 新しいノードを追加する
    const handleAddNode = (newNode: TreeNode) => {
        if (addingToParentId) {
            // 子ノードとして追加
            const updateNode = (nodes: TreeNode[]): TreeNode[] => {
                return nodes.map((node) => {
                    if (node.id === addingToParentId) {
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
    };

    // ノードを削除
    const deleteNode = (nodeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTree(removeNode(nodeId, tree));
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

    // ノード名の編集を開始
    const startEditing = (node: TreeNode, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingNodeId(node.id);
        setEditingName(node.name);
    };

    // ノード名の編集を保存
    const saveNodeName = (e?: React.MouseEvent) => {
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
    };

    // ルートレベルに新しいノードを追加
    const addRootNode = () => {
        setAddingToParentId(undefined);
        setIsNodeCreateModalOpen(true);
    };

    // ノードをクリックして詳細モーダルを表示
    const handleNodeClick = (node: TreeNode) => {
        setSelectedNode(node);
        setIsDetailModalOpen(true);
    };

    // ノードの詳細情報を更新
    const updateNodeDetails = (updatedNode: TreeNode) => {
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

        // selectedNode も更新して UI に即時反映させる
        setSelectedNode(updatedNode);
    };

    // ノードのアイコンを取得する関数
    const getNodeIcon = (node: TreeNode): string | undefined => {
        // ノード自身のアイコンが設定されている場合はそれを使用
        if (node.icon) {
            return node.icon;
        }

        // ノードタイプが設定されている場合はノードタイプのアイコンを使用
        if (node.nodeType) {
            const nodeType = nodeTypes.find((type) => type.id === node.nodeType);
            if (nodeType) {
                return nodeType.icon;
            }
        }

        // どちらも設定されていない場合は undefined を返す
        return undefined;
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

        // マウス位置に基づいてドロップ  return

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

    // ルートエリアへのドラッグオーバー
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

    // ツリーノードをレンダリング
    const renderNode = (node: TreeNode, depth = 0) => {
        const hasChildren = node.children.length > 0;
        const isHighlighted = highlightedPath.has(node.id);
        const nodeTypeInfo = getNodeTypeInfo(nodeTypes, node.nodeType);
        const nodeIcon = getNodeIcon(node);

        // フォーカスモードが有効で、このノードがハイライトパスに含まれていない場合は表示しない
        if (focusMode && !isHighlighted) {
            return null;
        }

        return (
            <div
                key={node.id}
                className={cn(
                    'select-none',
                    draggedNodeId === node.id && 'opacity-50',
                    dragOverNodeId === node.id && dragPosition === 'inside' && 'bg-primary/10 rounded-md',
                )}
                draggable
                onDragStart={(e) => handleDragStart(e, node.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, node.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, node.id)}
            >
                {dragOverNodeId === node.id && dragPosition === 'before' && (
                    <div className='h-1 bg-primary rounded-full -mt-0.5 mb-1' />
                )}

                <div
                    className={cn(
                        'flex items-center py-1 px-2 rounded-md group cursor-pointer',
                        depth > 0 && 'ml-6',
                        isHighlighted ? 'bg-blue-100' : 'hover:bg-muted/50',
                    )}
                    onClick={() => handleNodeClick(node)}
                >
                    {hasChildren ? (
                        <button onClick={(e) => toggleExpand(node.id, e)} className='mr-1 text-muted-foreground'>
                            {node.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                    ) : (
                        <div className='w-4 mr-1' />
                    )}

                    {editingNodeId === node.id ? (
                        <div className='flex items-center flex-1' onClick={(e) => e.stopPropagation()}>
                            <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className='h-7 py-1 mr-2'
                                autoFocus
                            />
                            <Button size='icon' variant='ghost' onClick={saveNodeName} className='h-7 w-7'>
                                <Save size={16} />
                            </Button>
                            <Button
                                size='icon'
                                variant='ghost'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingNodeId(null);
                                }}
                                className='h-7 w-7'
                            >
                                <X size={16} />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className='flex items-center flex-1'>
                                <span className='flex-shrink-0 mr-2'>
                                    {nodeIcon && (
                                        <span
                                            className={cn(
                                                'flex items-center justify-center',
                                                nodeIcon.length > 2 && !isImageUrl(nodeIcon) && !isBase64Image(nodeIcon)
                                                    ? 'text-lg'
                                                    : 'w-5 h-5',
                                            )}
                                        >
                                            {isImageUrl(nodeIcon) || isBase64Image(nodeIcon) ? (
                                                <img
                                                    src={nodeIcon || '/placeholder.svg'}
                                                    alt=''
                                                    className='w-5 h-5 object-cover rounded-sm'
                                                />
                                            ) : (
                                                <span className='text-2xl'>{nodeIcon}</span>
                                            )}
                                        </span>
                                    )}
                                </span>
                                <span>{node.name}</span>
                                {nodeTypeInfo && (
                                    <span className='ml-2 text-xs px-2 py-0.5 bg-muted/50 rounded-full text-muted-foreground'>
                                        {nodeTypeInfo.name}
                                    </span>
                                )}
                                {node.customFields && node.customFields.length > 0 && (
                                    <Info size={14} className='ml-2 text-muted-foreground' />
                                )}
                            </div>
                            <div
                                className='opacity-0 group-hover:opacity-100 flex'
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Button
                                    size='icon'
                                    variant='ghost'
                                    onClick={(e) => openAddChildModal(node.id, e)}
                                    className='h-7 w-7'
                                >
                                    <Plus size={16} />
                                </Button>
                                <Button
                                    size='icon'
                                    variant='ghost'
                                    onClick={(e) => startEditing(node, e)}
                                    className='h-7 w-7'
                                >
                                    <Edit size={16} />
                                </Button>
                                <Button
                                    size='icon'
                                    variant='ghost'
                                    onClick={(e) => deleteNode(node.id, e)}
                                    className='h-7 w-7'
                                >
                                    <Trash size={16} />
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                {dragOverNodeId === node.id && dragPosition === 'after' && (
                    <div className='h-1 bg-primary rounded-full mt-1' />
                )}

                {hasChildren && node.isExpanded && (
                    <div className='ml-4'>
                        {node.children
                            .map((childNode) => {
                                // フォーカスモードが有効で、この子ノードがハイライトパスに含まれていない場合はスキップ
                                if (
                                    focusMode &&
                                    !isNodeInHighlightedPath(childNode, highlightedPath) &&
                                    !hasHighlightedDescendant(childNode, highlightedPath)
                                ) {
                                    return null;
                                }
                                return renderNode(childNode, depth + 1);
                            })
                            .filter(Boolean)}
                    </div>
                )}
            </div>
        );
    };

    // ヘッダー部分にワークスペース管理とエクスポート/インポートボタンを追加
    return (
        <div className='border rounded-lg p-4'>
            <div className='mb-4'>
                {isEditingTitle ? (
                    <div className='flex items-center w-full'>
                        <Input
                            value={treeTitle}
                            onChange={(e) => setTreeTitle(e.target.value)}
                            className='h-9 py-1 mr-2 text-xl font-semibold flex-1'
                            autoFocus
                        />
                        <Button
                            size='icon'
                            variant='outline'
                            onClick={() => setIsEditingTitle(false)}
                            className='h-9 w-9'
                        >
                            <Save size={16} />
                        </Button>
                        <Button
                            size='icon'
                            variant='outline'
                            onClick={() => {
                                setIsEditingTitle(false);
                                setTreeTitle('ツリー構造'); // Reset to default if canceled
                            }}
                            className='h-9 w-9 ml-2'
                        >
                            <X size={16} />
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className='flex flex-wrap items-center justify-between gap-2 mb-2'>
                            <div className='flex items-center'>
                                <h2
                                    className='text-xl font-semibold cursor-pointer hover:text-primary flex items-center mr-2'
                                    onClick={() => setIsEditingTitle(true)}
                                >
                                    {treeTitle}
                                    <Edit size={14} className='ml-2 opacity-50' />
                                </h2>
                                {lastSaved && (
                                    <span className='text-xs text-muted-foreground whitespace-nowrap'>
                                        {t('common.lastSaved')}: {new Date(lastSaved).toLocaleTimeString()}
                                    </span>
                                )}
                            </div>

                            <div className='flex items-center gap-2'>
                                <WorkspaceManager
                                    activeWorkspaceId={activeWorkspaceId}
                                    onWorkspaceChange={handleWorkspaceChange}
                                    onCreateWorkspace={handleCreateWorkspace}
                                />

                                <LanguageSwitcher />

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant='outline' size='sm' className='h-9'>
                                            <span>{t('header.file')}</span>
                                            <ChevronDown size={14} className='ml-1' />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align='end' className='w-56'>
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem onClick={exportTreeData}>
                                                <Download size={16} className='mr-2' />
                                                <span>{t('common.export')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={openFileSelector}>
                                                <Upload size={16} className='mr-2' />
                                                <span>{t('common.import')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setIsSampleSelectorOpen(true)}>
                                                <BookTemplate size={16} className='mr-2' />
                                                <span>{t('header.sampleSelection')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant='outline' size='sm' className='h-9'>
                                            <span>{t('header.settings')}</span>
                                            <ChevronDown size={14} className='ml-1' />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align='end' className='w-56'>
                                        <DropdownMenuGroup>
                                            <DropdownMenuItem onClick={() => setIsNodeTypeModalOpen(true)}>
                                                <Settings size={16} className='mr-2' />
                                                <span>{t('header.nodeTypeManagement')}</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setIsResetDialogOpen(true)}>
                                                <RotateCcw size={16} className='mr-2' />
                                                <span>{t('common.reset')}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuGroup>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button onClick={addRootNode} size='sm' className='h-9'>
                                    <Plus size={16} className='mr-2' />
                                    <span>{t('header.addRootNode')}</span>
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* 検索機能 */}
            <div className='mb-4 relative'>
                <div className='relative flex items-center'>
                    <Search className='absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
                    <Input
                        ref={searchInputRef}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => {
                            // 少し遅延させてクリックイベントが先に処理されるようにする
                            setTimeout(() => setIsSearchFocused(false), 200);
                        }}
                        placeholder={t('search.placeholder')}
                        className='pl-8 pr-10'
                    />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    className='absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7'
                                    onClick={() => setIsSearchHelpOpen(!isSearchHelpOpen)}
                                >
                                    <HelpCircle size={16} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side='bottom' className='w-80 p-3'>
                                <div className='space-y-2'>
                                    <h3 className='font-semibold'>検索構文</h3>
                                    <ul className='text-xs space-y-1'>
                                        <li>
                                            <span className='font-medium'>通常検索:</span> テキストをそのまま入力
                                        </li>
                                        <li>
                                            <span className='font-medium'>ノードタイプ検索:</span> type:タイプ名
                                        </li>
                                        <li>
                                            <span className='font-medium'>フィールド検索:</span> フィールド名:値
                                        </li>
                                        <li>
                                            <span className='font-medium'>複合検索:</span> type:社員 部署:営業部 鈴木
                                        </li>
                                    </ul>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                {isSearchHelpOpen && (
                    <div className='mt-2 p-3 bg-muted/30 rounded-md text-sm'>
                        <h3 className='font-semibold mb-2'>検索ヘルプ</h3>
                        <div className='space-y-2'>
                            <div>
                                <p className='font-medium'>基本検索</p>
                                <p className='text-xs text-muted-foreground'>
                                    ノード名、サムネイル、フィールド値を検索します。
                                </p>
                                <p className='text-xs bg-muted/50 p-1 rounded mt-1'>例: 鈴木</p>
                            </div>
                            <div>
                                <p className='font-medium'>ノードタイプ検索</p>
                                <p className='text-xs text-muted-foreground'>特定のノードタイプを検索します。</p>
                                <p className='text-xs bg-muted/50 p-1 rounded mt-1'>例: type:社員</p>
                            </div>
                            <div>
                                <p className='font-medium'>フィールド検索</p>
                                <p className='text-xs text-muted-foreground'>特定のフィールドの値を検索します。</p>
                                <p className='text-xs bg-muted/50 p-1 rounded mt-1'>例: 部署:営業部</p>
                            </div>
                            <div>
                                <p className='font-medium'>複合検索</p>
                                <p className='text-xs text-muted-foreground'>複数の条件を組み合わせて検索します。</p>
                                <p className='text-xs bg-muted/50 p-1 rounded mt-1'>例: type:社員 部署:営業部 鈴木</p>
                            </div>
                        </div>
                        <Button
                            variant='outline'
                            size='sm'
                            className='mt-2 w-full'
                            onClick={() => setIsSearchHelpOpen(false)}
                        >
                            閉じる
                        </Button>
                    </div>
                )}

                {/* 検索結果 */}
                {searchResults.length > 0 && isSearchFocused && (
                    <SearchResults
                        ref={searchResultsRef}
                        results={searchResults}
                        selectedIndex={selectedResultIndex}
                        onSelect={handleSelectSearchResult}
                        onOpen={openDetailFromSearch}
                        className='absolute z-10 w-full bg-white border rounded-md shadow-md max-h-60 overflow-y-auto'
                    />
                )}
            </div>

            <div
                className={cn(
                    'space-y-1 transition-all duration-200 min-h-[200px] relative',
                    isDraggingOverRoot && 'bg-primary/5 border-2 border-dashed border-primary/30 rounded-md p-2',
                )}
                style={{ marginTop: searchResultsHeight > 0 && isSearchFocused ? searchResultsHeight + 8 : 0 }}
                onDragOver={handleRootDragOver}
                onDragLeave={handleRootDragLeave}
                onDrop={handleRootDrop}
            >
                {isDraggingOverRoot && (
                    <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                        <p className='text-primary/70 text-sm font-medium'>{t('tree.dropHere')}</p>
                    </div>
                )}
                {tree.map((node) => renderNode(node))}
            </div>

            {/* 詳細モーダル */}
            <NodeDetailModal
                node={
                    selectedNode || {
                        id: '',
                        name: '',
                        children: [],
                        customFields: [],
                    }
                }
                open={isDetailModalOpen && selectedNode !== null}
                onOpenChange={setIsDetailModalOpen}
                onUpdateNode={updateNodeDetails}
                nodeTypes={nodeTypes}
            />

            {/* ノードタイプ管理モーダル */}
            <NodeTypeModal
                open={isNodeTypeModalOpen}
                onOpenChange={setIsNodeTypeModalOpen}
                nodeTypes={nodeTypes}
                onSaveNodeTypes={setNodeTypes}
                currentNodeType={selectedNodeType}
                onSelectNodeType={setSelectedNodeType}
            />

            {/* ノード作成モーダル */}
            <NodeCreateModal
                open={isNodeCreateModalOpen}
                onOpenChange={setIsNodeCreateModalOpen}
                onCreateNode={handleAddNode}
                nodeTypes={nodeTypes}
                parentNodeId={addingToParentId}
            />

            {/* インポートダイアログ */}
            <AlertDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ツリーデータのインポート</AlertDialogTitle>
                        <AlertDialogDescription>
                            JSON形式のツリーデータをインポートします。現在のデータは上書きされます。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className='grid gap-4 py-4'>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='importData' className='text-right'>
                                JSONデータ
                            </Label>
                            <Textarea
                                id='importData'
                                className='col-span-3'
                                value={importData}
                                onChange={(e) => {
                                    setImportData(e.target.value);
                                    setImportError(null);
                                }}
                                placeholder='ここにJSONデータを貼り付けてください'
                            />
                        </div>
                        {importError && <p className='text-red-500 text-sm'>{importError}</p>}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setImportData('')}>キャンセル</AlertDialogCancel>
                        <AlertDialogAction onClick={executeImport}>インポート</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* リセット確認ダイアログ */}
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogContent className='sm:max-w-md'>
                    <DialogHeader>
                        <DialogTitle>{t('dialogs.reset.title')}</DialogTitle>
                        <DialogDescription>{t('dialogs.reset.description')}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setIsResetDialogOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant='destructive' onClick={resetTreeData}>
                            {t('common.reset')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* サンプル選択モーダル */}
            <Dialog open={isSampleSelectorOpen} onOpenChange={setIsSampleSelectorOpen}>
                <DialogContent className='sm:max-w-md'>
                    <DialogHeader>
                        <DialogTitle>{t('header.sampleSelection')}</DialogTitle>
                        <DialogDescription>
                            サンプルデータを選択してください。現在のデータは上書きされます。
                        </DialogDescription>
                    </DialogHeader>
                    <div className='py-4'>
                        <RadioGroup
                            value={currentSampleId}
                            onValueChange={(value) => setCurrentSampleId(value as SampleType)}
                            className='space-y-3'
                        >
                            {allSamples.map((sample) => (
                                <div
                                    key={sample.id}
                                    className={`flex items-center space-x-2 rounded-md border p-3 ${
                                        currentSampleId === sample.id ? 'border-primary bg-primary/5' : ''
                                    }`}
                                >
                                    <RadioGroupItem value={sample.id} id={sample.id} />
                                    <Label htmlFor={sample.id} className='flex-1 cursor-pointer'>
                                        <div className='font-medium'>{sample.name}</div>
                                        <div className='text-sm text-muted-foreground'>{sample.description}</div>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setIsSampleSelectorOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={() => {
                                handleSelectSample(currentSampleId);
                                setIsSampleSelectorOpen(false);
                            }}
                        >
                            {t('common.save')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ファイル選択用のInput要素（非表示） */}
            <input
                type='file'
                style={{ display: 'none' }}
                accept='.json'
                onChange={handleFileChange}
                ref={fileInputRef}
            />
        </div>
    );
}

export default TreeEditor;
