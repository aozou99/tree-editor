import { useState, useEffect, useCallback, useRef } from 'react';
import { TreeNode, NodeType } from '@/components/tree-editor/types';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/utils/i18n/i18n-context';

import {
    loadWorkspaceList,
    loadWorkspace,
    createWorkspace,
    saveWorkspace,
    Workspace,
} from '@/components/tree-editor/utils/workspace-utils';

export interface UseWorkspaceManagerProps {
    defaultTreeTitle: string;
    defaultTree: TreeNode[];
    defaultNodeTypes: NodeType[];
    onWorkspaceChange: (tree: TreeNode[], nodeTypes: NodeType[], treeTitle: string) => void;
}

export function useWorkspaceManager({
    defaultTreeTitle,
    defaultTree,
    defaultNodeTypes,
    onWorkspaceChange,
}: UseWorkspaceManagerProps) {
    const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
    const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // 実際のデバウンス処理のためのタイマーIDを保持
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 最後の保存後に変更があったかどうかを追跡
    const hasUnsavedChangesRef = useRef<boolean>(false);

    // activeWorkspaceIdをrefに保存し、再レンダリングを防ぐ
    const activeWorkspaceIdRef = useRef<string | null>(null);

    // 初期化済みかどうかのフラグ
    const isInitializedRef = useRef<boolean>(false);

    // activeWorkspaceIdが変更されたらrefも更新
    useEffect(() => {
        activeWorkspaceIdRef.current = activeWorkspaceId;
    }, [activeWorkspaceId]);

    const { t } = useI18n();

    // 実際のデバウンス処理を実装した自動保存関数
    const debouncedSaveWorkspace = useCallback((workspace: Workspace) => {
        // 既存のタイマーがあればクリア
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        // 変更があったことをマーク
        hasUnsavedChangesRef.current = true;

        // 新しいタイマーをセット（1秒後に保存実行）
        saveTimerRef.current = setTimeout(() => {
            // 保存を実行
            saveWorkspace(workspace);
            setLastSaved(new Date().toISOString());

            // 保存完了後にフラグをリセット
            hasUnsavedChangesRef.current = false;
            saveTimerRef.current = null;
        }, 1000); // 1秒のデバウンス時間
    }, []);

    // コンポーネントのアンマウント時にタイマーをクリアするためのクリーンアップ
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, []);

    // 現在のワークスペースデータを保存する関数 - 依存配列から activeWorkspaceId を削除
    const saveCurrentWorkspace = useCallback(
        (tree: TreeNode[], nodeTypes: NodeType[], treeTitle: string) => {
            // 現在のactiveWorkspaceIdをrefから取得
            const currentWorkspaceId = activeWorkspaceIdRef.current;
            if (!currentWorkspaceId) return;

            // 現在のワークスペース情報を読み込み
            const currentWorkspace = loadWorkspace(currentWorkspaceId);
            if (!currentWorkspace) return;

            // ワークスペース名をツリータイトルと同期させる
            const workspace: Workspace = {
                id: currentWorkspaceId,
                name: treeTitle, // ワークスペース名をツリータイトルと一致させる
                createdAt: currentWorkspace.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                tree,
                nodeTypes,
                treeTitle,
            };

            debouncedSaveWorkspace(workspace);
        },
        [debouncedSaveWorkspace], // activeWorkspaceIdを依存配列から除外
    );

    // ワークスペースを切り替える関数
    const handleWorkspaceChange = useCallback(
        (workspace: Workspace) => {
            onWorkspaceChange(workspace.tree, workspace.nodeTypes, workspace.treeTitle);
            setActiveWorkspaceId(workspace.id);
            setLastSaved(workspace.updatedAt);
        },
        [onWorkspaceChange],
    );

    // 新しいワークスペースを作成する関数
    const handleCreateWorkspace = useCallback(
        (name: string, initialData?: { tree: TreeNode[]; nodeTypes: NodeType[]; treeTitle: string }) => {
            // 新しいワークスペースを作成
            const newWorkspace = createWorkspace(name, {
                tree: initialData?.tree || defaultTree,
                nodeTypes: initialData?.nodeTypes || defaultNodeTypes,
                treeTitle: initialData?.treeTitle || name, // 指定がなければ入力された名前をツリータイトルに
            });

            // 作成したワークスペースを表示
            handleWorkspaceChange(newWorkspace);

            toast({
                title: t('toast.workspaceCreated'),
                description: t('toast.workspaceCreated', { name }),
                duration: 3000,
            });

            return newWorkspace;
        },
        [defaultTree, defaultNodeTypes, handleWorkspaceChange, t],
    );

    // 初期化時にワークスペース情報を読み込む - handleWorkspaceChangeを依存配列から除外
    useEffect(() => {
        // 既に初期化済みの場合は実行しない
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

        setIsWorkspaceLoading(true);

        const { activeWorkspaceId: storedWorkspaceId, workspaces } = loadWorkspaceList();

        // ワークスペースが存在しない場合は初期ワークスペースを作成
        if (workspaces.length === 0) {
            const newWorkspace = createWorkspace(t('workspace.defaultName'), {
                tree: defaultTree,
                nodeTypes: defaultNodeTypes,
                treeTitle: defaultTreeTitle,
            });
            // 直接状態を更新せずに必要な処理を実行
            onWorkspaceChange(newWorkspace.tree, newWorkspace.nodeTypes, newWorkspace.treeTitle);
            setActiveWorkspaceId(newWorkspace.id);
            setLastSaved(newWorkspace.updatedAt);
        } else if (storedWorkspaceId) {
            // アクティブなワークスペースを読み込む
            const workspace = loadWorkspace(storedWorkspaceId);
            if (workspace) {
                // handleWorkspaceChangeの代わりに直接処理
                onWorkspaceChange(workspace.tree, workspace.nodeTypes, workspace.treeTitle);
                setActiveWorkspaceId(workspace.id);
                setLastSaved(workspace.updatedAt);
            }
        } else if (workspaces.length > 0) {
            // アクティブでない場合は最初のワークスペースを表示
            const workspace = loadWorkspace(workspaces[0].id);
            if (workspace) {
                // handleWorkspaceChangeの代わりに直接処理
                onWorkspaceChange(workspace.tree, workspace.nodeTypes, workspace.treeTitle);
                setActiveWorkspaceId(workspace.id);
                setLastSaved(workspace.updatedAt);
            }
        }

        setIsWorkspaceLoading(false);
    }, [defaultTree, defaultNodeTypes, defaultTreeTitle, t, onWorkspaceChange]); // handleWorkspaceChangeを依存配列から除外

    return {
        activeWorkspaceId,
        setActiveWorkspaceId,
        isWorkspaceLoading,
        lastSaved,
        setLastSaved,
        saveCurrentWorkspace,
        handleWorkspaceChange,
        handleCreateWorkspace,
    };
}
