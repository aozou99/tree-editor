'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, Edit, Plus, RotateCcw, Download, Upload, BookTemplate, Settings, File } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { WorkspaceManager } from '@/components/tree-editor/features/workspace-manager';
import { LanguageSwitcher } from '@/components/tree-editor/features/language-switcher';
import { useI18n } from '@/utils/i18n/i18n-context';

interface TreeHeaderProps {
    treeTitle: string;
    isEditingTitle: boolean;
    lastSaved: string | null;
    activeWorkspaceId: string | null;
    setTreeTitle: (title: string) => void;
    setIsEditingTitle: (isEditing: boolean) => void;
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
    isEditingTitle,
    lastSaved,
    activeWorkspaceId,
    setTreeTitle,
    setIsEditingTitle,
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
    const [editTitle, setEditTitle] = useState(treeTitle);

    const handleTitleSave = () => {
        setTreeTitle(editTitle);
        setIsEditingTitle(false);
    };

    const handleTitleCancel = () => {
        setEditTitle(treeTitle); // Reset to current title
        setIsEditingTitle(false);
    };

    return (
        <div className='mb-4'>
            {isEditingTitle ? (
                <div className='flex items-center w-full'>
                    <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className='h-9 py-1 mr-2 text-xl font-semibold flex-1'
                        autoFocus
                    />
                    <Button size='icon' variant='outline' onClick={handleTitleSave} className='h-9 w-9'>
                        <Edit size={16} />
                    </Button>
                    <Button size='icon' variant='outline' onClick={handleTitleCancel} className='h-9 w-9 ml-2'>
                        <ChevronDown size={16} />
                    </Button>
                </div>
            ) : (
                <>
                    <div className='flex flex-wrap items-center justify-between gap-2 mb-2'>
                        <div className='flex items-center'>
                            <h2
                                className='text-xl font-semibold cursor-pointer hover:text-primary flex items-center mr-2'
                                onClick={() => setIsEditingTitle(true)}
                            >
                                {treeTitle}
                                <Edit size={14} className='ml-2 opacity-50' />
                            </h2>
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

                            <LanguageSwitcher />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant='outline' size='sm' className='h-9'>
                                        <File size={16} />
                                        <span>{t('header.file')}</span>
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
                                        <span>{t('header.settings')}</span>
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
                                <span>{t('header.addRootNode')}</span>
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
