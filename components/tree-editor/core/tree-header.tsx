'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus, RotateCcw, Download, Upload, BookTemplate, Settings, File } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { WorkspaceManager } from '@/components/tree-editor/features/workspace-manager';
import { useI18n } from '@/utils/i18n/i18n-context';

interface TreeHeaderProps {
    treeTitle: string;
    lastSaved: string | null;
    activeWorkspaceId: string | null;
    handleWorkspaceChange: (workspace: any) => void;
    handleCreateWorkspace: (name: string) => void;
    exportTreeData: () => void;
    openFileSelector: () => void;
    setIsSampleSelectorOpen: (isOpen: boolean) => void;
    setIsNodeTypeModalOpen: (isOpen: boolean) => void;
    setIsResetDialogOpen: (isOpen: boolean) => void;
    addRootNode: () => void;
}

export function TreeHeader({
    treeTitle,
    lastSaved,
    activeWorkspaceId,
    handleWorkspaceChange,
    handleCreateWorkspace,
    exportTreeData,
    openFileSelector,
    setIsSampleSelectorOpen,
    setIsNodeTypeModalOpen,
    setIsResetDialogOpen,
    addRootNode,
}: TreeHeaderProps) {
    const { t } = useI18n();

    return (
        <div className='mb-4'>
            <div className='flex flex-wrap items-center justify-between gap-2 mb-2'>
                <div className='flex items-center'>
                    <h2 className='text-xl font-semibold mr-2'>{treeTitle}</h2>
                    {lastSaved && (
                        <span className='text-xs text-muted-foreground whitespace-nowrap'>
                            {t('common.lastSaved')}: {new Date(lastSaved).toLocaleTimeString()}
                        </span>
                    )}
                </div>

                <div className='flex items-center gap-2'>
                    <WorkspaceManager
                        activeWorkspaceId={activeWorkspaceId}
                        onWorkspaceChange={handleWorkspaceChange}
                        onCreateWorkspace={handleCreateWorkspace}
                    />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant='outline' size='sm' className='h-9'>
                                <File size={16} />
                                <span className='hidden md:inline'>{t('header.file')}</span>
                                <ChevronDown size={14} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-56'>
                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={exportTreeData}>
                                    <Download size={16} className='mr-2' />
                                    <span>{t('common.export')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={openFileSelector}>
                                    <Upload size={16} className='mr-2' />
                                    <span>{t('common.import')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsSampleSelectorOpen(true)}>
                                    <BookTemplate size={16} className='mr-2' />
                                    <span>{t('header.sampleSelection')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant='outline' size='sm' className='h-9'>
                                <Settings size={16} />
                                <span className='hidden md:inline'>{t('header.settings')}</span>
                                <ChevronDown size={14} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-56'>
                            <DropdownMenuGroup>
                                <DropdownMenuItem onClick={() => setIsNodeTypeModalOpen(true)}>
                                    <Settings size={16} className='mr-2' />
                                    <span>{t('header.nodeTypeManagement')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsResetDialogOpen(true)}>
                                    <RotateCcw size={16} className='mr-2' />
                                    <span>{t('common.reset')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button onClick={addRootNode} size='sm' className='h-9'>
                        <Plus size={16} />
                        <span className='hidden md:inline'>{t('header.addRootNode')}</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
