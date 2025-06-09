import { useState, useRef, useCallback, useEffect } from 'react';
import { TreeNode, NodeType } from '@/components/tree-editor/types';
import type { TreeSnapshot } from '@/components/tree-editor/features/dialogs/history-dialog';

interface UseTreeSnapshotsProps {
    tree: TreeNode[];
    nodeTypes: NodeType[];
    treeTitle: string;
    activeTreeId: string | null;
    maxSnapshots?: number;
}

export function useTreeSnapshots({
    tree,
    nodeTypes,
    treeTitle,
    activeTreeId,
    maxSnapshots = 10,
}: UseTreeSnapshotsProps) {
    const [snapshots, setSnapshots] = useState<Map<string, TreeSnapshot[]>>(new Map());
    const lastSnapshotRef = useRef<string>('');

    // Create an auto snapshot
    const createAutoSnapshot = useCallback(() => {
        if (!activeTreeId) return;

        const snapshotData = JSON.stringify({ tree, nodeTypes, treeTitle });
        
        // Don't create duplicate snapshots
        if (lastSnapshotRef.current === snapshotData) return;
        
        const newSnapshot: TreeSnapshot = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            tree: JSON.parse(JSON.stringify(tree)), // Deep copy
            nodeTypes: JSON.parse(JSON.stringify(nodeTypes)), // Deep copy
            treeTitle,
            type: 'auto',
        };

        setSnapshots(prev => {
            const treeSnapshots = prev.get(activeTreeId) || [];
            // Only limit auto snapshots, not manual ones
            const autoSnapshots = treeSnapshots.filter(s => s.type === 'auto');
            const manualSnapshots = treeSnapshots.filter(s => s.type === 'manual');
            const limitedAutoSnapshots = [newSnapshot, ...autoSnapshots].slice(0, maxSnapshots);
            const updatedSnapshots = [...manualSnapshots, ...limitedAutoSnapshots]
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            
            const newMap = new Map(prev);
            newMap.set(activeTreeId, updatedSnapshots);
            return newMap;
        });

        lastSnapshotRef.current = snapshotData;
    }, [tree, nodeTypes, treeTitle, activeTreeId, maxSnapshots]);

    // Create a manual snapshot
    const createManualSnapshot = useCallback((title: string, description?: string) => {
        if (!activeTreeId) return;
        
        const newSnapshot: TreeSnapshot = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            tree: JSON.parse(JSON.stringify(tree)), // Deep copy
            nodeTypes: JSON.parse(JSON.stringify(nodeTypes)), // Deep copy
            treeTitle,
            title,
            description,
            type: 'manual',
        };

        setSnapshots(prev => {
            const treeSnapshots = prev.get(activeTreeId) || [];
            const updatedSnapshots = [newSnapshot, ...treeSnapshots]
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            
            const newMap = new Map(prev);
            newMap.set(activeTreeId, updatedSnapshots);
            return newMap;
        });
    }, [tree, nodeTypes, treeTitle, activeTreeId]);

    // Auto-create snapshots on significant changes
    useEffect(() => {
        if (!activeTreeId || tree.length === 0) return;

        // Create a snapshot after a delay to avoid too many snapshots
        const timer = setTimeout(() => {
            createAutoSnapshot();
        }, 2000); // 2 seconds delay

        return () => clearTimeout(timer);
    }, [tree, nodeTypes, treeTitle, activeTreeId, createAutoSnapshot]);

    // Get snapshots for current tree
    const getCurrentSnapshots = useCallback((): TreeSnapshot[] => {
        if (!activeTreeId) return [];
        return snapshots.get(activeTreeId) || [];
    }, [activeTreeId, snapshots]);

    // Clear snapshots for a tree
    const clearSnapshots = useCallback((treeId?: string) => {
        const targetTreeId = treeId || activeTreeId;
        if (!targetTreeId) return;

        setSnapshots(prev => {
            const newMap = new Map(prev);
            newMap.delete(targetTreeId);
            return newMap;
        });
    }, [activeTreeId]);

    // Restore from snapshot
    const restoreFromSnapshot = useCallback((snapshot: TreeSnapshot): {
        tree: TreeNode[];
        nodeTypes: NodeType[];
        treeTitle: string;
    } => {
        return {
            tree: JSON.parse(JSON.stringify(snapshot.tree)),
            nodeTypes: JSON.parse(JSON.stringify(snapshot.nodeTypes)),
            treeTitle: snapshot.treeTitle,
        };
    }, []);

    return {
        snapshots: getCurrentSnapshots(),
        createAutoSnapshot,
        createManualSnapshot,
        clearSnapshots,
        restoreFromSnapshot,
    };
}