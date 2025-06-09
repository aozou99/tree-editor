'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { 
    CloudIcon, 
    HardDriveIcon, 
    ArrowRightIcon, 
    CheckCircleIcon, 
    AlertTriangleIcon,
    DownloadIcon,
    RefreshCwIcon
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useI18n } from '@/utils/i18n/i18n-context';
import { DataMigration, type MigrationResult } from '@/lib/storage/migration';

interface MigrationDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onMigrationComplete: () => void;
}

export function MigrationDialog({ isOpen, onOpenChange, onMigrationComplete }: MigrationDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<{
        localTrees: number;
        cloudTrees: number;
        conflicts: string[];
    } | null>(null);
    const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
    const [step, setStep] = useState<'preview' | 'migrating' | 'completed'>('preview');
    const { t } = useI18n();

    const migration = new DataMigration();

    // Load preview when dialog opens
    useEffect(() => {
        if (isOpen && step === 'preview') {
            loadPreview();
        }
    }, [isOpen, step]);

    const loadPreview = async () => {
        try {
            setIsLoading(true);
            const previewData = await migration.getMigrationPreview();
            setPreview(previewData);
        } catch (error) {
            console.error('Failed to load migration preview:', error);
            toast({
                title: t('common.error'),
                description: t('migration.errors.previewFailed'),
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMigration = async () => {
        try {
            setIsLoading(true);
            setStep('migrating');
            
            const result = await migration.migrateLocalToCloud();
            setMigrationResult(result);
            setStep('completed');

            if (result.success) {
                toast({
                    title: t('migration.success.title'),
                    description: t('migration.success.description', { count: result.migratedCount }),
                });
                onMigrationComplete();
            } else {
                toast({
                    title: t('migration.errors.title'),
                    description: t('migration.errors.description'),
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Migration failed:', error);
            toast({
                title: t('common.error'),
                description: t('migration.errors.migrationFailed'),
                variant: 'destructive',
            });
            setStep('preview');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackup = async () => {
        try {
            setIsLoading(true);
            const backupData = await migration.backupLocalData();
            
            // Create and download backup file
            const blob = new Blob([backupData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tree-editor-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({
                title: t('migration.backup.success'),
                description: t('migration.backup.downloaded'),
            });
        } catch (error) {
            console.error('Backup failed:', error);
            toast({
                title: t('common.error'),
                description: t('migration.backup.failed'),
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setStep('preview');
        setPreview(null);
        setMigrationResult(null);
        onOpenChange(false);
    };

    const renderPreview = () => (
        <>
            <DialogHeader>
                <DialogTitle className='flex items-center gap-2'>
                    <ArrowRightIcon size={20} />
                    {t('migration.title')}
                </DialogTitle>
                <DialogDescription>
                    {t('migration.description')}
                </DialogDescription>
            </DialogHeader>

            <div className='py-4 space-y-4'>
                {isLoading ? (
                    <div className='flex items-center justify-center py-8'>
                        <RefreshCwIcon size={24} className='animate-spin' />
                        <span className='ml-2'>{t('migration.loadingPreview')}</span>
                    </div>
                ) : preview ? (
                    <>
                        {/* Migration Overview */}
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='flex items-center p-3 border rounded-lg'>
                                <HardDriveIcon size={20} className='mr-2 text-muted-foreground' />
                                <div>
                                    <div className='font-medium'>{t('storage.local')}</div>
                                    <div className='text-sm text-muted-foreground'>
                                        {t('migration.treesCount', { count: preview.localTrees })}
                                    </div>
                                </div>
                            </div>
                            <div className='flex items-center p-3 border rounded-lg'>
                                <CloudIcon size={20} className='mr-2 text-muted-foreground' />
                                <div>
                                    <div className='font-medium'>{t('storage.cloud')}</div>
                                    <div className='text-sm text-muted-foreground'>
                                        {t('migration.treesCount', { count: preview.cloudTrees })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conflicts Warning */}
                        {preview.conflicts.length > 0 && (
                            <Alert>
                                <AlertTriangleIcon size={16} />
                                <AlertDescription>
                                    <div className='font-medium mb-1'>{t('migration.conflicts.title')}</div>
                                    <div className='text-sm'>{t('migration.conflicts.description')}</div>
                                    <div className='mt-2 space-x-1'>
                                        {preview.conflicts.map((name) => (
                                            <Badge key={name} variant='outline'>
                                                {name}
                                            </Badge>
                                        ))}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* No Trees Warning */}
                        {preview.localTrees === 0 && (
                            <Alert>
                                <AlertTriangleIcon size={16} />
                                <AlertDescription>
                                    {t('migration.noLocalTrees')}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Backup Recommendation */}
                        <Alert>
                            <DownloadIcon size={16} />
                            <AlertDescription>
                                <div className='font-medium mb-1'>{t('migration.backup.title')}</div>
                                <div className='text-sm'>{t('migration.backup.description')}</div>
                            </AlertDescription>
                        </Alert>
                    </>
                ) : null}
            </div>

            <DialogFooter className='gap-2'>
                <Button variant='outline' onClick={handleBackup} disabled={isLoading || !preview || preview.localTrees === 0}>
                    <DownloadIcon size={16} className='mr-2' />
                    {t('migration.backup.button')}
                </Button>
                <Button variant='outline' onClick={handleClose}>
                    {t('common.cancel')}
                </Button>
                <Button 
                    onClick={handleMigration} 
                    disabled={isLoading || !preview || preview.localTrees === 0}
                >
                    {t('migration.migrate')}
                </Button>
            </DialogFooter>
        </>
    );

    const renderMigrating = () => (
        <>
            <DialogHeader>
                <DialogTitle className='flex items-center gap-2'>
                    <RefreshCwIcon size={20} className='animate-spin' />
                    {t('migration.migrating')}
                </DialogTitle>
                <DialogDescription>
                    {t('migration.migratingDescription')}
                </DialogDescription>
            </DialogHeader>

            <div className='py-8 flex items-center justify-center'>
                <RefreshCwIcon size={32} className='animate-spin text-muted-foreground' />
            </div>
        </>
    );

    const renderCompleted = () => (
        <>
            <DialogHeader>
                <DialogTitle className='flex items-center gap-2'>
                    {migrationResult?.success ? (
                        <CheckCircleIcon size={20} className='text-green-500' />
                    ) : (
                        <AlertTriangleIcon size={20} className='text-yellow-500' />
                    )}
                    {t('migration.completed')}
                </DialogTitle>
                <DialogDescription>
                    {migrationResult?.success 
                        ? t('migration.completedDescription') 
                        : t('migration.completedWithErrors')
                    }
                </DialogDescription>
            </DialogHeader>

            <div className='py-4 space-y-4'>
                {migrationResult && (
                    <>
                        <div className='p-3 border rounded-lg'>
                            <div className='font-medium mb-1'>
                                {t('migration.results.migrated', { count: migrationResult.migratedCount })}
                            </div>
                            {migrationResult.errors.length > 0 && (
                                <div className='text-sm text-muted-foreground'>
                                    {t('migration.results.errors', { count: migrationResult.errors.length })}
                                </div>
                            )}
                        </div>

                        {migrationResult.errors.length > 0 && (
                            <div className='space-y-2'>
                                <div className='font-medium text-sm'>{t('migration.errors.list')}:</div>
                                <div className='max-h-32 overflow-y-auto space-y-1'>
                                    {migrationResult.errors.map((error, index) => (
                                        <div key={index} className='text-sm text-muted-foreground p-2 bg-muted rounded'>
                                            {error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <DialogFooter>
                <Button onClick={handleClose}>
                    {t('common.close')}
                </Button>
            </DialogFooter>
        </>
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className='sm:max-w-md'>
                {step === 'preview' && renderPreview()}
                {step === 'migrating' && renderMigrating()}
                {step === 'completed' && renderCompleted()}
            </DialogContent>
        </Dialog>
    );
}