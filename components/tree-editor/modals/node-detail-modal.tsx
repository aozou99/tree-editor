'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Edit, Save, Play, Pause, AlertCircle } from 'lucide-react';
import { UrlInputDialog } from './url-input-dialog';
import { TreeNode, NodeType, CustomField, FieldType } from '@/components/tree-editor/types';
import { isBase64Image } from '@/components/tree-editor/utils/image-utils';
import { validateNodeForm } from '@/components/tree-editor/utils/validation-utils';
import { useI18n } from '@/utils/i18n/i18n-context';
import { IconEditor } from '../media/icon-editor';
import { FieldEditor } from '../fields/field-editor';
import { FieldDisplay } from '../fields/field-display';

interface NodeDetailModalProps {
    node: TreeNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateNode: (node: TreeNode) => void;
    nodeTypes: NodeType[];
}

// FieldEditor用のインターフェース作成
interface FieldEditorWrapperProps {
    customFields: CustomField[];
    currentNodeType: NodeType | null;
    updateCustomField: (id: string, key: keyof CustomField, value: string) => void;
    updateCustomFieldType: (id: string, type: FieldType) => void;
    removeCustomField: (id: string) => void;
    urlValidationErrors: { [key: string]: string };
}

// カスタムフィールド編集用コンポーネント
function FieldEditorWrapper({
    customFields,
    currentNodeType,
    updateCustomField,
    updateCustomFieldType,
    removeCustomField,
    urlValidationErrors,
}: FieldEditorWrapperProps) {
    return (
        <div className='space-y-3'>
            {customFields.map((field) => (
                <FieldEditor
                    key={field.id}
                    field={field}
                    updateField={updateCustomField}
                    updateFieldType={!currentNodeType ? updateCustomFieldType : undefined}
                    removeField={!currentNodeType ? removeCustomField : undefined}
                    disabled={false}
                    validationError={urlValidationErrors[field.id]}
                />
            ))}
        </div>
    );
}

// FieldDisplay用のインターフェース作成
interface FieldDisplayWrapperProps {
    customFields: CustomField[];
    audioPlayers: { [key: string]: boolean };
    audioRefs: React.MutableRefObject<{ [key: string]: HTMLAudioElement | null }>;
    audioErrors: { [key: string]: string };
    toggleAudioPlayback: (fieldId: string) => void;
    handleAudioEnded: (fieldId: string) => void;
    handleAudioError: (fieldId: string) => void;
}

// カスタムフィールド表示用コンポーネント
function FieldDisplayWrapper({
    customFields,
    audioPlayers,
    audioRefs,
    audioErrors,
    toggleAudioPlayback,
    handleAudioEnded,
    handleAudioError,
}: FieldDisplayWrapperProps) {
    const { t } = useI18n();

    return (
        <>
            {customFields?.map((field) => (
                <div key={field.id} className='mb-4'>
                    <div className='flex items-center mb-1'>
                        <div className='text-sm font-medium text-foreground'>{field.name}</div>
                        {field.type === 'text' && (
                            <span className='ml-2 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded text-[10px]'>
                                Text
                            </span>
                        )}
                        {field.type === 'link' && (
                            <span className='ml-2 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded text-[10px]'>
                                URL
                            </span>
                        )}
                        {field.type === 'textarea' && (
                            <span className='ml-2 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded text-[10px]'>
                                Text Area
                            </span>
                        )}
                        {field.type === 'youtube' && (
                            <span className='ml-2 px-1.5 py-0.5 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 rounded text-[10px]'>
                                YouTube
                            </span>
                        )}
                        {field.type === 'image' && (
                            <span className='ml-2 px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 rounded text-[10px]'>
                                Image
                            </span>
                        )}
                        {field.type === 'audio' && (
                            <span className='ml-2 px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 rounded text-[10px]'>
                                Audio
                            </span>
                        )}
                    </div>

                    {field.type === 'audio' ? (
                        <div className='bg-muted/30 p-2 rounded-md'>
                            <div className='flex items-center gap-2'>
                                <Button
                                    variant='outline'
                                    size='icon'
                                    className='h-10 w-10 rounded-full'
                                    onClick={() => toggleAudioPlayback(field.id)}
                                >
                                    {audioPlayers[field.id] ? <Pause size={18} /> : <Play size={18} />}
                                </Button>
                                <audio
                                    ref={(el) => {
                                        audioRefs.current[field.id] = el;
                                        return undefined;
                                    }}
                                    src={field.value}
                                    onEnded={() => handleAudioEnded(field.id)}
                                    onError={() => handleAudioError(field.id)}
                                    className='hidden'
                                />
                                <div className='text-sm'>
                                    {field.value?.startsWith('data:audio/')
                                        ? t('media.audio.uploadedFile')
                                        : field.value}
                                </div>
                            </div>
                            {audioErrors[field.id] && (
                                <div className='mt-2 text-red-500 text-sm flex items-center'>
                                    <AlertCircle size={16} className='mr-1' />
                                    {audioErrors[field.id]}
                                </div>
                            )}
                        </div>
                    ) : (
                        <FieldDisplay field={field} />
                    )}
                </div>
            ))}
        </>
    );
}

