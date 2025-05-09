'use client';

import { TreeNode, NodeType } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Plus, Edit, Trash, Save, X, Info } from 'lucide-react';

import { getNodeTypeInfo, isNodeInHighlightedPath, hasHighlightedDescendant } from '../utils/search-utils';
import { isBase64Image, isImageUrl } from '@/components/tree-editor/utils/image-utils';

interface TreeNodeComponentProps {
    node: TreeNode;
    depth?: number;
    nodeTypes: NodeType[];
    highlightedPath: Set<string>;
    focusMode: boolean;
    editingNodeId: string | null;
    editingName: string;
    draggedNodeId: string | null;
    dragOverNodeId: string | null;
    dragPosition: 'before' | 'after' | 'inside' | null;
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
}

export function TreeNodeComponent({
    node,
    depth = 0,
    nodeTypes,
    highlightedPath,
    focusMode,
    editingNodeId,
    editingName,
    draggedNodeId,
    dragOverNodeId,
    dragPosition,
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
}: TreeNodeComponentProps) {
    // ノードの状態を判断するヘルパー変数
    const hasChildren = node.children.length > 0;
    const isHighlighted = highlightedPath.has(node.id);
    // ハイライトパスの末端ノード（検索結果の対象）かどうかを判断
    const isTargetNode =
        isHighlighted && (highlightedPath.size === 1 || node.children.every((child) => !highlightedPath.has(child.id)));
    const nodeTypeInfo = getNodeTypeInfo(nodeTypes, node.nodeType);

    // ノードのアイコンを取得する関数
    const getNodeIcon = (node: TreeNode): string | undefined => {
        // ノード自身のアイコンが設定されている場合はそれを使用
        if (node.icon) {
            return node.icon;
        }

        // ノードタイプが設定されている場合はノードタイプのアイコンを使用
        if (node.nodeType) {
            const nodeType = nodeTypes.find((type) => type.id === node.nodeType);
            if (nodeType) {
                return nodeType.icon;
            }
        }

        // どちらも設定されていない場合は undefined を返す
        return undefined;
    };

    const nodeIcon = getNodeIcon(node);

    // フォーカスモードが有効で、このノードがハイライトパスに含まれていない場合は表示しない
    if (focusMode && !isHighlighted) {
        return null;
    }

    return (
        <div
            key={node.id}
            className={cn(
                'select-none',
                draggedNodeId === node.id && 'opacity-50',
                dragOverNodeId === node.id && dragPosition === 'inside' && 'bg-primary/10 rounded-md',
            )}
            draggable
            onDragStart={(e) => onDragStart(e, node.id)}
            onDragEnd={onDragEnd}
            onDragOver={(e) => onDragOver(e, node.id)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, node.id)}
        >
            {dragOverNodeId === node.id && dragPosition === 'before' && (
                <div className='h-1 bg-primary rounded-full -mt-0.5 mb-1' />
            )}

            <div
                className={cn(
                    'flex items-center py-1 px-2 group cursor-pointer',
                    depth > 0 && 'ml-6',
                    isHighlighted ? 'bg-blue-50 dark:bg-blue-900' : 'hover:bg-muted/50',
                    isTargetNode && 'bg-blue-100 dark:bg-blue-800 border-l-4 border-blue-400 dark:border-blue-300 pl-1',
                )}
                onClick={() => onNodeClick(node)}
            >
                {hasChildren ? (
                    <Button
                        size='icon'
                        variant='ghost'
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => onToggleExpand(node.id, e)}
                        className='mr-1 h-7 w-7 flex items-center justify-center'
                        tabIndex={0}
                        aria-label={node.isExpanded ? 'Collapse' : 'Expand'}
                        type='button'
                    >
                        {node.isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </Button>
                ) : (
                    <div className='w-7 mr-1' />
                )}

                {editingNodeId === node.id ? (
                    <div className='flex items-center flex-1' onClick={(e) => e.stopPropagation()}>
                        <Input
                            value={editingName}
                            onChange={(e) => onSetEditingName(e.target.value)}
                            className='h-7 py-1 mr-2'
                            autoFocus
                        />
                        <Button size='icon' variant='ghost' onClick={onSaveNodeName} className='h-7 w-7'>
                            <Save size={16} />
                        </Button>
                        <Button
                            size='icon'
                            variant='ghost'
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                e.stopPropagation();
                                onCancelEditing();
                            }}
                            className='h-7 w-7'
                        >
                            <X size={16} />
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className='flex items-center flex-1'>
                            <span className='flex-shrink-0 mr-2'>
                                {nodeIcon && (
                                    <span
                                        className={cn(
                                            'flex items-center justify-center',
                                            nodeIcon.length > 2 && !isImageUrl(nodeIcon) && !isBase64Image(nodeIcon)
                                                ? 'text-lg'
                                                : 'w-5 h-5',
                                        )}
                                    >
                                        {isImageUrl(nodeIcon) || isBase64Image(nodeIcon) ? (
                                            <img
                                                src={nodeIcon || '/placeholder.svg'}
                                                alt=''
                                                className='w-5 h-5 object-cover rounded-sm'
                                            />
                                        ) : (
                                            <span className='text-2xl'>{nodeIcon}</span>
                                        )}
                                    </span>
                                )}
                            </span>
                            <span>{node.name}</span>
                            {nodeTypeInfo && (
                                <span className='ml-2 text-xs px-2 py-0.5 bg-muted/50 rounded-full text-muted-foreground'>
                                    {nodeTypeInfo.name}
                                </span>
                            )}
                            {node.customFields && node.customFields.length > 0 && (
                                <Info size={14} className='ml-2 text-muted-foreground' />
                            )}
                        </div>
                        <div className='opacity-0 group-hover:opacity-100 flex' onClick={(e) => e.stopPropagation()}>
                            <Button
                                size='icon'
                                variant='ghost'
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => onAddChild(node.id, e)}
                                className='h-7 w-7'
                            >
                                <Plus size={16} />
                            </Button>
                            <Button
                                size='icon'
                                variant='ghost'
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => onStartEditing(node, e)}
                                className='h-7 w-7'
                            >
                                <Edit size={16} />
                            </Button>
                            <Button
                                size='icon'
                                variant='ghost'
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) => onDeleteNode(node.id, e)}
                                className='h-7 w-7'
                            >
                                <Trash size={16} />
                            </Button>
                        </div>
                    </>
                )}
            </div>

            {dragOverNodeId === node.id && dragPosition === 'after' && (
                <div className='h-1 bg-primary rounded-full mt-1' />
            )}

            {hasChildren && node.isExpanded && (
                <div className='ml-4'>
                    {node.children
                        .map((childNode) => {
                            // フォーカスモードが有効で、この子ノードがハイライトパスに含まれていない場合はスキップ
                            if (
                                focusMode &&
                                !isNodeInHighlightedPath(childNode, highlightedPath) &&
                                !hasHighlightedDescendant(childNode, highlightedPath)
                            ) {
                                return null;
                            }

                            return (
                                <TreeNodeComponent
                                    key={childNode.id}
                                    node={childNode}
                                    depth={depth + 1}
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
                            );
                        })
                        .filter(Boolean)}
                </div>
            )}
        </div>
    );
}
