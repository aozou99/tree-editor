'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/utils/i18n/i18n-context';

interface UrlInputDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUrlSubmit: (url: string) => void;
    currentUrl?: string;
}

export function UrlInputDialog({ open, onOpenChange, onUrlSubmit, currentUrl }: UrlInputDialogProps) {
    const [url, setUrl] = useState(currentUrl || '');
    const { t } = useI18n();

    const handleSubmit = () => {
        if (url.trim()) {
            onUrlSubmit(url.trim());
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>{t('dialogs.url.title')}</DialogTitle>
                </DialogHeader>
                <div className='py-4'>
                    <Label htmlFor='icon-url' className='text-sm font-semibold mb-1 block'>
                        {t('dialogs.url.imageUrl')}
                    </Label>
                    <div className='flex items-center gap-2'>
                        <Input
                            id='icon-url'
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder={t('dialogs.url.placeholder')}
                            className='flex-1'
                            autoFocus
                        />
                    </div>
                    {url && (
                        <div className='mt-4'>
                            <Label className='text-sm font-semibold mb-1 block'>{t('dialogs.url.preview')}</Label>
                            <div className='border rounded-md p-4 flex justify-center'>
                                {url.startsWith('http') ? (
                                    <img
                                        src={url || '/placeholder.svg'}
                                        alt={t('dialogs.node.detail.iconAlt')}
                                        className='max-h-20 object-contain'
                                        onError={(e) => {
                                            e.currentTarget.src = '/broken-image-icon.png';
                                        }}
                                    />
                                ) : (
                                    <div className='text-muted-foreground text-sm'>
                                        {t('dialogs.url.enterValidUrl')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant='outline' onClick={() => onOpenChange(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSubmit} disabled={!url.trim() || !url.startsWith('http')}>
                        {t('common.set')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
