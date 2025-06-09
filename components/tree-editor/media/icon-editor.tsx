'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Link, Upload } from 'lucide-react';
import { EmojiPicker } from './emoji/emoji-picker';
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
    const fileInputRef = useRef<HTMLInputElement>(null);
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

    // 画像ファイルをBase64に変換
    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };

    // ファイル選択時の処理
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            // ファイルサイズチェック (2MB以下)
            if (file.size > 2 * 1024 * 1024) {
                alert(t('dialogs.nodeType.errors.fileSizeLimit'));
                return;
            }

            // 画像ファイルかチェック
            if (!file.type.startsWith('image/')) {
                alert(t('dialogs.nodeType.errors.imageFileOnly'));
                return;
            }

            const base64 = await convertFileToBase64(file);
            onChange(base64);
        } catch (error) {
            console.error(t('debug.fileReadError'), error);
            alert(t('dialogs.nodeType.errors.fileReadError'));
        }

        // ファイル選択をリセット
        if (e.target) {
            e.target.value = '';
        }
    };

    // ファイル選択ダイアログを開く
    const openFileSelector = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
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
            {allowUpload && (
                <Button
                    variant='outline'
                    size='icon'
                    className='h-10 w-10'
                    onClick={openFileSelector}
                    title={t('dialogs.nodeType.uploadImageTitle')}
                    disabled={disabled}
                >
                    <Upload size={18} />
                </Button>
            )}
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

            {/* 非表示のファイルインプット */}
            {allowUpload && (
                <input
                    type='file'
                    ref={fileInputRef}
                    className='hidden'
                    accept='image/*'
                    onChange={handleFileChange}
                />
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
