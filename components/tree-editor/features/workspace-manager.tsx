'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { EditIcon, Trash2Icon, CheckIcon, FolderIcon, PlusIcon, ChevronDownIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/utils/i18n/i18n-context';

import type { Workspace } from '@/components/tree-editor/utils/workspace-utils';
import {
    loadWorkspaceList,
    loadWorkspace,
    renameWorkspace,
    deleteWorkspace,
    setActiveWorkspace,
} from '@/components/tree-editor/utils/workspace-utils';

interface WorkspaceManagerProps {
    activeWorkspaceId: string | null;
    onWorkspaceChange: (workspace: Workspace) => void;
    onCreateWorkspace: (name: string) => void;
}

export function WorkspaceManager({ activeWorkspaceId, onWorkspaceChange, onCreateWorkspace }: WorkspaceManagerProps) {
    const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string; updatedAt: string }>>([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');
    const [renameWorkspaceId, setRenameWorkspaceId] = useState<string | null>(null);
    const [renameWorkspaceName, setRenameWorkspaceName] = useState('');
    const [deleteWorkspaceId, setDeleteWorkspaceId] = useState<string | null>(null);
    const [deleteWorkspaceName, setDeleteWorkspaceName] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { t } = useI18n();

    // ワークスペース一覧を読み込む
    const loadWorkspaces = () => {
        const { workspaces } = loadWorkspaceList();
        setWorkspaces(
            workspaces.map((ws) => ({
                id: ws.id,
                name: ws.name,
                updatedAt: ws.updatedAt,
            })),
        );
    };

    // 初期化時にワークスペース一覧を読み込む
    useEffect(() => {
        loadWorkspaces();
    }, []);

    // ワークスペースを切り替える
    const handleSwitchWorkspace = (workspaceId: string) => {
        const workspace = loadWorkspace(workspaceId);
        if (workspace) {
            setActiveWorkspace(workspaceId);
            onWorkspaceChange(workspace);
            setIsDropdownOpen(false);
        } else {
            toast({
                title: t('common.error'),
                description: t('workspace.errors.loadFailed'),
                variant: 'destructive',
            });
        }
    };

    // 新しいワークスペースを作成する
    const handleCreateWorkspace = () => {
        if (!newWorkspaceName.trim()) return;

        onCreateWorkspace(newWorkspaceName);
        setIsCreateDialogOpen(false);
        setNewWorkspaceName('');
        loadWorkspaces(); // ワークスペース一覧を更新
    };

    // ワークスペースの名前変更ダイアログを開く
    const openRenameDialog = (workspaceId: string, currentName: string) => {
        setRenameWorkspaceId(workspaceId);
        setRenameWorkspaceName(currentName);
        setIsRenameDialogOpen(true);
        setIsDropdownOpen(false);
    };

    // ワークスペースの名前を変更する
    const handleRenameWorkspace = () => {
        if (!renameWorkspaceId || !renameWorkspaceName.trim()) return;

        if (renameWorkspace(renameWorkspaceId, renameWorkspaceName)) {
            toast({
                title: t('common.success'),
                description: t('workspace.success.renamed'),
            });

            // アクティブなワークスペースの場合、表示を更新
            if (renameWorkspaceId === activeWorkspaceId) {
                const workspace = loadWorkspace(renameWorkspaceId);
                if (workspace) {
                    onWorkspaceChange(workspace);
                }
            }
        } else {
            toast({
                title: t('common.error'),
                description: t('workspace.errors.renameFailed'),
                variant: 'destructive',
            });
        }

        setIsRenameDialogOpen(false);
        setRenameWorkspaceId(null);
        setRenameWorkspaceName('');
        loadWorkspaces(); // ワークスペース一覧を更新
    };

    // ワークスペースの削除ダイアログを開く
    const openDeleteDialog = (workspaceId: string, workspaceName: string) => {
        setDeleteWorkspaceId(workspaceId);
        setDeleteWorkspaceName(workspaceName);
        setIsDeleteDialogOpen(true);
        setIsDropdownOpen(false);
    };

    // ワークスペースを削除する
    const handleDeleteWorkspace = () => {
        if (!deleteWorkspaceId) return;

        if (deleteWorkspace(deleteWorkspaceId)) {
            toast({
                title: t('common.success'),
                description: t('workspace.success.deleted'),
            });

            // ワークスペース一覧を更新
            const { workspaces, activeWorkspaceId: newActiveId } = loadWorkspaceList();
            setWorkspaces(
                workspaces.map((ws) => ({
                    id: ws.id,
                    name: ws.name,
                    updatedAt: ws.updatedAt,
                })),
            );

            // アクティブなワークスペースが削除された場合、新しいアクティブなワークスペースに切り替える
            if (newActiveId && newActiveId !== activeWorkspaceId) {
                const workspace = loadWorkspace(newActiveId);
                if (workspace) {
                    onWorkspaceChange(workspace);
                }
            }
        } else {
            toast({
                title: t('common.error'),
                description: t('workspace.errors.deleteFailed'),
                variant: 'destructive',
            });
        }

        setIsDeleteDialogOpen(false);
        setDeleteWorkspaceId(null);
        setDeleteWorkspaceName('');
    };

    // 現在のワークスペース名を取得
    const activeWorkspaceName = activeWorkspaceId
        ? workspaces.find((ws) => ws.id === activeWorkspaceId)?.name || t('workspace.untitledName')
        : t('workspace.noWorkspace');

    return (
        <>
            <div className='flex items-center'>
                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant='outline'
                            size='sm'
                            className='h-9 px-2 sm:px-3 flex items-center gap-1'
                            title={t('workspace.switch')}
                        >
                            <FolderIcon size={16} className='sm:mr-1' />
                            <span className='truncate max-w-[120px] hidden sm:inline'>{activeWorkspaceName}</span>
                            <ChevronDownIcon size={14} />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='start' className='w-56'>
                        {workspaces.length > 0 ? (
                            <>
                                {workspaces.map((workspace) => (
                                    <DropdownMenuItem
                                        key={workspace.id}
                                        className='flex items-center justify-between py-2'
                                        onSelect={(e) => {
                                            e.preventDefault();
                                            handleSwitchWorkspace(workspace.id);
                                        }}
                                    >
                                        <div className='flex items-center space-x-2'>
                                            {workspace.id === activeWorkspaceId && (
                                                <CheckIcon size={14} className='text-green-500' />
                                            )}
                                            <span className={workspace.id === activeWorkspaceId ? 'font-medium' : ''}>
                                                {workspace.name}
                                            </span>
                                        </div>
                                        <div className='flex items-center space-x-1'>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            className='h-6 w-6'
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openRenameDialog(workspace.id, workspace.name);
                                                            }}
                                                        >
                                                            <EditIcon size={12} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side='left'>{t('workspace.rename')}</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            className='h-6 w-6 text-destructive'
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openDeleteDialog(workspace.id, workspace.name);
                                                            }}
                                                            disabled={workspaces.length <= 1} // 最後のワークスペースは削除できない
                                                        >
                                                            <Trash2Icon size={12} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side='left'>{t('workspace.delete')}</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                            </>
                        ) : (
                            <div className='py-2 px-2 text-sm text-muted-foreground'>{t('workspace.noWorkspaces')}</div>
                        )}
                        <DropdownMenuItem
                            className='py-2'
                            onSelect={(e) => {
                                e.preventDefault();
                                setIsCreateDialogOpen(true);
                                setIsDropdownOpen(false);
                            }}
                        >
                            <PlusIcon size={14} className='mr-2' />
                            <span>{t('workspace.new')}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* 新規ワークスペース作成ダイアログ */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className='sm:max-w-md'>
                    <DialogHeader>
                        <DialogTitle>{t('workspace.createTitle')}</DialogTitle>
                        <DialogDescription>{t('workspace.createDescription')}</DialogDescription>
                    </DialogHeader>
                    <div className='py-4'>
                        <Input
                            value={newWorkspaceName}
                            onChange={(e) => setNewWorkspaceName(e.target.value)}
                            placeholder={t('workspace.namePlaceholder')}
                            className='w-full'
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setIsCreateDialogOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleCreateWorkspace} disabled={!newWorkspaceName.trim()}>
                            {t('workspace.create')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ワークスペース名変更ダイアログ */}
            <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                <DialogContent className='sm:max-w-md'>
                    <DialogHeader>
                        <DialogTitle>{t('workspace.renameTitle')}</DialogTitle>
                        <DialogDescription>{t('workspace.renameDescription')}</DialogDescription>
                    </DialogHeader>
                    <div className='py-4'>
                        <Input
                            value={renameWorkspaceName}
                            onChange={(e) => setRenameWorkspaceName(e.target.value)}
                            placeholder={t('workspace.newNamePlaceholder')}
                            className='w-full'
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setIsRenameDialogOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleRenameWorkspace} disabled={!renameWorkspaceName.trim()}>
                            {t('workspace.change')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ワークスペース削除確認ダイアログ */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className='sm:max-w-md'>
                    <DialogHeader>
                        <DialogTitle>{t('workspace.deleteTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('workspace.deleteDescription', { name: deleteWorkspaceName })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className='py-4'>
                        <p className='text-red-500 font-medium'>{t('workspace.deleteWarning')}</p>
                    </div>
                    <DialogFooter>
                        <Button variant='outline' onClick={() => setIsDeleteDialogOpen(false)}>
                            {t('common.cancel')}
                        </Button>
                        <Button variant='destructive' onClick={handleDeleteWorkspace}>
                            {t('workspace.delete')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
