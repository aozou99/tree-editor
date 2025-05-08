'use client';

import { useState } from 'react';
import {
    getSampleById,
    organizationSample,
    type SampleType,
} from '@/components/tree-editor/features/sample-selector/sample-data';

// コアコンポーネント
import { TreeHeader } from '@/components/tree-editor/core/tree-header';
import { TreeNodeContainer } from '@/components/tree-editor/core/tree-container';

// モーダルコンポーネント
import { NodeCreateModal } from '@/components/tree-editor/modals/node-create-modal';
import { NodeDetailModal } from '@/components/tree-editor/modals/node-detail-modal';
import { NodeTypeModal } from '@/components/tree-editor/modals/node-type-modal';
import {
    ImportDialog,
    ResetDialog,
    SampleSelectorDialog,
} from '@/components/tree-editor/features/dialogs/tree-dialogs';

// 機能コンポーネント
import SearchFeature from '@/components/tree-editor/features/search/search-feature';

// カスタムフック
import { useTreeDragDrop } from '@/components/tree-editor/hooks/use-tree-drag-drop';
import { useTreeOperations } from '@/components/tree-editor/hooks/use-tree-operations';
import { useTreeModals } from '@/components/tree-editor/hooks/use-tree-modals';
import { useWorkspaceManager } from '@/components/tree-editor/hooks/use-workspace-manager';
import { useImportExport } from '@/components/tree-editor/hooks/use-import-export';
import { useSearch } from '@/components/tree-editor/hooks/use-search';
import { useAutoSave } from '@/components/tree-editor/hooks/use-auto-save';

// 型定義
import { TreeNode } from '@/components/tree-editor/types';
import { useDocumentTitle } from '@uidotdev/usehooks';
import type { SearchResult } from '@/components/tree-editor/types/search-types';

// 初期ノードタイプデータと初期ツリーデータは、organizationSampleから取得
const initialNodeTypes = organizationSample.nodeTypes;
const initialTree = organizationSample.tree;

function TreeEditor() {
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

    // activeWorkspaceIdをundefinedに変換
    const activeWorkspaceIdForAutoSave = activeWorkspaceId ?? undefined;

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
        isWorkspaceLoading,
        activeWorkspaceId: activeWorkspaceIdForAutoSave,
        saveCurrentWorkspace,
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

            <ResetDialog
                open={isResetDialogOpen}
                onOpenChange={setIsResetDialogOpen}
                currentSampleId={currentSampleId}
                resetTree={resetTree}
            />

            <SampleSelectorDialog
                open={isSampleSelectorOpen}
                onOpenChange={setIsSampleSelectorOpen}
                currentSampleId={currentSampleId}
                setCurrentSampleId={setCurrentSampleId}
                handleSelectSample={handleSelectSample}
            />
        </div>
    );
}

export default TreeEditor;
