'use client';

import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/utils/i18n/i18n-context';
import {
    getSampleById,
    organizationSample,
    type SampleType,
    allSamples,
} from '@/components/tree-editor/features/sample-selector/sample-data';

// コアコンポーネント
import { TreeHeader } from '@/components/tree-editor/core/tree-header';
import { TreeNodeComponent } from '@/components/tree-editor/core/tree-node';

// モーダルコンポーネント
import { NodeCreateModal } from '@/components/tree-editor/modals/node-create-modal';
import { NodeDetailModal } from '@/components/tree-editor/modals/node-detail-modal';
import { NodeTypeModal } from '@/components/tree-editor/modals/node-type-modal';

// UI コンポーネント
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

// カスタムフック
import { useTreeDragDrop } from '@/components/tree-editor/hooks/use-tree-drag-drop';
import { useTreeOperations } from '@/components/tree-editor/hooks/use-tree-operations';
import { useTreeModals } from '@/components/tree-editor/hooks/use-tree-modals';
import { useWorkspaceManager } from '@/components/tree-editor/hooks/use-workspace-manager';
import { useImportExport } from '@/components/tree-editor/hooks/use-import-export';
import { useSearch } from '@/components/tree-editor/hooks/use-search';

// 機能コンポーネント
import SearchFeature from '@/components/tree-editor/features/search/search-feature';

// 型定義
import { TreeNode } from '@/components/tree-editor/types';

// 初期ノードタイプデータと初期ツリーデータは、organizationSampleから取得
const initialNodeTypes = organizationSample.nodeTypes;
const initialTree = organizationSample.tree;

