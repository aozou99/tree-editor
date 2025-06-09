import { useRef, useEffect } from 'react';
import { TreeNode, NodeType } from '@/components/tree-editor/types';

type AutoSaveProps = {
    tree: TreeNode[];
    nodeTypes: NodeType[];
    treeTitle: string;
    isTreeLoading: boolean;
    activeTreeId?: string;
    saveCurrentTree: (tree: TreeNode[], nodeTypes: NodeType[], treeTitle: string) => void;
    delay?: number;
    batchDelay?: number;
    enableBatching?: boolean;
};

export function useAutoSave({
    tree,
    nodeTypes,
    treeTitle,
    isTreeLoading,
    activeTreeId,
    saveCurrentTree,
    delay = 2000, // 300ms → 2秒に変更
    batchDelay = 5000, // バッチ処理用の追加遅延
    enableBatching = true,
}: AutoSaveProps) {
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const batchTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isInitialMountRef = useRef(true);
    const changeCountRef = useRef(0);
    const lastSaveTimeRef = useRef(Date.now());

    // 以前のデータを参照として保持
    const treeRef = useRef(tree);
    const nodeTypesRef = useRef(nodeTypes);
    const treeTitleRef = useRef(treeTitle);

    // 自動保存の依存関係の安定化のために、saveCurrentTreeを参照として保持
    const saveCurrentTreeRef = useRef(saveCurrentTree);

    // saveCurrentTreeが変更されたらrefを更新
    useEffect(() => {
        saveCurrentTreeRef.current = saveCurrentTree;
    }, [saveCurrentTree]);

    // 実際の保存を実行する関数
    const executeSave = useRef(() => {
        const currentTime = Date.now();
        console.log(`[AutoSave] Saving tree. Changes: ${changeCountRef.current}, Time since last save: ${currentTime - lastSaveTimeRef.current}ms`);
        
        saveCurrentTreeRef.current(treeRef.current, nodeTypesRef.current, treeTitleRef.current);
        lastSaveTimeRef.current = currentTime;
        changeCountRef.current = 0;
        
        // タイマーをクリア
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
            saveTimerRef.current = null;
        }
        if (batchTimerRef.current) {
            clearTimeout(batchTimerRef.current);
            batchTimerRef.current = null;
        }
    });

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

        // ツリーがロード中または存在しない場合は何もしない
        if (isTreeLoading || !activeTreeId) {
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
            
            // 変更回数をカウント
            changeCountRef.current += 1;

            // バッチ処理が有効な場合の最適化ロジック
            if (enableBatching) {
                const timeSinceLastSave = Date.now() - lastSaveTimeRef.current;
                const isFrequentChange = changeCountRef.current >= 3; // 3回以上の変更
                const isLongTimeSinceLastSave = timeSinceLastSave > batchDelay;

                // 既存のタイマーをクリア
                if (saveTimerRef.current) {
                    clearTimeout(saveTimerRef.current);
                    saveTimerRef.current = null;
                }

                if (isFrequentChange || isLongTimeSinceLastSave) {
                    // 頻繁な変更または長時間経過の場合は即座に保存
                    executeSave.current();
                } else {
                    // 通常の場合は遅延保存
                    saveTimerRef.current = setTimeout(() => {
                        executeSave.current();
                    }, delay);

                    // バッチタイマーも設定（最大待機時間の保証）
                    if (!batchTimerRef.current) {
                        batchTimerRef.current = setTimeout(() => {
                            executeSave.current();
                        }, batchDelay);
                    }
                }
            } else {
                // バッチ処理無効の場合は従来のロジック
                if (saveTimerRef.current) {
                    clearTimeout(saveTimerRef.current);
                }

                saveTimerRef.current = setTimeout(() => {
                    executeSave.current();
                }, delay);
            }
        }

        // クリーンアップ関数
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
            if (batchTimerRef.current) {
                clearTimeout(batchTimerRef.current);
            }
        };
    }, [tree, nodeTypes, treeTitle, activeTreeId, isTreeLoading, delay, batchDelay, enableBatching]);
}
