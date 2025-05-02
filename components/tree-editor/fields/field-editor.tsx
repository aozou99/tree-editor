'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash } from 'lucide-react';
import { CustomField, FieldType } from '../types';
import { YouTubeEmbed } from '../media/youtube-embed';
import { ImageUpload } from '../media/image-upload';
import { AudioUpload } from '../media/audio-upload';
import { useI18n } from '@/utils/i18n/i18n-context';

interface FieldEditorProps {
    field: CustomField;
    updateField: (id: string, key: keyof CustomField, value: string) => void;
    updateFieldType?: (id: string, type: FieldType) => void;
    removeField?: (id: string) => void;
    disabled?: boolean;
    validationError?: string;
    readOnly?: boolean;
    readOnlyFieldName?: boolean; // フィールド名のみ編集不可にするプロパティを追加
}

/**
 * カスタムフィールド編集用の共通コンポーネント
 * モーダル間での重複コードを削減するために使用
 */
export function FieldEditor({
    field,
    updateField,
    updateFieldType,
    removeField,
    disabled = false,
    validationError,
    readOnly = false,
    readOnlyFieldName = false, // デフォルトは編集可能
}: FieldEditorProps) {
    const { t } = useI18n();

    // フィールドタイプに応じたカラーラベルを生成
    const getTypeLabel = () => {
        switch (field.type) {
            case 'text':
                return (
                    <span className='ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded text-[10px]'>
                        Text
                    </span>
                );
            case 'textarea':
                return (
                    <span className='ml-2 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded text-[10px]'>
                        Text Area
                    </span>
                );
            case 'link':
                return (
                    <span className='ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded text-[10px]'>
                        URL
                    </span>
                );
            case 'youtube':
                return (
                    <span className='ml-2 px-1.5 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded text-[10px]'>
                        YouTube
                    </span>
                );
            case 'image':
                return (
                    <span className='ml-2 px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded text-[10px]'>
                        Image
                    </span>
                );
            case 'audio':
                return (
                    <span className='ml-2 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 rounded text-[10px]'>
                        Audio
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className='space-y-2 p-3 border rounded-md bg-background'>
            <div className='flex items-center justify-between gap-2 mb-2'>
                <div className='flex-1'>
                    <div className='flex items-center mb-1'>
                        <span className='text-xs font-medium text-muted-foreground'>
                            {t('dialogs.nodeType.fieldNameLabel')}
                        </span>
                        {getTypeLabel()}
                    </div>
                    <Input
                        id={`field-name-${field.id}`}
                        value={field.name}
                        onChange={(e) => updateField(field.id, 'name', e.target.value)}
                        placeholder={t('dialogs.nodeType.fieldNamePlaceholder')}
                        disabled={disabled || readOnly || readOnlyFieldName}
                    />
                </div>

                {updateFieldType && (
                    <div>
                        <span className='text-xs font-medium text-muted-foreground mb-1 block'>
                            {t('dialogs.nodeType.fieldTypeLabel')}
                        </span>
                        <Select
                            value={field.type}
                            onValueChange={(value) => updateFieldType(field.id, value as FieldType)}
                            disabled={disabled || readOnly}
                        >
                            <SelectTrigger id={`field-type-${field.id}`} className='w-[120px]'>
                                <SelectValue placeholder={t('dialogs.nodeType.fieldTypeSelect')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='text'>{t('dialogs.nodeType.fieldTypes.text')}</SelectItem>
                                <SelectItem value='textarea'>{t('dialogs.nodeType.fieldTypes.textarea')}</SelectItem>
                                <SelectItem value='link'>{t('dialogs.nodeType.fieldTypes.link')}</SelectItem>
                                <SelectItem value='youtube'>{t('dialogs.nodeType.fieldTypes.youtube')}</SelectItem>
                                <SelectItem value='image'>{t('dialogs.nodeType.fieldTypes.image')}</SelectItem>
                                <SelectItem value='audio'>{t('dialogs.nodeType.fieldTypes.audio')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* 削除ボタン（オプション） */}
                {removeField && !readOnly && (
                    <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => removeField(field.id)}
                        disabled={disabled}
                        className='h-9 w-9 mt-6'
                    >
                        <Trash size={16} />
                    </Button>
                )}
            </div>

            {/* フィールドの種類に応じた入力コンポーネント */}
            <div className='mt-3'>
                <span className='text-xs font-medium text-muted-foreground mb-1 block'>
                    {t('dialogs.nodeType.fieldValueLabel')}
                </span>
                {field.type === 'textarea' ? (
                    <Textarea
                        id={`field-value-${field.id}`}
                        value={field.value}
                        onChange={(e) => updateField(field.id, 'value', e.target.value)}
                        placeholder={t('dialogs.node.detail.valuePlaceholder')}
                        className='min-h-[80px] w-full'
                        disabled={readOnly}
                    />
                ) : field.type === 'link' ? (
                    <>
                        <Input
                            id={`field-value-${field.id}`}
                            value={field.value}
                            onChange={(e) => updateField(field.id, 'value', e.target.value)}
                            placeholder='https://example.com'
                            className={`w-full ${validationError ? 'border-red-500' : ''}`}
                            disabled={readOnly}
                        />
                        {validationError && <p className='text-red-500 text-xs mt-1'>{validationError}</p>}
                    </>
                ) : field.type === 'youtube' ? (
                    <>
                        <Input
                            id={`field-value-${field.id}`}
                            value={field.value}
                            onChange={(e) => updateField(field.id, 'value', e.target.value)}
                            placeholder='https://www.youtube.com/watch?v=...'
                            className={`w-full ${validationError ? 'border-red-500' : ''}`}
                            disabled={readOnly}
                        />
                        {field.value && (
                            <div className='mt-2'>
                                <YouTubeEmbed url={field.value} />
                            </div>
                        )}
                        {validationError && <p className='text-red-500 text-xs mt-1'>{validationError}</p>}
                    </>
                ) : field.type === 'image' ? (
                    <ImageUpload
                        value={field.value}
                        onChange={(value) => updateField(field.id, 'value', value)}
                        disabled={readOnly}
                    />
                ) : field.type === 'audio' ? (
                    <AudioUpload
                        value={field.value}
                        onChange={(value) => updateField(field.id, 'value', value)}
                        disabled={readOnly}
                    />
                ) : (
                    <Input
                        id={`field-value-${field.id}`}
                        value={field.value}
                        onChange={(e) => updateField(field.id, 'value', e.target.value)}
                        placeholder={t('dialogs.node.detail.valuePlaceholder')}
                        className='w-full'
                        disabled={readOnly}
                    />
                )}
            </div>
        </div>
    );
}
