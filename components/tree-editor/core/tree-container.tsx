import { TreeNode, NodeType } from '@/components/tree-editor/types';
import { TreeNodeComponent } from '@/components/tree-editor/core/tree-node';
import { cn } from '@/lib/utils';
import { useI18n } from '@/utils/i18n/i18n-context';
import type React from 'react';

type TreeNodeContainerProps = {
    expandedTree: TreeNode[];
    nodeTypes: NodeType[];
    isDraggingOverRoot: boolean;
    searchResultsHeight: number;
    isSearchFocused: boolean;
    highlightedPath: Set<string>;
    focusMode: boolean;
    editingNodeId: string | null;
    editingName: string;
    draggedNodeId: string | null;
    dragOverNodeId: string | null;
    dragPosition: 'before' | 'after' | 'inside' | null;
    onRootDragOver: React.DragEventHandler;
    onRootDragLeave: React.DragEventHandler;
    onRootDrop: React.DragEventHandler;
    onToggleExpand: (nodeId: string, e: React.MouseEvent) => void;
    onAddChild: (parentId: string, e: React.MouseEvent) => void;
    onStartEditing: (node: TreeNode, e: React.MouseEvent) => void;
    onSaveNodeName: (e?: React.MouseEvent) => void;
    onCancelEditing: () => void;
    onDeleteNode: (nodeId: string, e: React.MouseEvent) => void;
    onNodeClick: (node: TreeNode) => void;
    onSetEditingName: (name: string) => void;
    onDragStart: (e: React.DragEvent<HTMLDivElement>, nodeId: string) => void;
    onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (e: React.DragEvent<HTMLDivElement>, nodeId: string) => void;
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (e: React.DragEvent<HTMLDivElement>, nodeId: string) => void;
};

export function TreeNodeContainer({
    expandedTree,
    nodeTypes,
    isDraggingOverRoot,
    searchResultsHeight,
    isSearchFocused,
    highlightedPath,
    focusMode,
    editingNodeId,
    editingName,
    draggedNodeId,
    dragOverNodeId,
    dragPosition,
    onRootDragOver,
    onRootDragLeave,
    onRootDrop,
    onToggleExpand,
    onAddChild,
    onStartEditing,
    onSaveNodeName,
    onCancelEditing,
    onDeleteNode,
    onNodeClick,
    onSetEditingName,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
}: TreeNodeContainerProps) {
    const { t } = useI18n();

    return (
        <div
            className={cn(
                'space-y-1 transition-all duration-200 min-h-[200px] relative',
                isDraggingOverRoot && 'bg-primary/5 border-2 border-dashed border-primary/30 rounded-md p-2',
            )}
            style={{ marginTop: searchResultsHeight > 0 && isSearchFocused ? searchResultsHeight + 8 : 0 }}
            onDragOver={onRootDragOver}
            onDragLeave={onRootDragLeave}
            onDrop={onRootDrop}
        >
            {isDraggingOverRoot && (
                <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                    <p className='text-primary/70 text-sm font-medium'>{t('tree.dropHere')}</p>
                </div>
            )}
            {expandedTree.map((node) => (
                <TreeNodeComponent
                    key={node.id}
                    node={node}
                    nodeTypes={nodeTypes}
                    highlightedPath={highlightedPath}
                    focusMode={focusMode}
                    editingNodeId={editingNodeId}
                    editingName={editingName}
                    draggedNodeId={draggedNodeId}
                    dragOverNodeId={dragOverNodeId}
                    dragPosition={dragPosition}
                    onToggleExpand={onToggleExpand}
                    onAddChild={onAddChild}
                    onStartEditing={onStartEditing}
                    onSaveNodeName={onSaveNodeName}
                    onCancelEditing={onCancelEditing}
                    onDeleteNode={onDeleteNode}
                    onNodeClick={onNodeClick}
                    onSetEditingName={onSetEditingName}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                />
            ))}
        </div>
    );
}
