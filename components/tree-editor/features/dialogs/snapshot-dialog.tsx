import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/utils/i18n/i18n-context';
import { Save, GitCommit } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type SnapshotDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateSnapshot: (title: string, description?: string) => void;
};

export function SnapshotDialog({ 
    open, 
    onOpenChange, 
    onCreateSnapshot
}: SnapshotDialogProps) {
    const { t } = useI18n();
    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');

    const handleCreate = () => {
        if (!title.trim()) return;
        
        onCreateSnapshot(title.trim(), description.trim() || undefined);
        onOpenChange(false);
        setTitle('');
        setDescription('');
    };

    const handleCancel = () => {
        onOpenChange(false);
        setTitle('');
        setDescription('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <GitCommit className="h-5 w-5" />
                        {t('dialogs.snapshot.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('dialogs.snapshot.description')}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="snapshot-title">
                            {t('dialogs.snapshot.titleLabel')} *
                        </Label>
                        <Input
                            id="snapshot-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('dialogs.snapshot.titlePlaceholder')}
                            className="w-full"
                            autoFocus
                            maxLength={100}
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="snapshot-description">
                            {t('dialogs.snapshot.descriptionLabel')}
                        </Label>
                        <Textarea
                            id="snapshot-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t('dialogs.snapshot.descriptionPlaceholder')}
                            className="w-full min-h-[80px]"
                            maxLength={500}
                        />
                        <div className="text-xs text-muted-foreground text-right">
                            {description.length}/500
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant='outline' onClick={handleCancel}>
                        {t('common.cancel')}
                    </Button>
                    <Button 
                        onClick={handleCreate} 
                        disabled={!title.trim()}
                        className="gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {t('dialogs.snapshot.create')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}