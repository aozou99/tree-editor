import { useRef, useCallback } from 'react';
import { TreeNode, NodeType } from '@/components/tree-editor/types';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/utils/i18n/i18n-context';
import { validateImportData, createExportData } from '@/components/tree-editor/utils/tree-data-utils';

export interface UseImportExportProps {
    onImportSuccess: (tree: TreeNode[], nodeTypes: NodeType[], treeTitle: string) => void;
    setImportData: (data: string) => void;
    setImportError: (error: string | null) => void;
    setIsImportDialogOpen: (isOpen: boolean) => void;
}

export function useImportExport({
    onImportSuccess,
    setImportData,
    setImportError,
    setIsImportDialogOpen,
}: UseImportExportProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useI18n();

    // ファイル選択ダイアログを開く
    const openFileSelector = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, []);

    // 選択されたファイルを読み込む
    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
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
        },
        [t, setImportData, setImportError, setIsImportDialogOpen],
    );

    // インポートを実行
    const executeImport = useCallback(
        (importData: string) => {
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
                onImportSuccess(parsedData.tree, parsedData.nodeTypes, parsedData.treeTitle || '');

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
        },
        [t, onImportSuccess, setImportError, setImportData, setIsImportDialogOpen],
    );

    // ツリーデータをJSONとしてエクスポーネント
    const exportTreeData = useCallback(
        (tree: TreeNode[], nodeTypes: NodeType[], treeTitle: string) => {
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
        },
        [t],
    );

    return {
        fileInputRef,
        openFileSelector,
        handleFileChange,
        executeImport,
        exportTreeData,
    };
}
