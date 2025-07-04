'use client';

import type React from 'react';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Save, Trash } from 'lucide-react';
import { NodeType, CustomFieldDefinition } from '@/components/tree-editor/types';
import { isBase64Image } from '@/components/tree-editor/utils/image-utils';
import { useI18n } from '@/utils/i18n/i18n-context';
import { IconEditor } from '../media/icon-editor';

interface FieldChanges {
    hasChanges: boolean;
    added: CustomFieldDefinition[];
    removed: string[]; // 削除されたフィールドのID
    renamed: { id: string; oldName: string; newName: string }[];
    typeChanged: { id: string; oldType: string; newType: string }[];
    requirementChanged: { id: string; required: boolean }[];
}

// フィールド変更情報を含む型定義
interface FieldChangeInfo {
    nodeTypeId: string;
    fieldChanges: FieldChanges;
}

interface NodeTypeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nodeTypes: NodeType[];
    onSaveNodeTypes: (nodeTypes: NodeType[], fieldChangeInfo?: FieldChangeInfo) => void;
}

export function NodeTypeModal({ open, onOpenChange, nodeTypes, onSaveNodeTypes }: NodeTypeModalProps) {
    const [editMode, setEditMode] = useState<'view' | 'edit' | 'new'>('view');
    const [editingNodeType, setEditingNodeType] = useState<NodeType | null>(null);
    const { t } = useI18n();

    // 新しいノードタイプの作成を開始
    const handleAddNewType = () => {
        setEditingNodeType({
            id: uuidv4(),
            name: '',
            icon: '📄',
            fieldDefinitions: [],
        });
        setEditMode('new');
    };

    // 既存ノードタイプの編集を開始
    const handleEditType = (type: NodeType) => {
        setEditingNodeType({ ...type });
        setEditMode('edit');
    };

    // ノードタイプの削除
    const handleDeleteType = (typeId: string) => {
        onSaveNodeTypes(nodeTypes.filter((type) => type.id !== typeId));
    };

    // 新規フィールド定義の追加
    const handleAddField = () => {
        if (!editingNodeType) return;

        const newField: CustomFieldDefinition = {
            id: uuidv4(),
            name: '',
            type: 'text',
            required: false,
        };

        setEditingNodeType({
            ...editingNodeType,
            fieldDefinitions: [...editingNodeType.fieldDefinitions, newField],
        });
    };

    // フィールド定義の更新
    const handleUpdateField = (fieldId: string, key: keyof CustomFieldDefinition, value: string | boolean) => {
        if (!editingNodeType) return;

        setEditingNodeType({
            ...editingNodeType,
            fieldDefinitions: editingNodeType.fieldDefinitions.map((field) => {
                if (field.id === fieldId) {
                    return { ...field, [key]: value };
                }
                return field;
            }),
        });
    };

    // フィールド定義の削除
    const handleRemoveField = (fieldId: string) => {
        if (!editingNodeType) return;

        setEditingNodeType({
            ...editingNodeType,
            fieldDefinitions: editingNodeType.fieldDefinitions.filter((field) => field.id !== fieldId),
        });
    };

    // 変更の保存
    const handleSaveType = () => {
        if (!editingNodeType || !editingNodeType.name.trim()) return;

        if (editMode === 'new') {
            onSaveNodeTypes([...nodeTypes, editingNodeType]);
        } else {
            // 既存のノードタイプを更新する場合
            const originalType = nodeTypes.find((type) => type.id === editingNodeType.id);

            if (originalType) {
                // 編集中のノードタイプのフィールド定義を更新
                const updatedFieldDefinitions = editingNodeType.fieldDefinitions.map((newField) => {
                    // 既存のフィールド定義から同じ名前または同じ定義IDのものがあれば値を引き継ぐ
                    const originalField = originalType.fieldDefinitions.find(
                        (field) => field.id === newField.id || field.name === newField.name,
                    );

                    if (originalField && originalField.id === newField.id) {
                        // IDが同じ場合はそのまま使用
                        return newField;
                    } else if (originalField) {
                        // 名前が同じ場合は元のIDを使用
                        return { ...newField, id: originalField.id };
                    }

                    // 新しいフィールドの場合はそのまま
                    return newField;
                });

                const updatedType = {
                    ...editingNodeType,
                    fieldDefinitions: updatedFieldDefinitions,
                };

                // 更新された全てのノードタイプを保存
                const updatedNodeTypes = nodeTypes.map((type) => (type.id === updatedType.id ? updatedType : type));

                // 更新前と更新後のフィールド定義を比較
                const fieldChanges = compareFieldDefinitions(
                    originalType.fieldDefinitions,
                    updatedType.fieldDefinitions,
                );

                if (fieldChanges.hasChanges) {
                    // フィールド変更があった場合、親コンポーネントにフィールド更新情報を含めて送信
                    onSaveNodeTypes(updatedNodeTypes, {
                        nodeTypeId: updatedType.id,
                        fieldChanges: fieldChanges,
                    });
                } else {
                    // 変更がない場合はシンプルに更新
                    onSaveNodeTypes(updatedNodeTypes);
                }
            } else {
                // 元のタイプが見つからない場合はそのまま更新
                onSaveNodeTypes(nodeTypes.map((type) => (type.id === editingNodeType.id ? editingNodeType : type)));
            }
        }

        setEditMode('view');
        setEditingNodeType(null);
    };

    // 編集のキャンセル
    const handleCancelEdit = () => {
        setEditMode('view');
        setEditingNodeType(null);
    };

    // アイコンが画像URLかどうかを判定
    const isIconUrl = (icon?: string) => {
        return icon?.startsWith && icon?.startsWith('http');
    };

    const renderIconPreview = (icon?: string) => {
        if (!icon) return null;

        if (isIconUrl(icon)) {
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
        } else if (isBase64Image(icon)) {
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md md:max-w-lg max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle>{t('dialogs.nodeType.title')}</DialogTitle>
                </DialogHeader>

                <div className='py-4'>
                    {editMode === 'view' ? (
                        // ノードタイプ一覧の表示モード
                        <>
                            <div className='mb-4 flex justify-between items-center'>
                                <Label className='text-lg font-semibold'>{t('dialogs.nodeType.typeList')}</Label>
                                <Button variant='outline' size='sm' onClick={handleAddNewType}>
                                    <PlusCircle size={16} className='mr-2' />
                                    {t('dialogs.nodeType.addNewType')}
                                </Button>
                            </div>

                            {nodeTypes.length === 0 ? (
                                <div className='text-center py-8 text-muted-foreground'>
                                    {t('dialogs.nodeType.noTypes')}
                                </div>
                            ) : (
                                <div className='space-y-3'>
                                    {nodeTypes.map((type) => (
                                        <Card
                                            key={type.id}
                                            className='overflow-hidden'
                                            onClick={() => handleEditType(type)}
                                        >
                                            <CardContent className='p-3'>
                                                <div className='flex justify-between items-center'>
                                                    <div className='flex items-center space-x-2 cursor-pointer'>
                                                        <div className='flex items-center justify-center w-8 h-8'>
                                                            {renderIconPreview(type.icon)}
                                                        </div>
                                                        <span className='font-medium'>{type.name}</span>
                                                        <span className='text-xs text-muted-foreground'>
                                                            (
                                                            {t('dialogs.nodeType.fieldsCount', {
                                                                count: type.fieldDefinitions.length,
                                                            })}
                                                            )
                                                        </span>
                                                    </div>
                                                    <div className='flex space-x-1'>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            className='h-8 w-8'
                                                            onClick={() => handleEditType(type)}
                                                        >
                                                            <Edit size={16} />
                                                        </Button>
                                                        <Button
                                                            variant='ghost'
                                                            size='icon'
                                                            className='h-8 w-8 text-destructive'
                                                            onClick={() => handleDeleteType(type.id)}
                                                        >
                                                            <Trash size={16} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        // 編集モード
                        <>
                            <div className='mb-4'>
                                <Label htmlFor='node-type-name' className='text-sm font-semibold mb-1 block'>
                                    {t('dialogs.nodeType.typeNameRequired')}
                                </Label>
                                <Input
                                    id='node-type-name'
                                    value={editingNodeType?.name || ''}
                                    onChange={(e) =>
                                        setEditingNodeType((prev) => (prev ? { ...prev, name: e.target.value } : null))
                                    }
                                    placeholder={t('dialogs.nodeType.typeNamePlaceholder')}
                                    className='w-full'
                                />
                            </div>

                            <div className='mb-6'>
                                <Label className='text-sm font-semibold mb-1 block'>{t('dialogs.nodeType.icon')}</Label>
                                <IconEditor
                                    currentIcon={editingNodeType?.icon}
                                    onChange={(icon) => {
                                        if (editingNodeType) {
                                            setEditingNodeType({
                                                ...editingNodeType,
                                                icon: icon,
                                            });
                                        }
                                    }}
                                    onClear={() => {
                                        if (editingNodeType) {
                                            setEditingNodeType({
                                                ...editingNodeType,
                                                icon: '📄', // デフォルトアイコンを使用
                                            });
                                        }
                                    }}
                                    allowUpload={true}
                                />
                            </div>

                            <div className='mb-4'>
                                <div className='flex justify-between items-center mb-2'>
                                    <Label className='text-sm font-semibold'>{t('dialogs.nodeType.fields')}</Label>
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        onClick={handleAddField}
                                        className='flex items-center text-xs h-7'
                                    >
                                        <PlusCircle size={14} className='mr-1' />
                                        {t('dialogs.nodeType.addField')}
                                    </Button>
                                </div>

                                {editingNodeType?.fieldDefinitions.length === 0 ? (
                                    <div className='text-center py-4 text-sm text-muted-foreground'>
                                        {t('dialogs.nodeType.noFields')}
                                    </div>
                                ) : (
                                    <div className='space-y-3'>
                                        {editingNodeType?.fieldDefinitions.map((field) => (
                                            <div
                                                key={field.id}
                                                className='flex items-start gap-2 border rounded-md p-2'
                                            >
                                                <div className='grid grid-cols-2 gap-2 flex-1'>
                                                    <div>
                                                        <Label
                                                            htmlFor={`field-name-${field.id}`}
                                                            className='text-xs block mb-1'
                                                        >
                                                            {t('dialogs.nodeType.fieldName')}
                                                        </Label>
                                                        <Input
                                                            id={`field-name-${field.id}`}
                                                            value={field.name}
                                                            onChange={(e) =>
                                                                handleUpdateField(field.id, 'name', e.target.value)
                                                            }
                                                            placeholder={t('dialogs.nodeType.fieldNamePlaceholder')}
                                                            className='h-8 text-sm'
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label
                                                            htmlFor={`field-type-${field.id}`}
                                                            className='text-xs block mb-1'
                                                        >
                                                            {t('dialogs.nodeType.fieldType')}
                                                        </Label>
                                                        <Select
                                                            value={field.type}
                                                            onValueChange={(value) =>
                                                                handleUpdateField(
                                                                    field.id,
                                                                    'type',
                                                                    value as
                                                                        | 'text'
                                                                        | 'textarea'
                                                                        | 'link'
                                                                        | 'youtube'
                                                                        | 'image'
                                                                        | 'audio',
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger className='h-8 text-sm'>
                                                                <SelectValue
                                                                    placeholder={t('dialogs.nodeType.fieldTypeSelect')}
                                                                />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value='text'>
                                                                    {t('dialogs.nodeType.fieldTypes.text')}
                                                                </SelectItem>
                                                                <SelectItem value='textarea'>
                                                                    {t('dialogs.nodeType.fieldTypes.textarea')}
                                                                </SelectItem>
                                                                <SelectItem value='link'>
                                                                    {t('dialogs.nodeType.fieldTypes.link')}
                                                                </SelectItem>
                                                                <SelectItem value='youtube'>
                                                                    {t('dialogs.nodeType.fieldTypes.youtube')}
                                                                </SelectItem>
                                                                <SelectItem value='image'>
                                                                    {t('dialogs.nodeType.fieldTypes.image')}
                                                                </SelectItem>
                                                                <SelectItem value='audio'>
                                                                    {t('dialogs.nodeType.fieldTypes.audio')}
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className='pt-5 flex items-center gap-1'>
                                                    <label className='text-xs flex items-center cursor-pointer'>
                                                        <input
                                                            type='checkbox'
                                                            checked={field.required}
                                                            onChange={(e) =>
                                                                handleUpdateField(
                                                                    field.id,
                                                                    'required',
                                                                    e.target.checked,
                                                                )
                                                            }
                                                            className='mr-1 h-3 w-3'
                                                        />
                                                        {t('dialogs.nodeType.required')}
                                                    </label>
                                                    <Button
                                                        variant='ghost'
                                                        size='icon'
                                                        onClick={() => handleRemoveField(field.id)}
                                                        className='h-7 w-7 text-destructive'
                                                    >
                                                        <Trash size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className='sm:justify-between'>
                    {editMode === 'view' ? (
                        <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                            {t('common.close')}
                        </Button>
                    ) : (
                        <div className='flex gap-2 w-full justify-between'>
                            <Button type='button' variant='ghost' onClick={handleCancelEdit}>
                                {t('common.cancel')}
                            </Button>
                            <Button type='button' onClick={handleSaveType}>
                                <Save size={16} className='mr-2' />
                                {t('common.save')}
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>

        </Dialog>
    );
}

// フィールド定義の変更を比較する関数
const compareFieldDefinitions = (originalFields: CustomFieldDefinition[], updatedFields: CustomFieldDefinition[]) => {
    const result = {
        hasChanges: false,
        added: [] as CustomFieldDefinition[],
        removed: [] as string[], // 削除されたフィールドのID
        renamed: [] as { id: string; oldName: string; newName: string }[],
        typeChanged: [] as { id: string; oldType: string; newType: string }[],
        requirementChanged: [] as { id: string; required: boolean }[],
    };

    // 削除されたフィールドを検出
    originalFields.forEach((origField) => {
        const stillExists = updatedFields.some((newField) => newField.id === origField.id);
        if (!stillExists) {
            result.hasChanges = true;
            result.removed.push(origField.id);
        }
    });

    // 追加または変更されたフィールドを検出
    updatedFields.forEach((newField) => {
        const origField = originalFields.find((f) => f.id === newField.id);

        if (!origField) {
            // 新しく追加されたフィールド
            result.hasChanges = true;
            result.added.push(newField);
            return;
        }

        // 名前の変更をチェック
        if (origField.name !== newField.name) {
            result.hasChanges = true;
            result.renamed.push({
                id: newField.id,
                oldName: origField.name,
                newName: newField.name,
            });
        }

        // タイプの変更をチェック
        if (origField.type !== newField.type) {
            result.hasChanges = true;
            result.typeChanged.push({
                id: newField.id,
                oldType: origField.type,
                newType: newField.type,
            });
        }

        // 必須フラグの変更をチェック
        if (origField.required !== newField.required) {
            result.hasChanges = true;
            result.requirementChanged.push({
                id: newField.id,
                required: newField.required,
            });
        }
    });

    return result;
};
