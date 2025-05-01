'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UrlInputDialog } from './url-input-dialog';
import { NodeType, TreeNode, CustomField } from '@/components/tree-editor/types';
import { validateNodeForm } from '@/components/tree-editor/utils/validation-utils';
import { useI18n } from '@/utils/i18n/i18n-context';
import { IconEditor } from '../media/icon-editor';
import { FieldEditor } from '../fields/field-editor';

interface NodeCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nodeTypes: NodeType[];
    onCreateNode: (node: TreeNode) => void;
    parentNodeId?: string;
}

export function NodeCreateModal({ open, onOpenChange, nodeTypes, onCreateNode, parentNodeId }: NodeCreateModalProps) {
    const [selectedType, setSelectedType] = useState<NodeType | null>(null);
    const [nodeName, setNodeName] = useState('');
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
    const [nodeIcon, setNodeIcon] = useState<string | undefined>(undefined);
    const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
    const { t } = useI18n();

    // タイプが選択されたらフィールドを初期化
    useEffect(() => {
        if (selectedType) {
            const initialFields = selectedType.fieldDefinitions.map((def) => ({
                id: uuidv4(),
                name: def.name,
                value: '',
                type: def.type,
                definitionId: def.id,
            }));
            setCustomFields(initialFields);
            // ノードタイプのアイコンをデフォルトとして設定（ノードアイコンは未設定）
            setNodeIcon(undefined);
        } else {
            setCustomFields([]);
            setNodeIcon(undefined);
        }
    }, [selectedType]);

    // フォームをリセット
    const resetForm = () => {
        setSelectedType(null);
        setNodeName('');
        setCustomFields([]);
        setFormErrors({});
        setNodeIcon(undefined);
    };

    // モーダルが閉じられたときにフォームをリセット
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetForm();
        }
        onOpenChange(open);
    };

    // フィールド値の更新
    const handleFieldChange = (id: string, value: string) => {
        setCustomFields((prev) =>
            prev.map((field) => {
                if (field.id === id) {
                    return { ...field, value };
                }
                return field;
            }),
        );

        // エラーがあれば消去
        if (formErrors[id]) {
            setFormErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[id];
                return newErrors;
            });
        }
    };

    // アイコンの更新（絵文字）
    const handleUpdateIcon = (emoji: string) => {
        setNodeIcon(emoji);
    };

    // アイコンの更新（URL）
    const handleUpdateIconUrl = (url: string) => {
        setNodeIcon(url);
    };

    // アイコンをクリア
    const handleClearIcon = () => {
        setNodeIcon(undefined);
    };

    // アイコンが画像URLかどうかを判定
    const isImageUrl = (url?: string) => {
        return url?.startsWith && url?.startsWith('http');
    };

    // アイコンのプレビューを表示
    const renderIconPreview = (icon?: string) => {
        if (!icon) return null;

        if (isImageUrl(icon)) {
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

    // ノードの作成処理
    const handleCreate = () => {
        // バリデーション
        const errors = validateNodeForm(nodeName, selectedType, customFields, t);

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        // 新しいノードを作成して親コンポーネントに渡す
        const newNode: TreeNode = {
            id: uuidv4(),
            name: nodeName,
            children: [],
            customFields,
            nodeType: selectedType?.id,
            icon: nodeIcon, // アイコンフィールドを設定
        };

        onCreateNode(newNode);
        handleOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className='sm:max-w-md md:max-w-lg max-h-[90vh]'>
                <DialogHeader>
                    <DialogTitle>
                        {parentNodeId ? t('dialogs.node.create.childTitle') : t('dialogs.node.create.rootTitle')}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className='max-h-[70vh] pr-4'>
                    <div className='py-4 space-y-4'>
                        {/* タイプ選択 */}
                        <div>
                            <Label className='text-sm font-semibold mb-2 block'>
                                {t('dialogs.node.create.selectType')} <span className='text-red-500'>*</span>
                            </Label>
                            <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                                {nodeTypes.map((type) => (
                                    <div
                                        key={type.id}
                                        className={`border rounded-md p-3 cursor-pointer transition-colors
                      ${selectedType?.id === type.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                                        onClick={() => setSelectedType(type)}
                                    >
                                        <div className='flex items-center gap-2'>
                                            <span className='text-xl'>{type.icon}</span>
                                            <span className='font-medium'>{type.name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {nodeTypes.length === 0 && (
                                <div className='text-center py-4 text-sm text-muted-foreground'>
                                    {t('dialogs.node.create.typeNotDefined')}
                                </div>
                            )}
                        </div>

                        {selectedType && (
                            <>
                                {/* ノード名 */}
                                <div>
                                    <Label htmlFor='node-name' className='text-sm font-semibold mb-1 block'>
                                        {t('dialogs.node.create.nodeName')} <span className='text-red-500'>*</span>
                                    </Label>
                                    <Input
                                        id='node-name'
                                        value={nodeName}
                                        onChange={(e) => setNodeName(e.target.value)}
                                        className={formErrors['nodeName'] ? 'border-red-500' : ''}
                                    />
                                    {formErrors['nodeName'] && (
                                        <p className='text-red-500 text-xs mt-1'>{formErrors['nodeName']}</p>
                                    )}
                                </div>

                                {/* アイコン（任意） */}
                                <div>
                                    <Label htmlFor='icon' className='text-sm font-semibold mb-1 block'>
                                        {t('dialogs.node.create.icon.label')}
                                    </Label>
                                    <IconEditor
                                        currentIcon={nodeIcon}
                                        onChange={(icon) => setNodeIcon(icon)}
                                        onClear={handleClearIcon}
                                    />
                                </div>

                                {/* カスタムフィールド */}
                                <div>
                                    <Label className='text-sm font-semibold mb-2 block'>
                                        {selectedType.name}
                                        {t('dialogs.node.create.fields.label')}
                                    </Label>
                                    <div className='space-y-3'>
                                        {customFields.map((field) => {
                                            const fieldDef = selectedType.fieldDefinitions.find(
                                                (def) => def.id === field.definitionId,
                                            );
                                            return (
                                                <div key={field.id} className='space-y-1'>
                                                    <Label
                                                        htmlFor={`field-${field.id}`}
                                                        className='text-xs flex items-center'
                                                    >
                                                        {field.name}
                                                        {fieldDef?.required && (
                                                            <span className='text-red-500 ml-1'>*</span>
                                                        )}
                                                    </Label>
                                                    <FieldEditor
                                                        field={field}
                                                        updateField={(id, key, value) => {
                                                            if (key === 'value') {
                                                                handleFieldChange(id, value);
                                                            }
                                                        }}
                                                        validationError={formErrors[field.id]}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className='gap-2'>
                    <Button type='button' variant='outline' onClick={() => handleOpenChange(false)}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type='button'
                        onClick={handleCreate}
                        disabled={!selectedType || !nodeName.trim() || nodeTypes.length === 0}
                    >
                        {t('dialogs.node.create.createButton')}
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* URL入力ダイアログ */}
            <UrlInputDialog
                open={isUrlDialogOpen}
                onOpenChange={setIsUrlDialogOpen}
                onUrlSubmit={handleUpdateIconUrl}
                currentUrl={isImageUrl(nodeIcon) ? nodeIcon : ''}
            />
        </Dialog>
    );
}
