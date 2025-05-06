import { useRef, useEffect } from 'react';
import { TreeNode, NodeType } from '@/components/tree-editor/types';

type AutoSaveProps = {
    tree: TreeNode[];
    nodeTypes: NodeType[];
    treeTitle: string;
    isWorkspaceLoading: boolean;
    activeWorkspaceId?: string;
    saveCurrentWorkspace: (tree: TreeNode[], nodeTypes: NodeType[], treeTitle: string) => void;
    delay?: number;
};

export function useAutoSave({
    tree,
    nodeTypes,
    treeTitle,
    isWorkspaceLoading,
    activeWorkspaceId,
    saveCurrentWorkspace,
    delay = 300,
}: AutoSaveProps) {
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
            }, delay);
        }

        // クリーンアップ関数
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, [tree, nodeTypes, treeTitle, activeWorkspaceId, isWorkspaceLoading, delay]);
}