export function NodeDetailModal({ node, open, onOpenChange, onUpdateNode, nodeTypes }: NodeDetailModalProps) {
    // nodeが存在しない場合は何も表示しない
    const [isEditing, setIsEditing] = useState(false);
    const [editedNode, setEditedNode] = useState<TreeNode>({ ...node });

    const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
    const [urlValidationErrors, setUrlValidationErrors] = useState<{ [key: string]: string }>({});
    const [audioPlayers, setAudioPlayers] = useState<{ [key: string]: boolean }>({});
    const [audioErrors, setAudioErrors] = useState<{ [key: string]: string }>({});
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
    const { t } = useI18n();

    // 現在のノードタイプ情報を取得
    const getCurrentNodeType = useCallback(() => {
        if (!editedNode.nodeType) return null;
        return nodeTypes.find((type) => type.id === editedNode.nodeType) || null;
    }, [editedNode.nodeType, nodeTypes]);

    // ノードの更新時にフィールドを初期化
    useEffect(() => {
        if (node && node.id) {
            setEditedNode({ ...node });
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
            // バリデーションを実行
            const errors = validateNodeForm(editedNode.name, getCurrentNodeType(), editedNode.customFields || [], t);

            // エラーがあれば表示して保存しない
            if (Object.keys(errors).length > 0) {
                setUrlValidationErrors(errors);
                return;
            }

            // 編集モードを終了するときに変更を保存
            onUpdateNode(editedNode);
            setIsEditing(false);
        } else {
            // 編集モードを開始
            setEditedNode({ ...node }); // 最新のノード情報で初期化
            setIsEditing(true);
        }
    };

    // URLが有効かチェック

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
    const updateCustomFieldType = (id: string, type: FieldType) => {
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
        }
        onOpenChange(open);
    };

    // 画像URLか絵文字かを判断
    const isImageUrl = (url?: string) => {
        return url?.startsWith && url?.startsWith('http');
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
                            console.error(t('media.audio.errors.playbackError'), error);
                            setAudioErrors((prev) => ({
                                ...prev,
                                [fieldId]: t('media.audio.errors.playbackError'),
                            }));
                            newState[fieldId] = false;
                        });
                    }
                }
            } catch (error) {
                console.error(t('media.audio.errors.playbackError'), error);
                setAudioErrors((prev) => ({
                    ...prev,
                    [fieldId]: t('media.audio.errors.playbackError'),
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
            [fieldId]: t('dialogs.node.detail.audio.loadError'),
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
                    <DialogTitle>
                        {isEditing ? t('dialogs.node.detail.editTitle') : t('dialogs.node.detail.title')}
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className='max-h-[70vh] pr-4'>
                    <div className='py-4'>
                        {/* ノードタイプ選択 */}
                        {isEditing && (
                            <div className='mb-4'>
                                <Label htmlFor='node-type' className='text-sm font-semibold mb-1 block'>
                                    {t('dialogs.node.detail.typeLabel')}
                                </Label>
                                <Select value={editedNode.nodeType || ''} onValueChange={handleNodeTypeChange}>
                                    <SelectTrigger id='node-type'>
                                        <SelectValue placeholder={t('dialogs.nodeType.typeNamePlaceholder')} />
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
                                <Label className='text-sm font-semibold mb-1 block'>
                                    {t('dialogs.node.detail.typeLabel')}
                                </Label>
                                <div className='p-2 bg-muted/50 rounded-md flex items-center'>
                                    <span className='text-xl mr-2'>{currentNodeType.icon}</span>
                                    <span>{currentNodeType.name}</span>
                                </div>
                            </div>
                        )}

                        {/* 固定フィールド: ノード名 */}
                        <div className='mb-4'>
                            <Label htmlFor='node-name' className='text-sm font-semibold mb-1 block'>
                                {t('dialogs.node.detail.nameLabel')} <span className='text-red-500'>*</span>
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
                                {t('dialogs.node.detail.iconLabel')}
                            </Label>
                            {isEditing ? (
                                <IconEditor
                                    currentIcon={editedNode.icon}
                                    onChange={handleUpdateIcon}
                                    onClear={handleClearIcon}
                                />
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
                                                    ? t('dialogs.node.detail.customIconText')
                                                    : currentNodeType
                                                    ? t('dialogs.node.detail.usingTypeIcon')
                                                    : t('dialogs.node.detail.noIcon')}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className='text-sm text-muted-foreground'>
                                            {t('dialogs.nodeType.noIcon')}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* カスタムフィールド */}
                        <div>
                            <div className='flex justify-between items-center mb-2'>
                                <Label className='text-sm font-semibold'>{t('dialogs.node.detail.customFields')}</Label>
                                {isEditing && !currentNodeType && (
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        onClick={addCustomField}
                                        className='flex items-center text-xs h-7'
                                    >
                                        <PlusCircle size={14} className='mr-1' />
                                        {t('dialogs.node.detail.addField')}
                                    </Button>
                                )}
                            </div>

                            {/* カスタムフィールド一覧 */}
                            <div className='space-y-2'>
                                {editedNode.customFields && editedNode.customFields.length > 0 ? (
                                    <>
                                        {isEditing ? (
                                            <FieldEditorWrapper
                                                customFields={editedNode.customFields}
                                                currentNodeType={currentNodeType}
                                                updateCustomField={updateCustomField}
                                                updateCustomFieldType={updateCustomFieldType}
                                                removeCustomField={removeCustomField}
                                                urlValidationErrors={urlValidationErrors}
                                            />
                                        ) : (
                                            <Card>
                                                <CardContent className='p-4 grid gap-3'>
                                                    <FieldDisplayWrapper
                                                        customFields={node.customFields || []}
                                                        audioPlayers={audioPlayers}
                                                        audioRefs={audioRefs}
                                                        audioErrors={audioErrors}
                                                        toggleAudioPlayback={toggleAudioPlayback}
                                                        handleAudioEnded={handleAudioEnded}
                                                        handleAudioError={handleAudioError}
                                                    />
                                                </CardContent>
                                            </Card>
                                        )}
                                    </>
                                ) : (
                                    <div className='text-center py-4 text-sm text-muted-foreground'>
                                        {t('dialogs.node.detail.noCustomFields')}
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
                                {t('dialogs.node.detail.saveButton')}
                            </>
                        ) : (
                            <>
                                <Edit size={16} className='mr-2' />
                                {t('dialogs.node.detail.editButton')}
                            </>
                        )}
                    </Button>
                    <Button type='button' variant='ghost' onClick={() => handleOpenChange(false)}>
                        {t('dialogs.node.detail.closeButton')}
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
