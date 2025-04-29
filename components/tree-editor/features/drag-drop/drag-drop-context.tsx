'use client';

import { TreeNode } from '@/components/tree-editor/types';
import { createContext, useContext, useState, type ReactNode } from 'react';

interface DragDropContextType {
    draggedNode: TreeNode | null;
    setDraggedNode: (node: TreeNode | null) => void;
    dragOverNodeId: string | null;
    setDragOverNodeId: (id: string | null) => void;
    dragPosition: 'before' | 'after' | 'inside' | null;
    setDragPosition: (position: 'before' | 'after' | 'inside' | null) => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export function DragDropProvider({ children }: { children: ReactNode }) {
    const [draggedNode, setDraggedNode] = useState<TreeNode | null>(null);
    const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
    const [dragPosition, setDragPosition] = useState<'before' | 'after' | 'inside' | null>(null);

    return (
        <DragDropContext.Provider
            value={{
                draggedNode,
                setDraggedNode,
                dragOverNodeId,
                setDragOverNodeId,
                dragPosition,
                setDragPosition,
            }}
        >
            {children}
        </DragDropContext.Provider>
    );
}

export function useDragDrop() {
    const context = useContext(DragDropContext);
    if (context === undefined) {
        throw new Error('useDragDrop must be used within a DragDropProvider');
    }
    return context;
}