function TreeEditor() {
    const { t } = useI18n();
    const [currentSampleId, setCurrentSampleId] = useState<SampleType>('organization');

    // ツリー操作のカスタムフック
    const {
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
    } = useTreeOperations({
        initialTree,
        initialNodeTypes,
        initialTreeTitle: organizationSample.treeTitle,
    });

    // モーダル管理のカスタムフック
    const {
        selectedNode,
        isDetailModalOpen,
        setIsDetailModalOpen,
        isNodeTypeModalOpen,
        setIsNodeTypeModalOpen,
        isNodeCreateModalOpen,
        setIsNodeCreateModalOpen,
        addingToParentId,
        openAddChildModal,
        openAddRootNodeModal,
        openNodeDetailModal,
        isSampleSelectorOpen,
        setIsSampleSelectorOpen,
        isResetDialogOpen,
        setIsResetDialogOpen,
        isImportDialogOpen,
        setIsImportDialogOpen,
        importData,
        setImportData,
        importError,
        setImportError,
    } = useTreeModals();

    // ワークスペース管理のカスタムフック
    const {
        activeWorkspaceId,
        lastSaved,
        isWorkspaceLoading,
        saveCurrentWorkspace,
        handleWorkspaceChange,
        handleCreateWorkspace,
    } = useWorkspaceManager({
        defaultTreeTitle: organizationSample.treeTitle,
        defaultTree: initialTree,
        defaultNodeTypes: initialNodeTypes,
        onWorkspaceChange: (newTree, newNodeTypes, newTitle) => {
            setTree(newTree);
            setNodeTypes(newNodeTypes);
            setTreeTitle(newTitle);
        },
    });

    // インポート/エクスポーネート機能のカスタムフック
    const { fileInputRef, openFileSelector, handleFileChange, executeImport, exportTreeData } = useImportExport({
        onImportSuccess: (newTree, newNodeTypes, newTitle) => {
            setTree(newTree);
            setNodeTypes(newNodeTypes);
            if (newTitle) {
                setTreeTitle(newTitle);
            }
        },
        setImportData,
        setImportError,
        setIsImportDialogOpen,
    });

    // ドラッグ＆ドロップのカスタムフック
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

    // 検索機能のカスタムフック
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
    } = useSearch({ tree, nodeTypes });

    // 自動保存のための状態と参照を設定
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMountRef = useRef(true);

    // 以前のデータを参照として保持
    const treeRef = useRef(tree);
    const nodeTypesRef = useRef(nodeTypes);
    const treeTitleRef = useRef(treeTitle);

    // 自動保存の依存関係の安定化のために、saveCurrentWorkspaceを参照として保持
    const saveCurrentWorkspaceRef = useRef(saveCurrentWorkspace);

    // saveCurrentWorkspaceが変更されたらrefを更新
    useEffect(() => {
        saveCurrentWorkspaceRef.current = saveCurrentWorkspace;
    }, [saveCurrentWorkspace]);

    // ツリーデータが変更されたときに自動保存を効率的に処理する
    useEffect(() => {
        // 初回マウント時は保存しない
        if (isInitialMountRef.current) {
            isInitialMountRef.current = false;
            treeRef.current = tree;
            nodeTypesRef.current = nodeTypes;
            treeTitleRef.current = treeTitle;
            return;
        }

        // ワークスペースがロード中または存在しない場合は何もしない
        if (isWorkspaceLoading || !activeWorkspaceId) {
            return;
        }

        // データに変更があるか確認
        const hasTreeChanged = treeRef.current !== tree;
        const hasNodeTypesChanged = nodeTypesRef.current !== nodeTypes;
        const hasTitleChanged = treeTitleRef.current !== treeTitle;

        // 変更があった場合のみ処理を実行
        if (hasTreeChanged || hasNodeTypesChanged || hasTitleChanged) {
            // 現在の値を参照に保存（次回の比較用）
            treeRef.current = tree;
            nodeTypesRef.current = nodeTypes;
            treeTitleRef.current = treeTitle;

            // 既存のタイマーがあればクリアして新しいタイマーを設定
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }

            // 保存処理は少し遅延させる（複数の状態変更が同時に起こる可能性がある場合）
            saveTimerRef.current = setTimeout(() => {
                // 保存する際にはrefから最新の関数を呼び出す
                saveCurrentWorkspaceRef.current(treeRef.current, nodeTypesRef.current, treeTitleRef.current);
                saveTimerRef.current = null;
            }, 300);
        }

        // クリーンアップ関数
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, [tree, nodeTypes, treeTitle, activeWorkspaceId, isWorkspaceLoading]);

    // サンプルを変更する関数
    const handleSelectSample = (sampleId: SampleType) => {
        const sample = getSampleById(sampleId);
        if (!sample) return;

        resetTree(sample.tree, sample.nodeTypes, sample.treeTitle);
        setCurrentSampleId(sampleId);
    };

    // リセットされたフックに対応するツリーノードクリックハンドラ
    const handleNodeClick = (node: TreeNode) => {
        openNodeDetailModal(node);
    };

    // ノードを追加するハンドラ
    const handleAddNode = (newNode: TreeNode) => {
        addNode(newNode, addingToParentId);
    };

    return (
        <div className='border rounded-lg p-4'>
            {/* ヘッダー部分 */}
            <TreeHeader
                treeTitle={treeTitle}
                lastSaved={lastSaved}
                activeWorkspaceId={activeWorkspaceId}
                handleWorkspaceChange={handleWorkspaceChange}
                handleCreateWorkspace={handleCreateWorkspace}
                exportTreeData={() => exportTreeData(tree, nodeTypes, treeTitle)}
                openFileSelector={openFileSelector}
                setIsSampleSelectorOpen={setIsSampleSelectorOpen}
                setIsNodeTypeModalOpen={setIsNodeTypeModalOpen}
                setIsResetDialogOpen={setIsResetDialogOpen}
                addRootNode={openAddRootNodeModal}
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
                onSaveNodeTypes={updateNodeTypes}
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
                        <AlertDialogAction onClick={() => executeImport(importData)}>
                            {t('common.import')}
                        </AlertDialogAction>
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
                        <Button
                            variant='destructive'
                            onClick={() => {
                                const sample = getSampleById(currentSampleId) || organizationSample;
                                resetTree(sample.tree, sample.nodeTypes, sample.treeTitle);
                                setIsResetDialogOpen(false);
                            }}
                        >
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
