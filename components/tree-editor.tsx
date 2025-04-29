'use client';

import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { SearchResults } from './tree-editor/features/search-results';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// ツリーエディターのコンポーネントとフックをインポート
import { TreeNodeComponent } from './tree-editor/core/tree-node';
import { TreeHeader } from './tree-editor/core/tree-header';
import { useTreeDragDrop } from './tree-editor/hooks/use-tree-drag-drop';

// インポート部分
import { validateImportData, createExportData } from '@/components/tree-editor/utils/tree-data-utils';
import { toast } from '@/components/ui/use-toast';
import {
    getSampleById,
    organizationSample,
    type SampleType,
    allSamples,
} from '@/components/tree-editor/features/sample-selector/sample-data';
import type { Workspace } from '@/components/tree-editor/utils/workspace-utils';
import {
    loadWorkspaceList,
    loadWorkspace,
    createWorkspace,
    saveWorkspace,
} from '@/components/tree-editor/utils/workspace-utils';

// 追加のインポート
import { useI18n } from '@/utils/i18n/i18n-context';

// モーダルのインポート
import { NodeTypeModal } from './tree-editor/modals/node-type-modal';
import { NodeDetailModal } from './tree-editor/modals/node-detail-modal';
import { NodeCreateModal } from './tree-editor/modals/node-create-modal';

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

// 型定義
import { NodeType, TreeNode } from './tree-editor/types';

// 初期ノードタイプデータと初期ツリーデータは、organizationSampleから取得
const initialNodeTypes = organizationSample.nodeTypes;
const initialTree = organizationSample.tree;

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

    // サンプル選択モーダル
    const [isSampleSelectorOpen, setIsSampleSelectorOpen] = useState<boolean>(false);

    // i18n
    const { t } = useI18n();

    // ドラッグ＆ドロップのカスタムフックを使用
    const {
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
    } = useTreeDragDrop(tree, setTree);

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

    // 編集のキャンセル
    const cancelEditing = () => {
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

    return (
        <div className='border rounded-lg p-4'>
            {/* ヘッダー部分 */}
            <TreeHeader
                treeTitle={treeTitle}
                isEditingTitle={isEditingTitle}
                lastSaved={lastSaved}
                activeWorkspaceId={activeWorkspaceId}
                setTreeTitle={setTreeTitle}
                setIsEditingTitle={setIsEditingTitle}
                handleWorkspaceChange={handleWorkspaceChange}
                handleCreateWorkspace={handleCreateWorkspace}
                exportTreeData={exportTreeData}
                openFileSelector={openFileSelector}
                setIsSampleSelectorOpen={setIsSampleSelectorOpen}
                setIsNodeTypeModalOpen={setIsNodeTypeModalOpen}
                setIsResetDialogOpen={setIsResetDialogOpen}
                addRootNode={addRootNode}
            />

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

            {/* ツリーノードコンテナ */}
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
                {tree.map((node) => (
                    <TreeNodeComponent
                        key={node.id}
                        node={node}
                        nodeTypes={nodeTypes}
                        highlightedPath={highlightedPath}
                        focusMode={focusMode}
                        editingNodeId={editingNodeId}
                        editingName={editingName}
                        draggedNodeId={draggedNodeId}
                        dragOverNodeId={dragOverNodeId}
                        dragPosition={dragPosition}
                        onToggleExpand={toggleExpand}
                        onAddChild={openAddChildModal}
                        onStartEditing={startEditing}
                        onSaveNodeName={saveNodeName}
                        onCancelEditing={cancelEditing}
                        onDeleteNode={deleteNode}
                        onNodeClick={handleNodeClick}
                        onSetEditingName={setEditingName}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    />
                ))}
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
