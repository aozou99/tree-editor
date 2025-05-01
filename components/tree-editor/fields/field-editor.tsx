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
}: FieldEditorProps) {
    const { t } = useI18n();

    return (
        <div className='grid grid-cols-[1fr_auto_2fr_auto] gap-2 items-start'>
            <Input
                value={field.name}
                onChange={(e) => updateField(field.id, 'name', e.target.value)}
                placeholder={t('dialogs.nodeType.fieldNamePlaceholder')}
                disabled={disabled || readOnly}
            />

            {updateFieldType && (
                <Select
                    value={field.type}
                    onValueChange={(value) => updateFieldType(field.id, value as FieldType)}
                    disabled={disabled || readOnly}
                >
                    <SelectTrigger className='w-[120px]'>
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
            )}

            {/* フィールドの種類に応じた入力コンポーネント */}
            <div className='flex flex-col w-full'>
                {field.type === 'textarea' ? (
                    <Textarea
                        value={field.value}
                        onChange={(e) => updateField(field.id, 'value', e.target.value)}
                        placeholder={t('dialogs.node.detail.valuePlaceholder')}
                        className='min-h-[80px]'
                        disabled={readOnly}
                    />
                ) : field.type === 'link' ? (
                    <>
                        <Input
                            value={field.value}
                            onChange={(e) => updateField(field.id, 'value', e.target.value)}
                            placeholder='https://example.com'
                            className={validationError ? 'border-red-500' : ''}
                            disabled={readOnly}
                        />
                        {validationError && <p className='text-red-500 text-xs mt-1'>{validationError}</p>}
                    </>
                ) : field.type === 'youtube' ? (
                    <>
                        <Input
                            value={field.value}
                            onChange={(e) => updateField(field.id, 'value', e.target.value)}
                            placeholder='https://www.youtube.com/watch?v=...'
                            className={validationError ? 'border-red-500' : ''}
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
                        value={field.value}
                        onChange={(e) => updateField(field.id, 'value', e.target.value)}
                        placeholder={t('dialogs.node.detail.valuePlaceholder')}
                        disabled={readOnly}
                    />
                )}
            </div>

            {/* 削除ボタン（オプション） */}
            {removeField && !readOnly && (
                <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => removeField(field.id)}
                    disabled={disabled}
                    className='h-9 w-9'
                >
                    <Trash size={16} />
                </Button>
            )}
        </div>
    );
}
