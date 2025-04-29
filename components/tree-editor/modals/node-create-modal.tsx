'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmojiPicker } from '../../emoji-picker';
import { UrlInputDialog } from '../../url-input-dialog';
import { YouTubeEmbed } from '../../youtube-embed';
import { ImageUpload } from '../../image-upload';
import { AudioUpload } from '../../audio-upload';
import { Link } from 'lucide-react';
import type { NodeType, TreeNode, CustomField } from '../../tree-editor';

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

    // URLが有効かチェック
    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    };

    // YouTubeのURLかどうかをチェック
    const isValidYouTubeUrl = (url: string): boolean => {
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        return youtubeRegex.test(url);
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
        const errors: { [key: string]: string } = {};

        if (!nodeName.trim()) {
            errors['nodeName'] = 'ノード名は必須です';
        }

        if (selectedType) {
            selectedType.fieldDefinitions.forEach((def) => {
                if (def.required) {
                    const field = customFields.find((f) => f.definitionId === def.id);
                    if (!field || !field.value.trim()) {
                        errors[field?.id || def.id] = `${def.name}は必須です`;
                    }
                }
            });

            // リンクフィールドのURLバリデーション
            customFields.forEach((field) => {
                if (field.type === 'link' && field.value) {
                    if (!isValidUrl(field.value)) {
                        errors[field.id] = '有効なURLを入力してください';
                    }
                }

                // YouTubeフィールドのURLバリデーション
                if (field.type === 'youtube' && field.value) {
                    if (!isValidYouTubeUrl(field.value)) {
                        errors[field.id] = '有効なYouTube URLを入力してください';
                    }
                }
            });
        }

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
                    <DialogTitle>{parentNodeId ? '子ノードの追加' : 'ルートノードの追加'}</DialogTitle>
                </DialogHeader>

                <ScrollArea className='max-h-[70vh] pr-4'>
                    <div className='py-4 space-y-4'>
                        {/* タイプ選択 */}
                        <div>
                            <Label className='text-sm font-semibold mb-2 block'>
                                ノードタイプを選択 <span className='text-red-500'>*</span>
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
                                    ノードタイプが定義されていません。先にノードタイプを作成してください。
                                </div>
                            )}
                        </div>

                        {selectedType && (
                            <>
                                {/* ノード名 */}
                                <div>
                                    <Label htmlFor='node-name' className='text-sm font-semibold mb-1 block'>
                                        ノード名 <span className='text-red-500'>*</span>
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
                                        アイコン（任意）
                                    </Label>
                                    <div className='flex gap-2 items-center'>
                                        <div className='flex-1 border rounded-md p-2 flex items-center'>
                                            <div className='w-8 h-8 flex items-center justify-center'>
                                                {renderIconPreview(nodeIcon)}
                                            </div>
                                            {!nodeIcon && (
                                                <div className='text-sm text-muted-foreground ml-2'>
                                                    アイコンが設定されていません（ノードタイプのアイコンが使用されます）
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
                                        <EmojiPicker onEmojiSelect={handleUpdateIcon} currentEmoji={nodeIcon} />
                                        {nodeIcon && (
                                            <Button
                                                variant='outline'
                                                size='sm'
                                                onClick={handleClearIcon}
                                                className='text-xs'
                                                title='アイコンをクリア'
                                            >
                                                クリア
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* カスタムフィールド */}
                                <div>
                                    <Label className='text-sm font-semibold mb-2 block'>
                                        {selectedType.name}のフィールド
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
                                                    {field.type === 'textarea' ? (
                                                        <Textarea
                                                            id={`field-${field.id}`}
                                                            value={field.value}
                                                            onChange={(e) =>
                                                                handleFieldChange(field.id, e.target.value)
                                                            }
                                                            className={formErrors[field.id] ? 'border-red-500' : ''}
                                                        />
                                                    ) : field.type === 'link' ? (
                                                        <div className='flex flex-col w-full'>
                                                            <Input
                                                                id={`field-${field.id}`}
                                                                value={field.value}
                                                                onChange={(e) =>
                                                                    handleFieldChange(field.id, e.target.value)
                                                                }
                                                                placeholder='https://example.com'
                                                                className={formErrors[field.id] ? 'border-red-500' : ''}
                                                            />
                                                            {formErrors[field.id] && (
                                                                <p className='text-red-500 text-xs mt-1'>
                                                                    {formErrors[field.id]}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : field.type === 'youtube' ? (
                                                        <div className='flex flex-col w-full'>
                                                            <Input
                                                                id={`field-${field.id}`}
                                                                value={field.value}
                                                                onChange={(e) =>
                                                                    handleFieldChange(field.id, e.target.value)
                                                                }
                                                                placeholder='https://www.youtube.com/watch?v=...'
                                                                className={formErrors[field.id] ? 'border-red-500' : ''}
                                                            />
                                                            {field.value && (
                                                                <div className='mt-2'>
                                                                    <YouTubeEmbed url={field.value} />
                                                                </div>
                                                            )}
                                                            {formErrors[field.id] && (
                                                                <p className='text-red-500 text-xs mt-1'>
                                                                    {formErrors[field.id]}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : field.type === 'image' ? (
                                                        <div className='flex flex-col w-full'>
                                                            <ImageUpload
                                                                value={field.value}
                                                                onChange={(value) => handleFieldChange(field.id, value)}
                                                            />
                                                            {formErrors[field.id] && (
                                                                <p className='text-red-500 text-xs mt-1'>
                                                                    {formErrors[field.id]}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : field.type === 'audio' ? (
                                                        <div className='flex flex-col w-full'>
                                                            <AudioUpload
                                                                value={field.value}
                                                                onChange={(value) => handleFieldChange(field.id, value)}
                                                            />
                                                            {formErrors[field.id] && (
                                                                <p className='text-red-500 text-xs mt-1'>
                                                                    {formErrors[field.id]}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <Input
                                                            id={`field-${field.id}`}
                                                            value={field.value}
                                                            onChange={(e) =>
                                                                handleFieldChange(field.id, e.target.value)
                                                            }
                                                            className={formErrors[field.id] ? 'border-red-500' : ''}
                                                        />
                                                    )}
                                                    {formErrors[field.id] && (
                                                        <p className='text-red-500 text-xs'>{formErrors[field.id]}</p>
                                                    )}
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
                        キャンセル
                    </Button>
                    <Button
                        type='button'
                        onClick={handleCreate}
                        disabled={!selectedType || !nodeName.trim() || nodeTypes.length === 0}
                    >
                        作成
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
