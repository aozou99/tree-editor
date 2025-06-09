'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  EditIcon,
  Trash2Icon,
  CheckIcon,
  TreePineIcon,
  PlusIcon,
  ChevronDownIcon,
  CloudIcon,
  HardDriveIcon,
  WifiOffIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/utils/i18n/i18n-context';
import { storageManager } from '@/lib/storage';
import type { TreeInfo, TreeWithData } from '@/lib/storage/types';

interface TreeManagerProps {
  activeTreeId: string | null;
  onTreeChange: (tree: TreeWithData) => void;
  onCreateTree: (name: string) => Promise<TreeWithData | null>;
  onDeleteTree: (treeId: string) => Promise<void>;
  storageType: 'local' | 'cloud';
  onStorageTypeChange: (type: 'local' | 'cloud') => void;
  isCloudAvailable: boolean;
  lastSaved?: Date | null;
}

export function TreeManager({
  activeTreeId,
  onTreeChange,
  onCreateTree,
  onDeleteTree,
  storageType,
  onStorageTypeChange,
  isCloudAvailable,
  lastSaved,
}: TreeManagerProps) {
  const [trees, setTrees] = useState<TreeInfo[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');
  const [renameTreeId, setRenameTreeId] = useState<string | null>(null);
  const [renameTreeName, setRenameTreeName] = useState('');
  const [deleteTreeId, setDeleteTreeId] = useState<string | null>(null);
  const [deleteTreeName, setDeleteTreeName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useI18n();

  // Load trees list
  const loadTrees = async () => {
    try {
      setIsLoading(true);
      const adapter = storageManager.getAdapter();
      const treeList = await adapter.getTrees();
      setTrees(treeList);
    } catch (error) {
      console.error('Failed to load trees:', error);
      toast({
        title: t('common.error'),
        description: t('trees.errors.loadFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load trees when storage type changes
  useEffect(() => {
    loadTrees();
  }, [storageType]);

  // Switch tree
  const handleSwitchTree = async (treeId: string) => {
    try {
      const adapter = storageManager.getAdapter();
      const tree = await adapter.getTree(treeId);
      if (tree) {
        onTreeChange(tree);
        setIsDropdownOpen(false);
      }
    } catch (error) {
      console.error('Failed to load tree:', error);
      toast({
        title: t('common.error'),
        description: t('trees.errors.loadFailed'),
        variant: 'destructive',
      });
    }
  };

  // Create new tree
  const handleCreateTree = async () => {
    if (!newTreeName.trim()) return;

    const tree = await onCreateTree(newTreeName);
    if (tree) {
      setIsCreateDialogOpen(false);
      setNewTreeName('');
      await loadTrees();
    }
  };

  // Open rename dialog
  const openRenameDialog = (treeId: string, currentName: string) => {
    setRenameTreeId(treeId);
    setRenameTreeName(currentName);
    setIsRenameDialogOpen(true);
    setIsDropdownOpen(false);
  };

  // Rename tree
  const handleRenameTree = async () => {
    if (!renameTreeId || !renameTreeName.trim()) return;

    try {
      const adapter = storageManager.getAdapter();
      await adapter.updateTree(renameTreeId, { name: renameTreeName });

      toast({
        title: t('common.success'),
        description: t('trees.success.renamed'),
      });

      // If it's the active tree, update the display
      if (renameTreeId === activeTreeId) {
        const tree = await adapter.getTree(renameTreeId);
        if (tree) {
          onTreeChange(tree);
        }
      }

      await loadTrees();
    } catch (error) {
      console.error('Failed to rename tree:', error);
      toast({
        title: t('common.error'),
        description: t('trees.errors.renameFailed'),
        variant: 'destructive',
      });
    }

    setIsRenameDialogOpen(false);
    setRenameTreeId(null);
    setRenameTreeName('');
  };

  // Open delete dialog
  const openDeleteDialog = (treeId: string, treeName: string) => {
    setDeleteTreeId(treeId);
    setDeleteTreeName(treeName);
    setIsDeleteDialogOpen(true);
    setIsDropdownOpen(false);
  };

  // Delete tree
  const handleDeleteTree = async () => {
    if (!deleteTreeId) return;

    try {
      await onDeleteTree(deleteTreeId);
      await loadTrees();
    } catch (error) {
      console.error('Failed to delete tree:', error);
    }

    setIsDeleteDialogOpen(false);
    setDeleteTreeId(null);
    setDeleteTreeName('');
  };

  // Get current tree name
  const activeTreeName = activeTreeId
    ? trees.find(tree => tree.id === activeTreeId)?.name || t('trees.untitledName')
    : t('trees.noTree');

  // Format last saved time
  const formatLastSaved = (date: Date | null) => {
    if (!date) return '';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return t('trees.savedJustNow');
    if (minutes === 1) return t('trees.saved1MinuteAgo');
    if (minutes < 60) return t('trees.savedMinutesAgo', { minutes });

    const hours = Math.floor(minutes / 60);
    if (hours === 1) return t('trees.saved1HourAgo');
    if (hours < 24) return t('trees.savedHoursAgo', { hours });

    return date.toLocaleDateString();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Storage Type Indicator */}
        <div className="flex items-center">
          <Badge
            variant={storageType === 'cloud' ? 'default' : 'secondary'}
            className="text-xs px-2 py-1"
          >
            {storageType === 'cloud' ? (
              <>
                <CloudIcon size={12} className="mr-1" />
                {t('storage.cloud')}
              </>
            ) : (
              <>
                <HardDriveIcon size={12} className="mr-1" />
                {t('storage.local')}
              </>
            )}
          </Badge>
        </div>

        {/* Tree Selector */}
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2 sm:px-3 flex items-center"
              title={t('trees.switch')}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCwIcon size={16} className="animate-spin" />
              ) : (
                <TreePineIcon size={16} />
              )}
              <span className="truncate max-w-[120px] hidden md:inline">{activeTreeName}</span>
              <ChevronDownIcon size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {/* Storage Type Switcher */}
            {isCloudAvailable && (
              <>
                <div className="p-2">
                  <div className="text-xs font-medium mb-2">{t('storage.type')}</div>
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      variant={storageType === 'local' ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => onStorageTypeChange('local')}
                    >
                      <HardDriveIcon size={12} className="mr-1" />
                      {t('storage.local')}
                    </Button>
                    <Button
                      variant={storageType === 'cloud' ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => onStorageTypeChange('cloud')}
                    >
                      <CloudIcon size={12} className="mr-1" />
                      {t('storage.cloud')}
                    </Button>
                  </div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Trees List */}
            {trees.length > 0 ? (
              <>
                {trees.map(tree => (
                  <DropdownMenuItem
                    key={tree.id}
                    className="flex items-center justify-between py-2"
                    onSelect={(e: Event) => {
                      e.preventDefault();
                      handleSwitchTree(tree.id);
                    }}
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      {tree.id === activeTreeId && (
                        <CheckIcon size={14} className="text-green-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={tree.id === activeTreeId ? 'font-medium' : ''}>
                          {tree.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatLastSaved(tree.lastSaved)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                openRenameDialog(tree.id, tree.name);
                              }}
                            >
                              <EditIcon size={12} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">{t('trees.rename')}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                openDeleteDialog(tree.id, tree.name);
                              }}
                              disabled={trees.length <= 1}
                            >
                              <Trash2Icon size={12} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left">{t('trees.delete')}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            ) : (
              <div className="py-2 px-2 text-sm text-muted-foreground">{t('trees.noTrees')}</div>
            )}

            <DropdownMenuItem
              className="py-2"
              onSelect={(e: Event) => {
                e.preventDefault();
                setIsCreateDialogOpen(true);
                setIsDropdownOpen(false);
              }}
            >
              <PlusIcon size={14} className="mr-2" />
              <span>{t('trees.new')}</span>
            </DropdownMenuItem>

            {/* Cloud connection status */}
            {!isCloudAvailable && (
              <>
                <DropdownMenuSeparator />
                <div className="p-2 text-xs text-muted-foreground flex items-center">
                  <WifiOffIcon size={12} className="mr-1" />
                  {t('storage.cloudUnavailable')}
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Tree Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('trees.createTitle')}</DialogTitle>
            <DialogDescription>{t('trees.createDescription')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newTreeName}
              onChange={e => setNewTreeName(e.target.value)}
              placeholder={t('trees.namePlaceholder')}
              className="w-full"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleCreateTree} disabled={!newTreeName.trim()}>
              {t('trees.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Tree Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('trees.renameTitle')}</DialogTitle>
            <DialogDescription>{t('trees.renameDescription')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameTreeName}
              onChange={e => setRenameTreeName(e.target.value)}
              placeholder={t('trees.newNamePlaceholder')}
              className="w-full"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleRenameTree} disabled={!renameTreeName.trim()}>
              {t('trees.change')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tree Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('trees.deleteTitle')}</DialogTitle>
            <DialogDescription>
              {t('trees.deleteDescription', { name: deleteTreeName })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-red-500 font-medium">{t('trees.deleteWarning')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteTree}>
              {t('trees.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
