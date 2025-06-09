'use client';

import { Button } from '@/components/ui/button';
import { ChevronDown, Plus, RotateCcw, Download, Upload, BookTemplate, Settings, File } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { TreeManager } from '@/components/tree-editor/features/tree-manager';
import { useI18n } from '@/utils/i18n/i18n-context';
import type { TreeWithData } from '@/lib/storage/types';

interface TreeHeaderProps {
    treeTitle: string;
    lastSaved: Date | null;
    activeTreeId: string | null;
    handleTreeChange: (tree: TreeWithData) => void;
    handleCreateTree: (name: string) => Promise<TreeWithData | null>;
    handleDeleteTree: (treeId: string) => Promise<void>;
    storageType: 'local' | 'cloud';
    onStorageTypeChange: (type: 'local' | 'cloud') => void;
    isCloudAvailable: boolean;
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
    activeTreeId,
    handleTreeChange,
    handleCreateTree,
    handleDeleteTree,
    storageType,
    onStorageTypeChange,
    isCloudAvailable,
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
                </div>

                <div className='flex items-center gap-2'>
                    <TreeManager
                        activeTreeId={activeTreeId}
                        onTreeChange={handleTreeChange}
                        onCreateTree={handleCreateTree}
                        onDeleteTree={handleDeleteTree}
                        storageType={storageType}
                        onStorageTypeChange={onStorageTypeChange}
                        isCloudAvailable={isCloudAvailable}
                        lastSaved={lastSaved}
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
