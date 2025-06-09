'use client';

import { useState } from 'react';
import {
    getSampleById,
    type SampleType,
} from '@/components/tree-editor/features/sample-selector/sample-data';
import { NodeType } from '@/components/tree-editor/types';

// コアコンポーネント
import { TreeHeader } from '@/components/tree-editor/core/tree-header';
import { TreeNodeContainer } from '@/components/tree-editor/core/tree-container';

// モーダルコンポーネント
import { NodeCreateModal } from '@/components/tree-editor/modals/node-create-modal';
import { NodeDetailModal } from '@/components/tree-editor/modals/node-detail-modal';
import { NodeTypeModal } from '@/components/tree-editor/modals/node-type-modal';
import {
    ImportDialog,
    SampleSelectorDialog,
} from '@/components/tree-editor/features/dialogs/tree-dialogs';
import { HistoryDialog } from '@/components/tree-editor/features/dialogs/history-dialog';
import { SnapshotDialog } from '@/components/tree-editor/features/dialogs/snapshot-dialog';
import { ImportExportGuideDialog } from '@/components/tree-editor/features/dialogs/import-export-guide-dialog';
import { CompressionDebug } from '@/components/tree-editor/features/compression-debug';

// 機能コンポーネント
import SearchFeature from '@/components/tree-editor/features/search/search-feature';

// カスタムフック
import { useTreeDragDrop } from '@/components/tree-editor/hooks/use-tree-drag-drop';
import { useTreeOperations } from '@/components/tree-editor/hooks/use-tree-operations';
import { useTreeModals } from '@/components/tree-editor/hooks/use-tree-modals';
import { useTreeManager } from '@/components/tree-editor/hooks/use-tree-manager';
import { useImportExport } from '@/components/tree-editor/hooks/use-import-export';
import { useSearch } from '@/components/tree-editor/hooks/use-search';
import { useAutoSave } from '@/components/tree-editor/hooks/use-auto-save';
import { useTreeSnapshots } from '@/components/tree-editor/hooks/use-tree-snapshots';

// 型定義
import { TreeNode } from '@/components/tree-editor/types';
import { useDocumentTitle } from '@uidotdev/usehooks';
import type { SearchResult } from '@/components/tree-editor/types/search-types';
import { useI18n } from '@/utils/i18n/i18n-context';

