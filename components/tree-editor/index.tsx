'use client';

import type React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { validateImportData, createExportData } from '@/components/tree-editor/utils/tree-data-utils';
import { toast } from '@/hooks/use-toast';
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
import { useI18n } from '@/utils/i18n/i18n-context';

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

import { TreeHeader } from '@/components/tree-editor/core/tree-header';
import { TreeNodeComponent } from '@/components/tree-editor/core/tree-node';
import { useTreeDragDrop } from '@/components/tree-editor/hooks/use-tree-drag-drop';
import { NodeCreateModal } from '@/components/tree-editor/modals/node-create-modal';
import { NodeDetailModal } from '@/components/tree-editor/modals/node-detail-modal';
import { NodeTypeModal } from '@/components/tree-editor/modals/node-type-modal';
import { TreeNode, NodeType, FieldType } from '@/components/tree-editor/types';
import SearchFeature from '@/components/tree-editor/features/search/search-feature';
import { useSearch } from '@/components/tree-editor/hooks/use-search';

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

    // 検索機能のカスタムフックをindex.tsxで呼び出し
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
        handleOpenDetailModal,
        handleSearchKeyDown,
        expandedTree,
        setExpandedTree,
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
            name: loadWorkspace(activeWorkspaceId)?.name || t('workspace.untitledName'),
            createdAt: loadWorkspace(activeWorkspaceId)?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tree,
            nodeTypes,
            treeTitle,
        };

        debouncedSaveWorkspace(workspace);
    }, [activeWorkspaceId, tree, nodeTypes, treeTitle, debouncedSaveWorkspace, t]);

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
            treeTitle: t('workspace.defaultTreeTitle', { name }),
        });

        // 作成したワークスペースを表示
        handleWorkspaceChange(newWorkspace);

        toast({
            title: t('toast.workspaceCreated'),
            description: t('toast.workspaceCreated', { name }),
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
            const newWorkspace = createWorkspace(t('workspace.defaultName'), {
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
    }, [t]);

    // ツリーデータが変更されたときに自動保存
    useEffect(() => {
        if (!isWorkspaceLoading && activeWorkspaceId) {
            saveCurrentWorkspace();
        }
    }, [tree, nodeTypes, treeTitle, activeWorkspaceId, isWorkspaceLoading, saveCurrentWorkspace]);

    // tree が変更されたら expandedTree も更新
    useEffect(() => {
        setExpandedTree(tree);
    }, [tree, setExpandedTree]);

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
            title: t('toast.sampleChanged'),
            description: t('toast.sampleChanged', { name: sample.name }),
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
            title: t('toast.dataReset'),
            description: t('toast.dataReset'),
            duration: 3000,
        });
    };

    // ツリーデータをJSONとしてエクスポーネント
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
                title: t('toast.exportComplete'),
                description: t('toast.exportComplete'),
                duration: 3000,
            });
        } catch (error) {
            console.error(t('debug.exportError'), error);
            toast({
                title: t('toast.exportError'),
                description: t('toast.exportError'),
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
                console.error(t('debug.fileReadError'), error);
                setImportError(t('dialogs.import.errors.fileReadError'));
                toast({
                    title: t('toast.importError'),
                    description: t('toast.importError'),
                    variant: 'destructive',
                    duration: 5000,
                });
            }
        };
        reader.onerror = () => {
            setImportError(t('dialogs.import.errors.fileReadError'));
            toast({
                title: t('toast.importError'),
                description: t('toast.importError'),
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
                setImportError(t('dialogs.import.errors.noData'));
                return;
            }

            const parsedData = JSON.parse(importData);

            // データの検証
            const validation = validateImportData(parsedData);
            if (!validation.valid) {
                setImportError(
                    validation.error
                        ? t(`dialogs.import.errors.${validation.error}`)
                        : t('dialogs.import.errors.invalidFormat'),
                );
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
                title: t('toast.importComplete'),
                description: t('toast.importComplete'),
                duration: 3000,
            });
        } catch (error) {
            console.error(t('debug.importError'), error);
            setImportError(t('dialogs.import.errors.parseError'));
            toast({
                title: t('toast.importError'),
                description: t('toast.importError'),
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
                <SearchFeature
                    searchQuery={searchQuery}
                    onChange={setSearchQuery}
                    onKeyDown={handleSearchKeyDown}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    inputRef={searchInputRef}
                    searchResults={searchResults}
                    selectedResultIndex={selectedResultIndex}
                    onSelectResult={handleSelectSearchResult}
                    onOpenResult={handleOpenDetailModal}
                    searchResultsRef={searchResultsRef}
                    isSearchFocused={isSearchFocused}
                    searchResultsHeight={searchResultsHeight}
                />
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
                {expandedTree.map((node) => (
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
                onSaveNodeTypes={(updatedNodeTypes, fieldChangeInfo) => {
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
                                    const fieldIndex = updatedCustomFields.findIndex(
                                        (f) => (f.fieldId || f.id) === rename.id,
                                    );
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
                                            type: typeChange.newType as FieldType,
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
                }}
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
                        <AlertDialogTitle>{t('dialogs.import.title')}</AlertDialogTitle>
                        <AlertDialogDescription>{t('dialogs.import.description')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className='grid gap-4 py-4'>
                        <div className='grid grid-cols-4 items-center gap-4'>
                            <Label htmlFor='importData' className='text-right'>
                                {t('dialogs.import.jsonData')}
                            </Label>
                            <Textarea
                                id='importData'
                                className='col-span-3'
                                value={importData}
                                onChange={(e) => {
                                    setImportData(e.target.value);
                                    setImportError(null);
                                }}
                                placeholder={t('dialogs.import.placeholder')}
                            />
                        </div>
                        {importError && <p className='text-red-500 text-sm'>{importError}</p>}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setImportData('')}>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={executeImport}>{t('common.import')}</AlertDialogAction>
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
                            {t('header.sampleSelection') + ' ' + t('dialogs.import.description')}
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
