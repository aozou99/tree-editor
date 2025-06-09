import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/utils/i18n/i18n-context';
import { TreeNode, NodeType } from '@/components/tree-editor/types';
import { formatDistanceToNow } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, RefreshCw, GitCommit, RotateCcw } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export interface TreeSnapshot {
    id: string;
    timestamp: Date;
    tree: TreeNode[];
    nodeTypes: NodeType[];
    treeTitle: string;
    title?: string; // Manual snapshot title
    description?: string;
    type: 'auto' | 'manual'; // Distinguish between auto and manual snapshots
}

type HistoryDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    snapshots: TreeSnapshot[];
    onRestore: (snapshot: TreeSnapshot) => void;
    currentTreeId: string | null;
};

export function HistoryDialog({ 
    open, 
    onOpenChange, 
    snapshots, 
    onRestore,
    currentTreeId 
}: HistoryDialogProps) {
    const { t, locale } = useI18n();
    const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
    
    // Sort snapshots by timestamp (newest first)
    const sortedSnapshots = [...snapshots].sort((a, b) => 
        b.timestamp.getTime() - a.timestamp.getTime()
    );

    // Auto-select the most recent snapshot when dialog opens
    useEffect(() => {
        if (open && sortedSnapshots.length > 0 && !selectedSnapshotId) {
            setSelectedSnapshotId(sortedSnapshots[0].id);
        }
    }, [open, sortedSnapshots, selectedSnapshotId]);

    const handleRestore = () => {
        const snapshot = snapshots.find(s => s.id === selectedSnapshotId);
        if (snapshot) {
            onRestore(snapshot);
            onOpenChange(false);
        }
    };

    const formatTime = (date: Date) => {
        return formatDistanceToNow(date, {
            addSuffix: true,
            locale: locale === 'ja' ? ja : enUS,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-2xl'>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {t('dialogs.history.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('dialogs.history.description')}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="h-[400px] overflow-y-auto pr-4">
                    {sortedSnapshots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <RefreshCw className="h-12 w-12 mb-4 opacity-50" />
                            <p>{t('dialogs.history.noSnapshots')}</p>
                        </div>
                    ) : (
                        <RadioGroup
                            value={selectedSnapshotId}
                            onValueChange={setSelectedSnapshotId}
                            className='space-y-3'
                        >
                            {sortedSnapshots.map((snapshot, index) => {
                                const isManual = snapshot.type === 'manual';
                                const displayTitle = isManual 
                                    ? snapshot.title || t('dialogs.history.manualSnapshot')
                                    : (index === 0 ? t('dialogs.history.latest') : `${t('dialogs.history.version')} ${sortedSnapshots.length - index}`);
                                
                                return (
                                    <div
                                        key={snapshot.id}
                                        className={`flex items-start space-x-3 rounded-md border p-4 transition-colors ${
                                            selectedSnapshotId === snapshot.id 
                                                ? 'border-primary bg-primary/5' 
                                                : 'hover:bg-muted/50'
                                        } ${
                                            isManual ? 'border-l-4 border-l-blue-500' : ''
                                        }`}
                                    >
                                        <RadioGroupItem value={snapshot.id} id={snapshot.id} className="mt-1" />
                                        <div className="flex-shrink-0 mt-1">
                                            {isManual ? (
                                                <GitCommit className="h-4 w-4 text-blue-500" />
                                            ) : (
                                                <RotateCcw className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <Label htmlFor={snapshot.id} className='flex-1 cursor-pointer'>
                                            <div className='flex items-center justify-between mb-1'>
                                                <div className={`font-medium ${
                                                    isManual ? 'text-blue-700' : ''
                                                }`}>
                                                    {displayTitle}
                                                    {isManual && (
                                                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                                            {t('dialogs.history.manual')}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className='text-sm text-muted-foreground'>
                                                    {formatTime(snapshot.timestamp)}
                                                </div>
                                            </div>
                                            <div className='text-sm text-muted-foreground'>
                                                {snapshot.description || (isManual ? '' : t('dialogs.history.autoSaved'))}
                                            </div>
                                            <div className='text-xs text-muted-foreground mt-2'>
                                                {t('dialogs.history.nodeCount', { count: snapshot.tree.length })} • 
                                                {t('dialogs.history.typeCount', { count: snapshot.nodeTypes.length })}
                                            </div>
                                        </Label>
                                    </div>
                                );
                            })}
                        </RadioGroup>
                    )}
                </div>

                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button 
                        onClick={handleRestore} 
                        disabled={!selectedSnapshotId || sortedSnapshots.length === 0}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        {t('dialogs.history.restore')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}