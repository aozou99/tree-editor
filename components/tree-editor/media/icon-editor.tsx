'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'lucide-react';
import { EmojiPicker } from './emoji-picker';
import { UrlInputDialog } from '../modals/url-input-dialog';
import { isImageUrl, isBase64Image } from '../utils/image-utils';
import { useI18n } from '@/utils/i18n/i18n-context';

interface IconEditorProps {
    currentIcon?: string;
    onChange: (icon: string) => void;
    onClear: () => void;
    allowUpload?: boolean;
    disabled?: boolean;
}

/**
 * アイコンを編集するための共通コンポーネント
 * モーダル間での重複コードを削減するために使用
 */
export function IconEditor({ currentIcon, onChange, onClear, allowUpload = false, disabled = false }: IconEditorProps) {
    const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
    const { t } = useI18n();

    // アイコンのプレビューを表示
    const renderIconPreview = (icon?: string) => {
        if (!icon) return null;

        if (isImageUrl(icon) || isBase64Image(icon)) {
            return (
                <img
                    src={icon || '/placeholder.svg'}
                    alt={t('dialogs.nodeType.icon')}
                    className='w-8 h-8 object-contain rounded-sm'
                    onError={(e) => {
                        e.currentTarget.src = '/exclamation-mark-in-nature.png';
                    }}
                />
            );
        }

        return <span className='text-2xl'>{icon}</span>;
    };

    // URLダイアログからURLを取得したときの処理
    const handleUpdateIconUrl = (url: string) => {
        onChange(url);
    };

    // 絵文字を選択したときの処理
    const handleUpdateIcon = (emoji: string) => {
        onChange(emoji);
    };

    return (
        <div className='flex gap-2 items-center'>
            <div className='flex-1 border rounded-md p-2 flex items-center'>
                <div className='w-8 h-8 flex items-center justify-center'>{renderIconPreview(currentIcon)}</div>
                {!currentIcon && (
                    <div className='text-sm text-muted-foreground ml-2'>{t('dialogs.node.detail.iconNotSet')}</div>
                )}
            </div>
            <Button
                variant='outline'
                size='icon'
                className='h-10 w-10'
                onClick={() => setIsUrlDialogOpen(true)}
                title={t('dialogs.nodeType.imageUrlTitle')}
                disabled={disabled}
            >
                <Link size={18} />
            </Button>
            <EmojiPicker onEmojiSelect={handleUpdateIcon} currentEmoji={currentIcon} disabled={disabled} />
            {currentIcon && (
                <Button
                    variant='outline'
                    size='sm'
                    onClick={onClear}
                    className='text-xs'
                    title={t('common.clear')}
                    disabled={disabled}
                >
                    {t('common.clear')}
                </Button>
            )}

            {/* URL入力ダイアログ */}
            <UrlInputDialog
                open={isUrlDialogOpen}
                onOpenChange={setIsUrlDialogOpen}
                onUrlSubmit={handleUpdateIconUrl}
                currentUrl={isImageUrl(currentIcon) ? currentIcon : ''}
            />
        </div>
    );
}
