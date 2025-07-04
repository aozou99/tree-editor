import { useState, useCallback } from 'react';
import { TreeNode } from '@/components/tree-editor/types';

export function useTreeModals() {
    // 詳細モーダル用の状態
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

    // ノードタイプモーダル用の状態
    const [isNodeTypeModalOpen, setIsNodeTypeModalOpen] = useState<boolean>(false);

    // ノード作成モーダル用の状態
    const [isNodeCreateModalOpen, setIsNodeCreateModalOpen] = useState<boolean>(false);
    const [addingToParentId, setAddingToParentId] = useState<string | undefined>(undefined);

    // サンプル選択モーダル
    const [isSampleSelectorOpen, setIsSampleSelectorOpen] = useState<boolean>(false);

    // 履歴から復元ダイアログ
    const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState<boolean>(false);

    // スナップショット作成ダイアログ
    const [isSnapshotDialogOpen, setIsSnapshotDialogOpen] = useState<boolean>(false);

    // インポートダイアログ
    const [isImportDialogOpen, setIsImportDialogOpen] = useState<boolean>(false);
    const [importData, setImportData] = useState<string>('');
    const [importError, setImportError] = useState<string | null>(null);

    // インポート/エクスポートガイドダイアログ
    const [isImportExportGuideOpen, setIsImportExportGuideOpen] = useState<boolean>(false);

    // 共有ダイアログ
    const [isShareDialogOpen, setIsShareDialogOpen] = useState<boolean>(false);

    // 子ノード追加モーダルを開く
    const openAddChildModal = useCallback((parentId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setAddingToParentId(parentId);
        setIsNodeCreateModalOpen(true);
    }, []);

    // ルートレベルに新しいノードを追加するモーダルを開く
    const openAddRootNodeModal = useCallback(() => {
        setAddingToParentId(undefined);
        setIsNodeCreateModalOpen(true);
    }, []);

    // ノードの詳細モーダルを開く
    const openNodeDetailModal = useCallback((node: TreeNode) => {
        setSelectedNode(node);
        setIsDetailModalOpen(true);
    }, []);

    return {
        // ノード詳細モーダル
        selectedNode,
        setSelectedNode,
        isDetailModalOpen,
        setIsDetailModalOpen,
        openNodeDetailModal,

        // ノードタイプモーダル
        isNodeTypeModalOpen,
        setIsNodeTypeModalOpen,

        // ノード作成モーダル
        isNodeCreateModalOpen,
        setIsNodeCreateModalOpen,
        addingToParentId,
        setAddingToParentId,
        openAddChildModal,
        openAddRootNodeModal,

        // サンプル選択モーダル
        isSampleSelectorOpen,
        setIsSampleSelectorOpen,

        // 履歴から復元ダイアログ
        isHistoryDialogOpen,
        setIsHistoryDialogOpen,

        // スナップショット作成ダイアログ
        isSnapshotDialogOpen,
        setIsSnapshotDialogOpen,

        // インポートダイアログ
        isImportDialogOpen,
        setIsImportDialogOpen,
        importData,
        setImportData,
        importError,
        setImportError,

        // インポート/エクスポートガイドダイアログ
        isImportExportGuideOpen,
        setIsImportExportGuideOpen,

        // 共有ダイアログ
        isShareDialogOpen,
        setIsShareDialogOpen,
    };
}
