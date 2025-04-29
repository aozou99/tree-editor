'use client';

import type React from 'react';

import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit, Save, Trash, Link, Upload } from 'lucide-react';
import { EmojiPicker } from './emoji-picker';
import { UrlInputDialog } from './url-input-dialog';
import { NodeType, CustomFieldDefinition } from '@/components/tree-editor/types';
import { isBase64Image } from '@/components/tree-editor/utils/image-utils';

interface NodeTypeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nodeTypes: NodeType[];
    onSaveNodeTypes: (nodeTypes: NodeType[]) => void;
    currentNodeType: NodeType | null;
    onSelectNodeType: (nodeType: NodeType | null) => void;
}

export function NodeTypeModal({
    open,
    onOpenChange,
    nodeTypes,
    onSaveNodeTypes,
    currentNodeType,
    onSelectNodeType,
}: NodeTypeModalProps) {
    const [editMode, setEditMode] = useState<'view' | 'edit' | 'new'>('view');
    const [editingNodeType, setEditingNodeType] = useState<NodeType | null>(null);
    const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            // 既存のノードタイプを更新する場合、フィールド定義のIDを保持する
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

                onSaveNodeTypes(nodeTypes.map((type) => (type.id === updatedType.id ? updatedType : type)));
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

    // ノードタイプの選択
    const handleSelectType = (type: NodeType) => {
        onSelectNodeType(type);
        onOpenChange(false);
    };

    // アイコンの更新（絵文字）
    const handleUpdateIcon = (emoji: string) => {
        if (editingNodeType) {
            setEditingNodeType({
                ...editingNodeType,
                icon: emoji,
            });
        }
    };

    // アイコンの更新（URL）
    const handleUpdateIconUrl = (url: string) => {
        if (editingNodeType) {
            setEditingNodeType({
                ...editingNodeType,
                icon: url,
            });
        }
    };

    // ファイル選択ダイアログを開く
    const handleOpenFileSelector = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
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
        if (!file || !editingNodeType) return;

        try {
            // ファイルサイズチェック (2MB以下)
            if (file.size > 2 * 1024 * 1024) {
                alert('ファイルサイズは2MB以下にしてください');
                return;
            }

            // 画像ファイルかチェック
            if (!file.type.startsWith('image/')) {
                alert('画像ファイルを選択してください');
                return;
            }

            const base64 = await convertFileToBase64(file);
            setEditingNodeType({
                ...editingNodeType,
                icon: base64,
            });
        } catch (error) {
            console.error('ファイルの読み込みに失敗しました:', error);
            alert('ファイルの読み込みに失敗しました');
        }

        // ファイル選択をリセット
        if (e.target) {
            e.target.value = '';
        }
    };

    // アイコンが画像URLかどうかを判定
    const isIconUrl = (icon?: string) => {
        return icon?.startsWith && icon?.startsWith('http');
    };

    // renderIconPreview 関数を修正して、アイコンが重複表示されないようにします
    const renderIconPreview = (icon?: string) => {
        if (!icon) return null;

        if (isIconUrl(icon)) {
            return (
                <img
                    src={icon || '/placeholder.svg'}
                    alt='アイコン'
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
                    alt='アイコン'
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
                    <DialogTitle>ノードタイプ管理</DialogTitle>
                </DialogHeader>

                <div className='py-4'>
                    {editMode === 'view' ? (
                        // ノードタイプ一覧の表示モード
                        <>
                            <div className='mb-4 flex justify-between items-center'>
                                <Label className='text-lg font-semibold'>ノードタイプ一覧</Label>
                                <Button variant='outline' size='sm' onClick={handleAddNewType}>
                                    <PlusCircle size={16} className='mr-2' />
                                    新しいタイプを追加
                                </Button>
                            </div>

                            {nodeTypes.length === 0 ? (
                                <div className='text-center py-8 text-muted-foreground'>
                                    ノードタイプがありません。新しいタイプを追加してください。
                                </div>
                            ) : (
                                <div className='space-y-3'>
                                    {nodeTypes.map((type) => (
                                        <Card key={type.id} className='overflow-hidden'>
                                            <CardContent className='p-3'>
                                                <div className='flex justify-between items-center'>
                                                    <div
                                                        className='flex items-center space-x-2 cursor-pointer'
                                                        onClick={() => handleSelectType(type)}
                                                    >
                                                        <div className='flex items-center justify-center w-8 h-8'>
                                                            {renderIconPreview(type.icon)}
                                                        </div>
                                                        <span className='font-medium'>{type.name}</span>
                                                        <span className='text-xs text-muted-foreground'>
                                                            ({type.fieldDefinitions.length} フィールド)
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
                                    タイプ名 <span className='text-red-500'>*</span>
                                </Label>
                                <Input
                                    id='node-type-name'
                                    value={editingNodeType?.name || ''}
                                    onChange={(e) =>
                                        setEditingNodeType((prev) => (prev ? { ...prev, name: e.target.value } : null))
                                    }
                                    placeholder='例: 社員、プロジェクト、タスクなど'
                                    className='w-full'
                                />
                            </div>

                            <div className='mb-6'>
                                <Label className='text-sm font-semibold mb-1 block'>アイコン</Label>
                                <div className='flex gap-2 items-center'>
                                    <div className='flex-1 border rounded-md p-2 flex items-center'>
                                        <div className='w-8 h-8 flex items-center justify-center'>
                                            {renderIconPreview(editingNodeType?.icon)}
                                        </div>
                                        {!editingNodeType?.icon && (
                                            <div className='text-sm text-muted-foreground ml-2'>
                                                アイコンが設定されていません
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant='outline'
                                        size='icon'
                                        className='h-10 w-10'
                                        onClick={() => setIsUrlDialogOpen(true)}
                                        title='画像URLを設定'
                                    >
                                        <Link size={18} />
                                    </Button>
                                    <Button
                                        variant='outline'
                                        size='icon'
                                        className='h-10 w-10'
                                        onClick={handleOpenFileSelector}
                                        title='画像ファイルをアップロード'
                                    >
                                        <Upload size={18} />
                                    </Button>
                                    <EmojiPicker
                                        onEmojiSelect={handleUpdateIcon}
                                        currentEmoji={editingNodeType?.icon}
                                    />
                                    <input
                                        type='file'
                                        ref={fileInputRef}
                                        className='hidden'
                                        accept='image/*'
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>

                            <div className='mb-4'>
                                <div className='flex justify-between items-center mb-2'>
                                    <Label className='text-sm font-semibold'>フィールド定義</Label>
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        onClick={handleAddField}
                                        className='flex items-center text-xs h-7'
                                    >
                                        <PlusCircle size={14} className='mr-1' />
                                        フィールド追加
                                    </Button>
                                </div>

                                {editingNodeType?.fieldDefinitions.length === 0 ? (
                                    <div className='text-center py-4 text-sm text-muted-foreground'>
                                        フィールドがありません。追加してください。
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
                                                            フィールド名
                                                        </Label>
                                                        <Input
                                                            id={`field-name-${field.id}`}
                                                            value={field.name}
                                                            onChange={(e) =>
                                                                handleUpdateField(field.id, 'name', e.target.value)
                                                            }
                                                            placeholder='例: 役職、部署など'
                                                            className='h-8 text-sm'
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label
                                                            htmlFor={`field-type-${field.id}`}
                                                            className='text-xs block mb-1'
                                                        >
                                                            タイプ
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
                                                                <SelectValue placeholder='タイプを選択' />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value='text'>一行テキスト</SelectItem>
                                                                <SelectItem value='textarea'>複数行テキスト</SelectItem>
                                                                <SelectItem value='link'>リンク</SelectItem>
                                                                <SelectItem value='youtube'>YouTube</SelectItem>
                                                                <SelectItem value='image'>画像</SelectItem>
                                                                <SelectItem value='audio'>音声</SelectItem>
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
                                                        必須
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
                            閉じる
                        </Button>
                    ) : (
                        <div className='flex gap-2 w-full justify-between'>
                            <Button type='button' variant='ghost' onClick={handleCancelEdit}>
                                キャンセル
                            </Button>
                            <Button type='button' onClick={handleSaveType}>
                                <Save size={16} className='mr-2' />
                                保存
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>

            {/* URL入力ダイアログ */}
            <UrlInputDialog
                open={isUrlDialogOpen}
                onOpenChange={setIsUrlDialogOpen}
                onUrlSubmit={handleUpdateIconUrl}
                currentUrl={isIconUrl(editingNodeType?.icon) ? editingNodeType?.icon : ''}
            />
        </Dialog>
    );
}
