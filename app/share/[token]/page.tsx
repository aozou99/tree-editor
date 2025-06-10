'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TreeNode, NodeType } from '@/components/tree-editor/types';
import { TreeNodeContainer } from '@/components/tree-editor/core/tree-container';
import SearchFeature from '@/components/tree-editor/features/search/search-feature';
import { NodeDetailModal } from '@/components/tree-editor/modals/node-detail-modal';
import { useSearch } from '@/components/tree-editor/hooks/use-search';
import { useTreeModals } from '@/components/tree-editor/hooks/use-tree-modals';
import { useDocumentTitle } from '@uidotdev/usehooks';
import { Eye, AlertCircle } from 'lucide-react';
import type { SearchResult } from '@/components/tree-editor/types/search-types';

interface SharedTreeData {
  share: {
    id: string;
    title: string;
    description?: string;
    treeName?: string;
  };
  tree: {
    data: {
      nodes: any[];
      expandedNodes: string[];
    };
    nodeTypes: any[];
  };
}

export default function ShareViewerPage() {
  const params = useParams();
  const token = params?.token as string;
  
  const [sharedData, setSharedData] = useState<SharedTreeData | null>(null);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [nodeTypes, setNodeTypes] = useState<NodeType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load shared tree data
  useEffect(() => {
    if (!token) return;

    const loadSharedTree = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/shares/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('共有リンクが見つかりません');
          } else if (response.status === 403) {
            const data = await response.json();
            setError(data.error === 'Share has expired' ? '共有リンクの有効期限が切れています' : '共有リンクが無効です');
          } else {
            setError('共有データの読み込みに失敗しました');
          }
          return;
        }

        const data: SharedTreeData = await response.json();
        setSharedData(data);
        setTree(data.tree.data.nodes);
        setNodeTypes(data.tree.nodeTypes);
      } catch (error) {
        console.error('Failed to load shared tree:', error);
        setError('データの読み込み中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadSharedTree();
  }, [token]);

  // Modal management
  const {
    selectedNode,
    isDetailModalOpen,
    setIsDetailModalOpen,
    openNodeDetailModal,
  } = useTreeModals();

  // Search functionality
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    selectedResultIndex,
    highlightedPath,
    focusMode,
    searchInputRef,
    searchResultsRef,
    searchResultsHeight,
    isSearchFocused,
    setIsSearchFocused,
    handleSelectSearchResult,
    handleSearchKeyDown,
    expandedTree,
  } = useSearch({ tree, nodeTypes });

  // Set page title
  useDocumentTitle(sharedData ? `${sharedData.share.title} - Tree Viewer` : 'Tree Viewer');

  // Handle search result click
  const handleOpenDetailModal = (result: SearchResult) => {
    openNodeDetailModal(result.node);
  };

  // Handle search key down with modal
  const handleSearchKeyDownWithModal = (e: React.KeyboardEvent<Element>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === 'Enter' && searchResults.length > 0 && selectedResultIndex >= 0) {
      e.preventDefault();
      handleOpenDetailModal(searchResults[selectedResultIndex]);
    } else {
      handleSearchKeyDown(e);
    }
  };

  // Handle node click
  const handleNodeClick = (node: TreeNode) => openNodeDetailModal(node);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <Card className="w-96">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="text-destructive" size={20} />
                  エラー
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!sharedData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Eye size={20} />
                  {sharedData.share.title}
                </CardTitle>
                {sharedData.share.description && (
                  <CardDescription>{sharedData.share.description}</CardDescription>
                )}
              </div>
              <Badge variant="secondary" className="ml-auto">
                読み取り専用
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Tree Editor in Viewer Mode */}
        <Card>
          <CardContent className="p-6">
            {/* Search */}
            <div className="mb-4 relative">
              <SearchFeature
                searchQuery={searchQuery}
                onChange={setSearchQuery}
                onKeyDown={handleSearchKeyDownWithModal}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                inputRef={searchInputRef}
                searchResults={searchResults}
                selectedResultIndex={selectedResultIndex}
                onSelectResult={handleSelectSearchResult}
                onOpenResult={handleOpenDetailModal}
                searchResultsRef={searchResultsRef}
                isSearchFocused={isSearchFocused}
                searchResultsHeight={searchResultsHeight}
              />
            </div>

            {/* Tree Container - Read Only */}
            <TreeNodeContainer
              expandedTree={expandedTree}
              nodeTypes={nodeTypes}
              isDraggingOverRoot={false}
              searchResultsHeight={searchResultsHeight}
              isSearchFocused={isSearchFocused}
              highlightedPath={highlightedPath}
              focusMode={focusMode}
              editingNodeId={null}
              editingName=""
              draggedNodeId={null}
              dragOverNodeId={null}
              dragPosition={null}
              onRootDragOver={() => {}}
              onRootDragLeave={() => {}}
              onRootDrop={() => {}}
              onToggleExpand={(nodeId: string, e: React.MouseEvent) => {
                e.stopPropagation();
                const updateNode = (nodes: TreeNode[]): TreeNode[] => {
                  return nodes.map((node) => {
                    if (node.id === nodeId) {
                      return { ...node, isExpanded: !node.isExpanded };
                    }
                    if (node.children.length > 0) {
                      return { ...node, children: updateNode(node.children) };
                    }
                    return node;
                  });
                };
                setTree(updateNode(tree));
              }}
              onAddChild={() => {}} // Disabled in viewer
              onStartEditing={() => {}} // Disabled in viewer
              onSaveNodeName={() => {}} // Disabled in viewer
              onCancelEditing={() => {}} // Disabled in viewer
              onDeleteNode={() => {}} // Disabled in viewer
              onNodeClick={handleNodeClick}
              onSetEditingName={() => {}} // Disabled in viewer
              onDragStart={() => {}} // Disabled in viewer
              onDragEnd={() => {}} // Disabled in viewer
              onDragOver={() => {}} // Disabled in viewer
              onDragLeave={() => {}} // Disabled in viewer
              onDrop={() => {}} // Disabled in viewer
              isViewerMode={true} // Special prop to indicate viewer mode
            />
          </CardContent>
        </Card>

        {/* Node Detail Modal - Read Only */}
        <NodeDetailModal
          node={
            selectedNode || {
              id: '',
              name: '',
              children: [],
              customFields: [],
            }
          }
          open={isDetailModalOpen && selectedNode !== null}
          onOpenChange={setIsDetailModalOpen}
          onUpdateNode={() => {}} // Disabled in viewer
          nodeTypes={nodeTypes}
          isViewerMode={true} // Read-only mode
        />
      </div>
    </div>
  );
}