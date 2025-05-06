import { Button } from '@/components/ui/button';
import { useI18n } from '@/utils/i18n/i18n-context';
import { TreeNode, NodeType } from '@/components/tree-editor/types';
import { getSampleById, allSamples, SampleType } from '@/components/tree-editor/features/sample-selector/sample-data';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type ImportDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    importData: string;
    setImportData: (data: string) => void;
    importError: string | null;
    setImportError: (error: string | null) => void;
    executeImport: (data: string) => void;
};

export function ImportDialog({
    open,
    onOpenChange,
    importData,
    setImportData,
    importError,
    setImportError,
    executeImport,
}: ImportDialogProps) {
    const { t } = useI18n();

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('dialogs.import.title')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('dialogs.import.description')}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className='grid gap-4 py-4'>
                    <div className='grid grid-cols-4 items-center gap-4'>
                        <Label htmlFor='importData' className='text-right'>
                            {t('dialogs.import.jsonData')}
                        </Label>
                        <Textarea
                            id='importData'
                            className='col-span-3'
                            value={importData}
                            onChange={(e) => {
                                setImportData(e.target.value);
                                setImportError(null);
                            }}
                            placeholder={t('dialogs.import.placeholder')}
                        />
                    </div>
                    {importError && <p className='text-red-500 text-sm'>{importError}</p>}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setImportData('')}>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => executeImport(importData)}>
                        {t('common.import')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

type ResetDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentSampleId: SampleType;
    resetTree: (tree: TreeNode[], nodeTypes: NodeType[], title: string) => void;
};

export function ResetDialog({ open, onOpenChange, currentSampleId, resetTree }: ResetDialogProps) {
    const { t } = useI18n();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>{t('dialogs.reset.title')}</DialogTitle>
                    <DialogDescription>{t('dialogs.reset.description')}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant='destructive'
                        onClick={() => {
                            const sample = getSampleById(currentSampleId);
                            if (sample) {
                                resetTree(sample.tree, sample.nodeTypes, sample.treeTitle);
                                onOpenChange(false);
                            }
                        }}
                    >
                        {t('common.reset')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

type SampleSelectorDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentSampleId: SampleType;
    setCurrentSampleId: (id: SampleType) => void;
    handleSelectSample: (id: SampleType) => void;
};

export function SampleSelectorDialog({
    open,
    onOpenChange,
    currentSampleId,
    setCurrentSampleId,
    handleSelectSample,
}: SampleSelectorDialogProps) {
    const { t } = useI18n();

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>{t('header.sampleSelection')}</DialogTitle>
                    <DialogDescription>
                        {t('header.sampleSelection') + ' ' + t('dialogs.import.description')}
                    </DialogDescription>
                </DialogHeader>
                <div className='py-4'>
                    <RadioGroup
                        value={currentSampleId}
                        onValueChange={(value) => setCurrentSampleId(value as SampleType)}
                        className='space-y-3'
                    >
                        {allSamples.map((sample) => (
                            <div
                                key={sample.id}
                                className={`flex items-center space-x-2 rounded-md border p-3 ${
                                    currentSampleId === sample.id ? 'border-primary bg-primary/5' : ''
                                }`}
                            >
                                <RadioGroupItem value={sample.id} id={sample.id} />
                                <Label htmlFor={sample.id} className='flex-1 cursor-pointer'>
                                    <div className='font-medium'>{sample.name}</div>
                                    <div className='text-sm text-muted-foreground'>{sample.description}</div>
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        onClick={() => {
                            handleSelectSample(currentSampleId);
                            onOpenChange(false);
                        }}
                    >
                        {t('common.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
