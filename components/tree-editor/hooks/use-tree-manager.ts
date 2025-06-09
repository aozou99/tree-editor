import { useState, useEffect, useCallback, useRef } from 'react';
import { TreeNode, NodeType } from '@/components/tree-editor/types';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/utils/i18n/i18n-context';
import { storageManager } from '@/lib/storage';
import type { TreeWithData } from '@/lib/storage/types';
import { useAuth } from '@/hooks/use-auth';

export interface UseTreeManagerProps {
    defaultTreeTitle: string;
    defaultTree: TreeNode[];
    defaultNodeTypes: NodeType[];
    onTreeChange: (tree: TreeNode[], nodeTypes: NodeType[], treeTitle: string) => void;
}

export function useTreeManager({
    defaultTreeTitle,
    defaultTree,
    defaultNodeTypes,
    onTreeChange,
}: UseTreeManagerProps) {
    const [activeTreeId, setActiveTreeId] = useState<string | null>(null);
    const [isTreeLoading, setIsTreeLoading] = useState(true);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [storageType, setStorageType] = useState<'local' | 'cloud'>('local');
    
    const { user } = useAuth();
    const { t } = useI18n();

    // Refs for debouncing
    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hasUnsavedChangesRef = useRef<boolean>(false);
    const activeTreeIdRef = useRef<string | null>(null);
    const isInitializedRef = useRef<boolean>(false);

    // Update storage manager with auth state
    useEffect(() => {
        storageManager.setAuthenticated(!!user);
        setStorageType(storageManager.getCurrentStorageType());
    }, [user]);

    // Update ref when activeTreeId changes
    useEffect(() => {
        activeTreeIdRef.current = activeTreeId;
    }, [activeTreeId]);

    // Debounced save function
    const debouncedSaveTree = useCallback((tree: TreeWithData) => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        hasUnsavedChangesRef.current = true;

        saveTimerRef.current = setTimeout(async () => {
            try {
                const adapter = storageManager.getAdapter();
                await adapter.updateTree(tree.id, tree);
                setLastSaved(new Date());
                hasUnsavedChangesRef.current = false;
                saveTimerRef.current = null;
            } catch (error) {
                console.error('Failed to save tree:', error);
                toast({
                    title: t('errors.saveFailed'),
                    variant: 'destructive',
                });
            }
        }, 1000);
    }, [t]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, []);

    // Save current tree
    const saveCurrentTree = useCallback(
        (nodes: TreeNode[], nodeTypes: NodeType[], treeTitle: string) => {
            const currentTreeId = activeTreeIdRef.current;
            if (!currentTreeId) return;

            const tree: TreeWithData = {
                id: currentTreeId,
                name: treeTitle,
                data: {
                    nodes,
                    expandedNodes: new Set(), // This should be managed separately
                },
                nodeTypes,
                lastSaved: new Date(),
                createdAt: new Date(), // This will be ignored in update
                updatedAt: new Date(),
            };

            debouncedSaveTree(tree);
        },
        [debouncedSaveTree]
    );

    // Switch tree
    const handleTreeChange = useCallback(
        (tree: TreeWithData) => {
            onTreeChange(tree.data.nodes, tree.nodeTypes, tree.name);
            setActiveTreeId(tree.id);
            setLastSaved(tree.lastSaved);
        },
        [onTreeChange]
    );

    // Create new tree
    const handleCreateTree = useCallback(
        async (name: string, initialData?: { nodes: TreeNode[]; nodeTypes: NodeType[] }) => {
            try {
                const adapter = storageManager.getAdapter();
                const newTree = await adapter.createTree({
                    name,
                    data: {
                        nodes: initialData?.nodes || defaultTree,
                        expandedNodes: new Set(),
                    },
                    nodeTypes: initialData?.nodeTypes || defaultNodeTypes,
                });

                handleTreeChange(newTree);

                toast({
                    title: t('toast.treeCreated'),
                    description: name,
                });

                return newTree;
            } catch (error) {
                console.error('Failed to create tree:', error);
                toast({
                    title: t('errors.createFailed'),
                    variant: 'destructive',
                });
                return null;
            }
        },
        [defaultTree, defaultNodeTypes, handleTreeChange, t]
    );

    // Delete tree
    const handleDeleteTree = useCallback(
        async (treeId: string) => {
            try {
                const adapter = storageManager.getAdapter();
                await adapter.deleteTree(treeId);

                // If deleted tree was active, switch to another
                if (treeId === activeTreeId) {
                    const trees = await adapter.getTrees();
                    if (trees.length > 0) {
                        const firstTree = await adapter.getTree(trees[0].id);
                        if (firstTree) {
                            handleTreeChange(firstTree);
                        }
                    } else {
                        // Create a new default tree
                        await handleCreateTree(t('trees.defaultName'));
                    }
                }

                toast({
                    title: t('toast.treeDeleted'),
                });
            } catch (error) {
                console.error('Failed to delete tree:', error);
                toast({
                    title: t('errors.deleteFailed'),
                    variant: 'destructive',
                });
            }
        },
        [activeTreeId, handleTreeChange, handleCreateTree, t]
    );

    // Switch storage type
    const handleStorageTypeChange = useCallback((type: 'local' | 'cloud') => {
        storageManager.setStorageType(type);
        setStorageType(type);
        
        // Reload trees from new storage
        setIsTreeLoading(true);
        isInitializedRef.current = false;
    }, []);

    // Initialize trees
    useEffect(() => {
        if (isInitializedRef.current) return;
        isInitializedRef.current = true;

        const loadInitialTree = async () => {
            setIsTreeLoading(true);

            try {
                const adapter = storageManager.getAdapter();
                const trees = await adapter.getTrees();

                if (trees.length === 0) {
                    // Create default tree
                    const newTree = await adapter.createTree({
                        name: defaultTreeTitle,
                        data: {
                            nodes: defaultTree,
                            expandedNodes: new Set(),
                        },
                        nodeTypes: defaultNodeTypes,
                    });
                    onTreeChange(newTree.data.nodes, newTree.nodeTypes, newTree.name);
                    setActiveTreeId(newTree.id);
                    setLastSaved(newTree.lastSaved);
                } else {
                    // Load first tree
                    const firstTree = await adapter.getTree(trees[0].id);
                    if (firstTree) {
                        onTreeChange(firstTree.data.nodes, firstTree.nodeTypes, firstTree.name);
                        setActiveTreeId(firstTree.id);
                        setLastSaved(firstTree.lastSaved);
                    }
                }
            } catch (error) {
                console.error('Failed to load trees:', error);
                toast({
                    title: t('errors.loadFailed'),
                    variant: 'destructive',
                });
            } finally {
                setIsTreeLoading(false);
            }
        };

        loadInitialTree();
    }, [defaultTree, defaultNodeTypes, defaultTreeTitle, t, onTreeChange, storageType]);

    return {
        activeTreeId,
        setActiveTreeId,
        isTreeLoading,
        lastSaved,
        setLastSaved,
        saveCurrentTree,
        handleTreeChange,
        handleCreateTree,
        handleDeleteTree,
        storageType,
        handleStorageTypeChange,
        isCloudAvailable: storageManager.isCloudAvailable(),
    };
}