// 初期ノードタイプデータと初期ツリーデータは空の配列
const initialNodeTypes: NodeType[] = [];
const initialTree: TreeNode[] = [];

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
        initialTreeTitle: t('trees.defaultName'),
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
        isHistoryDialogOpen,
        setIsHistoryDialogOpen,
        isSnapshotDialogOpen,
        setIsSnapshotDialogOpen,
        isImportDialogOpen,
        setIsImportDialogOpen,
        importData,
        setImportData,
        importError,
        setImportError,
        isImportExportGuideOpen,
        setIsImportExportGuideOpen,
    } = useTreeModals();

    // ツリー管理のカスタムフック
    const {
        activeTreeId,
        lastSaved,
        isTreeLoading,
        saveCurrentTree,
        handleTreeChange,
        handleCreateTree,
        handleDeleteTree,
        storageType,
        handleStorageTypeChange,
        isCloudAvailable,
    } = useTreeManager({
        defaultTreeTitle: t('trees.defaultName'),
        defaultTree: initialTree,
        defaultNodeTypes: initialNodeTypes,
        onTreeChange: (newTree, newNodeTypes, newTitle) => {
            setTree(newTree);
            setNodeTypes(newNodeTypes);
            setTreeTitle(newTitle);
        },
    });

    // activeTreeIdをundefinedに変換
    const activeTreeIdForAutoSave = activeTreeId ?? undefined;

    // インポート/エクスポーネート機能のカスタムフック
    const { openFileSelector, executeImport, exportTreeData } = useImportExport({
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

    // 自動保存のカスタムフック
    useAutoSave({
        tree,
        nodeTypes,
        treeTitle,
        isTreeLoading,
        activeTreeId: activeTreeIdForAutoSave,
        saveCurrentTree,
    });

    // スナップショット管理のカスタムフック
    const {
        snapshots,
        createAutoSnapshot,
        createManualSnapshot,
        restoreFromSnapshot,
    } = useTreeSnapshots({
        tree,
        nodeTypes,
        treeTitle,
        activeTreeId,
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
        handleSearchKeyDown,
        expandedTree,
    } = useSearch({ tree, nodeTypes });

    // 検索結果クリックで詳細モーダルを開く
    const handleOpenDetailModal = (result: SearchResult) => {
        openNodeDetailModal(result.node);
    };

    // Enterキーで詳細モーダルを開く
    const handleSearchKeyDownWithModal = (e: React.KeyboardEvent<Element>) => {
        // IME変換確定時のEnterキーを無視
        if (e.nativeEvent.isComposing) return;

        if (e.key === 'Enter' && searchResults.length > 0 && selectedResultIndex >= 0) {
            e.preventDefault();
            handleOpenDetailModal(searchResults[selectedResultIndex]);
        } else {
            handleSearchKeyDown(e);
        }
    };

    // サンプルを変更する関数
    const handleSelectSample = (sampleId: SampleType) => {
        const sample = getSampleById(sampleId);
        if (!sample) return;

        resetTree(sample.tree, sample.nodeTypes, sample.treeTitle);
        setCurrentSampleId(sampleId);
    };

    // ツリーのタイトルを設定
    useDocumentTitle(`Tree Editor | ${treeTitle}`);

    // ツリーノードクリックハンドラ
    const handleNodeClick = (node: TreeNode) => openNodeDetailModal(node);

    // ノードを追加するハンドラ
    const handleAddNode = (newNode: TreeNode) => addNode(newNode, addingToParentId);

    // TreeNodeComponentのprops型に合わせてイベントハンドラをラップ
    const handleToggleExpand = (nodeId: string, e: React.MouseEvent) => toggleExpand(nodeId, e);
    const handleAddChild = (parentId: string, e: React.MouseEvent) => openAddChildModal(parentId, e);
    const handleStartEditing = (node: TreeNode, e: React.MouseEvent) => startEditing(node, e);
    const handleSaveNodeName = (e?: React.MouseEvent) => saveNodeName(e);
    const handleDeleteNode = (nodeId: string, e: React.MouseEvent) => deleteNode(nodeId, e);

    // ドラッグ&ドロップ系も型を合わせる
    const handleDragStartNode = (e: React.DragEvent<HTMLDivElement>, nodeId: string) => handleDragStart(e, nodeId);
    const handleDragEndNode = (e: React.DragEvent<HTMLDivElement>) => handleDragEnd(e);
    const handleDragOverNode = (e: React.DragEvent<HTMLDivElement>, nodeId: string) => handleDragOver(e, nodeId);
    const handleDragLeaveNode = (e: React.DragEvent<HTMLDivElement>) => handleDragLeave(e);
    const handleDropNode = (e: React.DragEvent<HTMLDivElement>, nodeId: string) => handleDrop(e, nodeId);

    return (
        <div className='border rounded-lg p-4'>
            {/* ヘッダー部分 */}
            <TreeHeader
                treeTitle={treeTitle}
                lastSaved={lastSaved}
                activeTreeId={activeTreeId}
                handleTreeChange={handleTreeChange}
                handleCreateTree={handleCreateTree}
                handleDeleteTree={handleDeleteTree}
                storageType={storageType}
                onStorageTypeChange={handleStorageTypeChange}
                isCloudAvailable={isCloudAvailable}
                exportTreeData={() => exportTreeData(tree, nodeTypes, treeTitle)}
                openFileSelector={openFileSelector}
                setIsSampleSelectorOpen={setIsSampleSelectorOpen}
                setIsNodeTypeModalOpen={setIsNodeTypeModalOpen}
                setIsHistoryDialogOpen={setIsHistoryDialogOpen}
                setIsSnapshotDialogOpen={setIsSnapshotDialogOpen}
                setIsImportExportGuideOpen={setIsImportExportGuideOpen}
                addRootNode={openAddRootNodeModal}
            />

            {/* 検索機能 */}
            <div className='mb-4 relative'>
                <SearchFeature
                    searchQuery={searchQuery}
                    onChange={setSearchQuery}
                    onKeyDown={handleSearchKeyDownWithModal}
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
            <TreeNodeContainer
                expandedTree={expandedTree}
                nodeTypes={nodeTypes}
                isDraggingOverRoot={isDraggingOverRoot}
                searchResultsHeight={searchResultsHeight}
                isSearchFocused={isSearchFocused}
                highlightedPath={highlightedPath}
                focusMode={focusMode}
                editingNodeId={editingNodeId}
                editingName={editingName}
                draggedNodeId={draggedNodeId}
                dragOverNodeId={dragOverNodeId}
                dragPosition={dragPosition}
                onRootDragOver={handleRootDragOver}
                onRootDragLeave={handleRootDragLeave}
                onRootDrop={handleRootDrop}
                onToggleExpand={handleToggleExpand}
                onAddChild={handleAddChild}
                onStartEditing={handleStartEditing}
                onSaveNodeName={handleSaveNodeName}
                onCancelEditing={cancelEditing}
                onDeleteNode={handleDeleteNode}
                onNodeClick={handleNodeClick}
                onSetEditingName={setEditingName}
                onDragStart={handleDragStartNode}
                onDragEnd={handleDragEndNode}
                onDragOver={handleDragOverNode}
                onDragLeave={handleDragLeaveNode}
                onDrop={handleDropNode}
            />

            {/* モーダルコンポーネント */}
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

            <NodeTypeModal
                open={isNodeTypeModalOpen}
                onOpenChange={setIsNodeTypeModalOpen}
                nodeTypes={nodeTypes}
                onSaveNodeTypes={updateNodeTypes}
            />

            <NodeCreateModal
                open={isNodeCreateModalOpen}
                onOpenChange={setIsNodeCreateModalOpen}
                onCreateNode={handleAddNode}
                nodeTypes={nodeTypes}
                parentNodeId={addingToParentId}
            />

            {/* ダイアログコンポーネント */}
            <ImportDialog
                open={isImportDialogOpen}
                onOpenChange={setIsImportDialogOpen}
                importData={importData}
                setImportData={setImportData}
                importError={importError}
                setImportError={setImportError}
                executeImport={executeImport}
            />

            <HistoryDialog
                open={isHistoryDialogOpen}
                onOpenChange={setIsHistoryDialogOpen}
                snapshots={snapshots}
                onRestore={(snapshot) => {
                    const restored = restoreFromSnapshot(snapshot);
                    setTree(restored.tree);
                    setNodeTypes(restored.nodeTypes);
                    setTreeTitle(restored.treeTitle);
                }}
                currentTreeId={activeTreeId}
            />

            <SnapshotDialog
                open={isSnapshotDialogOpen}
                onOpenChange={setIsSnapshotDialogOpen}
                onCreateSnapshot={(title, description) => {
                    createManualSnapshot(title, description);
                }}
            />

            <SampleSelectorDialog
                open={isSampleSelectorOpen}
                onOpenChange={setIsSampleSelectorOpen}
                currentSampleId={currentSampleId}
                setCurrentSampleId={setCurrentSampleId}
                handleSelectSample={handleSelectSample}
            />

            <ImportExportGuideDialog
                isOpen={isImportExportGuideOpen}
                onClose={() => setIsImportExportGuideOpen(false)}
            />

            {/* 開発環境での圧縮統計デバッグ */}
            <CompressionDebug />
        </div>
    );
}

export default TreeEditor;
