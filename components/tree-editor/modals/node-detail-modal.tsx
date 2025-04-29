'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Edit, Save, Trash, Link, ExternalLink, Play, Pause, AlertCircle } from 'lucide-react';
import { EmojiPicker } from '../../emoji-picker';
import { UrlInputDialog } from '../../url-input-dialog';
import { YouTubeEmbed } from '../../youtube-embed';
import { ImageUpload } from '../../image-upload';
import { AudioUpload } from '../../audio-upload';
import { TreeNode, NodeType, CustomField } from '@/components/tree-editor/types';
import { isBase64Image } from '@/components/tree-editor/utils/image-utils';

interface NodeDetailModalProps {
    node: TreeNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateNode: (node: TreeNode) => void;
    nodeTypes: NodeType[];
}

export function NodeDetailModal({ node, open, onOpenChange, onUpdateNode, nodeTypes }: NodeDetailModalProps) {
    // nodeが存在しない場合は何も表示しない
    const [isEditing, setIsEditing] = useState(false);
    const [editedNode, setEditedNode] = useState<TreeNode>({ ...node });
    const [originalNodeType, setOriginalNodeType] = useState<string | undefined>(node?.nodeType);
    const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
    const [urlValidationErrors, setUrlValidationErrors] = useState<{ [key: string]: string }>({});
    const [audioPlayers, setAudioPlayers] = useState<{ [key: string]: boolean }>({});
    const [audioErrors, setAudioErrors] = useState<{ [key: string]: string }>({});
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

    // 現在のノードタイプ情報を取得
    const getCurrentNodeType = useCallback(() => {
        if (!editedNode.nodeType) return null;
        return nodeTypes.find((type) => type.id === editedNode.nodeType) || null;
    }, [editedNode.nodeType, nodeTypes]);

    // ノードの更新時にフィールドを初期化
    useEffect(() => {
        if (node && node.id) {
            setEditedNode({ ...node });
            setOriginalNodeType(node.nodeType);
            setIsEditing(false);
            setUrlValidationErrors({});
            setAudioPlayers({});
            setAudioErrors({});
        }
    }, [node]);

    if (!node || !node.id) {
        return null;
    }

    // 編集モードをトグル
    const toggleEditMode = () => {
        if (isEditing) {
            // URLフィールドのバリデーション
            const errors: { [key: string]: string } = {};
            let hasErrors = false;

            editedNode.customFields?.forEach((field) => {
                if (field.type === 'link' && field.value) {
                    if (!isValidUrl(field.value)) {
                        errors[field.id] = '有効なURLを入力してください';
                        hasErrors = true;
                    }
                }
            });

            if (hasErrors) {
                setUrlValidationErrors(errors);
                return;
            }

            // 編集モードを終了するときに変更を保存
            onUpdateNode(editedNode);
            setIsEditing(false);
        } else {
            // 編集モードを開始
            setEditedNode({ ...node }); // 最新のノード情報で初期化
            setOriginalNodeType(node.nodeType);
            setIsEditing(true);
        }
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

    // ノードタイプを変更した時に呼ばれる
    const handleNodeTypeChange = (typeId: string) => {
        const selectedType = nodeTypes.find((type) => type.id === typeId);

        if (!selectedType) return;

        // 新しいノードタイプに基づいてカスタムフィールドを初期化
        const newFields = selectedType.fieldDefinitions.map((def) => {
            // 既存のフィールドから同じ名前または同じ定義IDのものがあれば値を引き継ぐ
            const existingField = editedNode.customFields?.find(
                (field) => field.definitionId === def.id || field.name === def.name,
            );

            return {
                id: existingField?.id || uuidv4(),
                name: def.name,
                type: def.type,
                value: existingField?.value || '',
                definitionId: def.id,
            };
        });

        setEditedNode((prev) => ({
            ...prev,
            nodeType: typeId,
            customFields: newFields,
        }));
    };

    // アイコンを更新（絵文字）
    const handleUpdateIcon = (emoji: string) => {
        setEditedNode((prev) => ({
            ...prev,
            icon: emoji,
        }));
    };

    // アイコンを更新（URL）
    const handleUpdateIconUrl = (url: string) => {
        setEditedNode((prev) => ({
            ...prev,
            icon: url,
        }));
    };

    // アイコンをクリア
    const handleClearIcon = () => {
        setEditedNode((prev) => {
            const newNode = { ...prev };
            delete newNode.icon;
            return newNode;
        });
    };

    // カスタムフィールドを追加
    const addCustomField = () => {
        const newField: CustomField = {
            id: uuidv4(),
            name: '新しいフィールド',
            value: '',
            type: 'text', // デフォルトは単一行テキスト
        };
        setEditedNode((prev) => ({
            ...prev,
            customFields: [...(prev.customFields || []), newField],
        }));
    };

    // カスタムフィールドを更新
    const updateCustomField = (id: string, key: keyof CustomField, value: string) => {
        setEditedNode((prev) => ({
            ...prev,
            customFields: prev.customFields?.map((field) => {
                if (field.id === id) {
                    // リンクタイプの場合、URLバリデーションエラーをクリア
                    if ((field.type === 'link' || field.type === 'youtube') && key === 'value') {
                        setUrlValidationErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors[id];
                            return newErrors;
                        });
                    }
                    return { ...field, [key]: value };
                }
                return field;
            }),
        }));
    };

    // カスタムフィールドのタイプを更新
    const updateCustomFieldType = (id: string, type: 'text' | 'textarea' | 'link' | 'youtube' | 'image' | 'audio') => {
        setEditedNode((prev) => ({
            ...prev,
            customFields: prev.customFields?.map((field) => {
                if (field.id === id) {
                    // リンクタイプに変更された場合、URLバリデーションをクリア
                    if (type === 'link' || type === 'youtube') {
                        setUrlValidationErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors[id];
                            return newErrors;
                        });
                    }
                    return { ...field, type };
                }
                return field;
            }),
        }));
    };

    // カスタムフィールドを削除
    const removeCustomField = (id: string) => {
        setEditedNode((prev) => ({
            ...prev,
            customFields: prev.customFields?.filter((field) => field.id !== id),
        }));
        // バリデーションエラーも削除
        setUrlValidationErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[id];
            return newErrors;
        });
    };

    // モーダルを開閉する前に状態を更新
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            // モーダルを閉じるときに編集状態をリセット
            setIsEditing(false);
        } else {
            // モーダルを開くときに最新のノード情報で初期化
            setEditedNode({ ...node });
            setOriginalNodeType(node.nodeType);
        }
        onOpenChange(open);
    };

    // 画像URLか絵文字かを判断
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

    // 音声の再生/一時停止を切り替え
    const toggleAudioPlayback = (fieldId: string) => {
        const audioElement = audioRefs.current[fieldId];
        if (!audioElement) return;

        setAudioPlayers((prev) => {
            const isPlaying = prev[fieldId];

            // すべての音声を一時停止
            Object.keys(audioRefs.current).forEach((key) => {
                const audio = audioRefs.current[key];
                if (audio && key !== fieldId) {
                    audio.pause();
                }
            });

            // 現在の音声の状態を更新
            const newState = { ...prev };

            // 他の音声プレーヤーをすべて停止状態に
            Object.keys(newState).forEach((key) => {
                newState[key] = key === fieldId ? !isPlaying : false;
            });

            // 再生または一時停止
            try {
                if (isPlaying) {
                    audioElement.pause();
                } else {
                    const playPromise = audioElement.play();
                    if (playPromise !== undefined) {
                        playPromise.catch((error) => {
                            console.error('音声の再生に失敗しました:', error);
                            setAudioErrors((prev) => ({
                                ...prev,
                                [fieldId]: '音声の再生に失敗しました。サポートされていない形式かもしれません。',
                            }));
                            newState[fieldId] = false;
                        });
                    }
                }
            } catch (error) {
                console.error('音声の再生に失敗しました:', error);
                setAudioErrors((prev) => ({
                    ...prev,
                    [fieldId]: '音声の再生に失敗しました。サポートされていない形式かもしれません。',
                }));
                newState[fieldId] = false;
            }

            return newState;
        });
    };

    // 音声の再生が終了したときの処理
    const handleAudioEnded = (fieldId: string) => {
        setAudioPlayers((prev) => ({
            ...prev,
            [fieldId]: false,
        }));
    };

    // 音声ロード時のエラー処理
    const handleAudioError = (fieldId: string) => {
        setAudioErrors((prev) => ({
            ...prev,
            [fieldId]: '音声の読み込みに失敗しました。サポートされていない形式かもしれません。',
        }));
        setAudioPlayers((prev) => ({
            ...prev,
            [fieldId]: false,
        }));
    };

    // 表示するアイコンを決定
    const displayIcon = editedNode.icon || getCurrentNodeType()?.icon || null;

    const currentNodeType = getCurrentNodeType();

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className='sm:max-w-md md:max-w-lg max-h-[90vh]'>
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'ノード詳細を編集' : 'ノード詳細'}</DialogTitle>
                </DialogHeader>

                <ScrollArea className='max-h-[70vh] pr-4'>
                    <div className='py-4'>
                        {/* ノードタイプ選択 */}
                        {isEditing && (
                            <div className='mb-4'>
                                <Label htmlFor='node-type' className='text-sm font-semibold mb-1 block'>
                                    ノードタイプ
                                </Label>
                                <Select value={editedNode.nodeType || ''} onValueChange={handleNodeTypeChange}>
                                    <SelectTrigger id='node-type'>
                                        <SelectValue placeholder='タイプを選択' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {nodeTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>
                                                <div className='flex items-center gap-2'>
                                                    <span>{type.icon}</span>
                                                    <span>{type.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* ノードタイプの表示（閲覧モード） */}
                        {!isEditing && currentNodeType && (
                            <div className='mb-4'>
                                <Label className='text-sm font-semibold mb-1 block'>ノードタイプ</Label>
                                <div className='p-2 bg-muted/50 rounded-md flex items-center'>
                                    <span className='text-xl mr-2'>{currentNodeType.icon}</span>
                                    <span>{currentNodeType.name}</span>
                                </div>
                            </div>
                        )}

                        {/* 固定フィールド: ノード名 */}
                        <div className='mb-4'>
                            <Label htmlFor='node-name' className='text-sm font-semibold mb-1 block'>
                                ノード名 <span className='text-red-500'>*</span>
                            </Label>
                            {isEditing ? (
                                <Input
                                    id='node-name'
                                    value={editedNode.name}
                                    onChange={(e) => setEditedNode((prev) => ({ ...prev, name: e.target.value }))}
                                    className='w-full'
                                />
                            ) : (
                                <div className='p-2 bg-muted/50 rounded-md'>{node.name}</div>
                            )}
                        </div>

                        {/* 固定フィールド: アイコン */}
                        <div className='mb-4'>
                            <Label htmlFor='icon' className='text-sm font-semibold mb-1 block'>
                                アイコン（任意）
                            </Label>
                            {isEditing ? (
                                <div className='flex gap-2 items-center'>
                                    <div className='flex-1 border rounded-md p-2 flex items-center'>
                                        <div className='w-8 h-8 flex items-center justify-center'>
                                            {renderIconPreview(displayIcon || '')}
                                        </div>
                                        {!displayIcon && (
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
                                    <EmojiPicker onEmojiSelect={handleUpdateIcon} currentEmoji={editedNode.icon} />
                                    {editedNode.icon && (
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
                            ) : (
                                <div className='p-2 bg-muted/50 rounded-md flex items-center'>
                                    {displayIcon ? (
                                        <div className='flex items-center'>
                                            {isImageUrl(displayIcon) || isBase64Image(displayIcon) ? (
                                                <img
                                                    src={displayIcon || '/placeholder.svg'}
                                                    alt=''
                                                    className='w-6 h-6 mr-2 object-contain'
                                                    onError={(e) => {
                                                        e.currentTarget.src = '/exclamation-mark-in-nature.png';
                                                    }}
                                                />
                                            ) : (
                                                <span className='text-xl mr-2'>{displayIcon}</span>
                                            )}
                                            <span className='text-sm text-muted-foreground'>
                                                {node.icon
                                                    ? 'カスタムアイコン'
                                                    : currentNodeType
                                                    ? `ノードタイプのアイコンを使用`
                                                    : 'アイコンなし'}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className='text-sm text-muted-foreground'>設定なし</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* カスタムフィールド */}
                        <div>
                            <div className='flex justify-between items-center mb-2'>
                                <Label className='text-sm font-semibold'>カスタムフィールド</Label>
                                {isEditing && !currentNodeType && (
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        onClick={addCustomField}
                                        className='flex items-center text-xs h-7'
                                    >
                                        <PlusCircle size={14} className='mr-1' />
                                        フィールド追加
                                    </Button>
                                )}
                            </div>

                            {/* カスタムフィールド一覧 */}
                            <div className='space-y-2'>
                                {editedNode.customFields && editedNode.customFields.length > 0 ? (
                                    <>
                                        {isEditing ? (
                                            <>
                                                {editedNode.customFields.map((field) => (
                                                    <div
                                                        key={field.id}
                                                        className='grid grid-cols-[1fr_auto_2fr] gap-2 items-start'
                                                    >
                                                        <Input
                                                            value={field.name}
                                                            onChange={(e) =>
                                                                updateCustomField(field.id, 'name', e.target.value)
                                                            }
                                                            placeholder='フィールド名'
                                                            disabled={!!currentNodeType}
                                                        />
                                                        <Select
                                                            value={field.type}
                                                            onValueChange={(value) =>
                                                                updateCustomFieldType(
                                                                    field.id,
                                                                    value as
                                                                        | 'text'
                                                                        | 'textarea'
                                                                        | 'link'
                                                                        | 'youtube'
                                                                        | 'image'
                                                                        | 'audio',
                                                                )
                                                            }
                                                            disabled={!!currentNodeType}
                                                        >
                                                            <SelectTrigger className='w-[120px]'>
                                                                <SelectValue placeholder='タイプ' />
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
                                                        {field.type === 'textarea' ? (
                                                            <Textarea
                                                                value={field.value}
                                                                onChange={(e) =>
                                                                    updateCustomField(field.id, 'value', e.target.value)
                                                                }
                                                                placeholder='値'
                                                                className='min-h-[80px]'
                                                            />
                                                        ) : field.type === 'link' ? (
                                                            <div className='flex flex-col w-full'>
                                                                <Input
                                                                    value={field.value}
                                                                    onChange={(e) =>
                                                                        updateCustomField(
                                                                            field.id,
                                                                            'value',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    placeholder='https://example.com'
                                                                    className={
                                                                        urlValidationErrors[field.id]
                                                                            ? 'border-red-500'
                                                                            : ''
                                                                    }
                                                                />
                                                                {urlValidationErrors[field.id] && (
                                                                    <p className='text-red-500 text-xs mt-1'>
                                                                        {urlValidationErrors[field.id]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : field.type === 'youtube' ? (
                                                            <div className='flex flex-col w-full'>
                                                                <Input
                                                                    value={field.value}
                                                                    onChange={(e) =>
                                                                        updateCustomField(
                                                                            field.id,
                                                                            'value',
                                                                            e.target.value,
                                                                        )
                                                                    }
                                                                    placeholder='https://www.youtube.com/watch?v=...'
                                                                    className={
                                                                        urlValidationErrors[field.id]
                                                                            ? 'border-red-500'
                                                                            : ''
                                                                    }
                                                                />
                                                                {field.value && (
                                                                    <div className='mt-2'>
                                                                        <YouTubeEmbed url={field.value} />
                                                                    </div>
                                                                )}
                                                                {urlValidationErrors[field.id] && (
                                                                    <p className='text-red-500 text-xs mt-1'>
                                                                        {urlValidationErrors[field.id]}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ) : field.type === 'image' ? (
                                                            <div className='flex flex-col w-full'>
                                                                <ImageUpload
                                                                    value={field.value}
                                                                    onChange={(value) =>
                                                                        updateCustomField(field.id, 'value', value)
                                                                    }
                                                                />
                                                            </div>
                                                        ) : field.type === 'audio' ? (
                                                            <div className='flex flex-col w-full'>
                                                                <AudioUpload
                                                                    value={field.value}
                                                                    onChange={(value) =>
                                                                        updateCustomField(field.id, 'value', value)
                                                                    }
                                                                />
                                                            </div>
                                                        ) : (
                                                            <Input
                                                                value={field.value}
                                                                onChange={(e) =>
                                                                    updateCustomField(field.id, 'value', e.target.value)
                                                                }
                                                                placeholder='値'
                                                            />
                                                        )}
                                                        {!currentNodeType && (
                                                            <Button
                                                                variant='ghost'
                                                                size='icon'
                                                                onClick={() => removeCustomField(field.id)}
                                                                className='h-9 w-9'
                                                            >
                                                                <Trash size={16} />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <Card>
                                                <CardContent className='p-4 grid gap-3'>
                                                    {node.customFields?.map((field) => (
                                                        <div key={field.id} className='grid grid-cols-[1fr_2fr] gap-2'>
                                                            <div className='font-medium text-sm'>{field.name}</div>
                                                            <div className='text-sm break-words whitespace-pre-wrap'>
                                                                {field.type === 'textarea' ? (
                                                                    field.value
                                                                ) : field.type === 'link' ? (
                                                                    <a
                                                                        href={field.value}
                                                                        target='_blank'
                                                                        rel='noopener noreferrer'
                                                                        className='text-blue-600 hover:underline flex items-center'
                                                                    >
                                                                        {field.value}
                                                                        <ExternalLink size={14} className='ml-1' />
                                                                    </a>
                                                                ) : field.type === 'youtube' ? (
                                                                    <div className='mt-1'>
                                                                        <YouTubeEmbed url={field.value} />
                                                                    </div>
                                                                ) : field.type === 'image' ? (
                                                                    <div className='mt-1'>
                                                                        {field.value && (
                                                                            <img
                                                                                src={field.value || '/placeholder.svg'}
                                                                                alt={field.name}
                                                                                className='max-h-[200px] w-auto object-contain rounded-md'
                                                                                onError={(e) => {
                                                                                    e.currentTarget.src =
                                                                                        '/exclamation-mark-in-nature.png';
                                                                                }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                ) : field.type === 'audio' ? (
                                                                    <div className='mt-1'>
                                                                        {field.value && (
                                                                            <div className='flex items-center gap-2'>
                                                                                <Button
                                                                                    variant='outline'
                                                                                    size='icon'
                                                                                    className='h-10 w-10 rounded-full'
                                                                                    onClick={() =>
                                                                                        toggleAudioPlayback(field.id)
                                                                                    }
                                                                                >
                                                                                    {audioPlayers[field.id] ? (
                                                                                        <Pause size={18} />
                                                                                    ) : (
                                                                                        <Play size={18} />
                                                                                    )}
                                                                                </Button>
                                                                                <audio
                                                                                    ref={(el) => {
                                                                                        audioRefs.current[field.id] =
                                                                                            el;
                                                                                    }}
                                                                                    src={field.value}
                                                                                    onEnded={() =>
                                                                                        handleAudioEnded(field.id)
                                                                                    }
                                                                                    onError={() =>
                                                                                        handleAudioError(field.id)
                                                                                    }
                                                                                    className='hidden'
                                                                                />
                                                                                <div className='text-sm'>
                                                                                    {field.value.startsWith(
                                                                                        'data:audio/',
                                                                                    )
                                                                                        ? 'アップロードされた音声ファイル'
                                                                                        : field.value}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {audioErrors[field.id] && (
                                                                            <div className='mt-2 text-red-500 text-sm flex items-center'>
                                                                                <AlertCircle
                                                                                    size={16}
                                                                                    className='mr-1'
                                                                                />
                                                                                {audioErrors[field.id]}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    field.value
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </CardContent>
                                            </Card>
                                        )}
                                    </>
                                ) : (
                                    <div className='text-center py-4 text-sm text-muted-foreground'>
                                        カスタムフィールドはありません
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className='sm:justify-between'>
                    <Button type='button' variant={isEditing ? 'default' : 'outline'} onClick={toggleEditMode}>
                        {isEditing ? (
                            <>
                                <Save size={16} className='mr-2' />
                                保存
                            </>
                        ) : (
                            <>
                                <Edit size={16} className='mr-2' />
                                編集
                            </>
                        )}
                    </Button>
                    <Button type='button' variant='ghost' onClick={() => handleOpenChange(false)}>
                        閉じる
                    </Button>
                </DialogFooter>
            </DialogContent>

            {/* URL入力ダイアログ */}
            <UrlInputDialog
                open={isUrlDialogOpen}
                onOpenChange={setIsUrlDialogOpen}
                onUrlSubmit={handleUpdateIconUrl}
                currentUrl={isImageUrl(editedNode.icon) ? editedNode.icon : ''}
            />
        </Dialog>
    );
}
